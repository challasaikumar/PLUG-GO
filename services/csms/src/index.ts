import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import { WebSocketServer, type WebSocket } from "ws";
import { sha256Hex } from "../../../src/lib/auth/crypto";
import {
  csmsAllowInsecureLocal,
  csmsListenHost,
  csmsListenPort,
  csmsTlsCertPath,
  csmsTlsKeyPath,
  getCsmsMode,
  maxOcppPayloadBytes,
  ocppEnabled,
} from "../../../src/lib/ocpp/config";
import {
  authorizeChargePointConnection,
  hashRemoteAddress,
  recordConnectionChange,
} from "../../../src/lib/ocpp/authorize-connection";
import { csmsEventIngestor } from "../../../src/lib/ocpp/ingest";
import { chargerConnectionRegistry } from "../../../src/lib/ocpp/registry";
import { verifyInternalSignature } from "../../../src/lib/ocpp/hmac";
import { protocolFromPath } from "../../../src/lib/ocpp/versions";
import { redactOcppFrameText } from "../../../src/lib/ocpp/redact";
import { markExpiredHeartbeats } from "../../../src/lib/ocpp/ingest";
import { csmsCommandService } from "../../../src/lib/ocpp/commands";
import type { ChargePoint } from "@prisma/client";

process.env.CSMS_PROCESS = "true";

let shuttingDown = false;
if (!process.env.OCPP_EVENT_PUBLISHER_URL?.trim() && process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  process.env.OCPP_EVENT_PUBLISHER_URL = `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/api/internal/realtime`;
}

function log(event: string, fields: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), service: "csms", event, ...fields })}\n`);
}

function parseBasic(header: string | undefined): { user: string; password: string } | null {
  if (!header || !header.toLowerCase().startsWith("basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { user: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

function rejectUpgrade(socket: { write: (chunk: string) => void; destroy: () => void }, status: number, reason: string) {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function createServer() {
  const host = csmsListenHost();
  const production = process.env.NODE_ENV === "production";
  const certPath = csmsTlsCertPath();
  const keyPath = csmsTlsKeyPath();
  const localInsecure = csmsAllowInsecureLocal() && (host === "127.0.0.1" || host === "localhost");

  if (production && !certPath && !keyPath && !localInsecure) {
    throw new Error(
      "CSMS refuses to listen without TLS in production. Set CSMS_TLS_CERT_PATH and CSMS_TLS_KEY_PATH, or CSMS_ALLOW_INSECURE_LOCAL=true bound to 127.0.0.1 only for isolated lab use.",
    );
  }

  if (certPath && keyPath) {
    return https.createServer({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    });
  }
  return http.createServer();
}

async function handleControl(req: http.IncomingMessage, res: http.ServerResponse, body: string) {
  const url = new URL(req.url ?? "/", "http://csms.local");
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "plug-and-go-csms",
        mode: getCsmsMode(),
        ocppEnabled: ocppEnabled(),
        connections: chargerConnectionRegistry.size(),
        tls: Boolean(csmsTlsCertPath()),
        shuttingDown,
      }),
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/ready") {
    const ready = !shuttingDown && ocppEnabled();
    res.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: ready,
        ready,
        service: "plug-and-go-csms",
        mode: getCsmsMode(),
        ocppEnabled: ocppEnabled(),
        connections: chargerConnectionRegistry.size(),
        shuttingDown,
      }),
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/internal/commands") {
    const timestamp = String(req.headers["x-png-csms-timestamp"] ?? "");
    const signature = String(req.headers["x-png-csms-signature"] ?? "");
    if (!verifyInternalSignature(body, timestamp, signature)) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "invalid_internal_signature" }));
      return;
    }
    let parsed: { identity?: string; rawFrame?: string; uniqueId?: string; commandId?: string };
    try {
      parsed = JSON.parse(body) as { identity?: string; rawFrame?: string; uniqueId?: string; commandId?: string };
    } catch {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }
    if (!parsed.identity || !parsed.rawFrame) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "missing_fields" }));
      return;
    }
    const delivered = chargerConnectionRegistry.send(parsed.identity, parsed.rawFrame);
    log("command_dispatch", {
      identityHash: sha256Hex(parsed.identity).slice(0, 12),
      uniqueId: parsed.uniqueId,
      delivered,
    });
    res.writeHead(delivered ? 200 : 409, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: delivered, delivered, reason: delivered ? undefined : "not_connected" }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
}

async function attachSocket(ws: WebSocket, chargePoint: ChargePoint, identity: string, remoteHash: string | null) {
  const registered = chargerConnectionRegistry.tryRegister({
    chargePointId: chargePoint.id,
    identity,
    socket: {
      send: (data) => ws.send(data),
      close: (code, reason) => ws.close(code, reason),
    },
    connectedAt: new Date(),
    remoteAddressHash: remoteHash,
  });
  if (!registered.ok) {
    ws.close(1008, "duplicate");
    return;
  }
  await recordConnectionChange({
    chargePointId: chargePoint.id,
    state: "connected",
    reason: "websocket_accepted",
    remoteAddressHash: remoteHash,
  });
  log("charger_connected", { chargePointId: chargePoint.id, protocol: chargePoint.protocolVersion });

  ws.on("message", async (data) => {
    const raw = typeof data === "string" ? data : data.toString("utf8");
    if (Buffer.byteLength(raw) > maxOcppPayloadBytes()) {
      log("payload_rejected", { chargePointId: chargePoint.id });
      ws.close(1009, "payload_limit");
      return;
    }
    try {
      const result = await csmsEventIngestor.ingestRaw({ chargePoint, raw });
      log("ocpp_in", {
        chargePointId: chargePoint.id,
        parseResult: result.parseResult,
        duplicate: result.duplicate,
        preview: redactOcppFrameText(raw).slice(0, 180),
      });
      if (result.response) {
        const adapter = csmsEventIngestor.adapterForChargePoint(chargePoint);
        ws.send(adapter.serialize(result.response));
      }
    } catch (error) {
      log("ingest_error", { chargePointId: chargePoint.id, error: error instanceof Error ? error.message : "unknown" });
    }
  });

  ws.on("close", async (code, reasonBuf) => {
    chargerConnectionRegistry.remove(identity);
    await recordConnectionChange({
      chargePointId: chargePoint.id,
      state: "disconnected",
      reason: `code_${code}:${reasonBuf.toString() || "closed"}`,
      remoteAddressHash: remoteHash,
    });
    log("charger_disconnected", { chargePointId: chargePoint.id, code });
  });
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required for the CSMS process.");
  }
  const server = createServer();
  const wss = new WebSocketServer({ noServer: true, maxPayload: maxOcppPayloadBytes() });

  server.on("upgrade", async (req, socket, head) => {
    const host = req.headers.host ?? "localhost";
    const url = new URL(req.url ?? "/", `http://${host}`);
    const parsed = protocolFromPath(url.pathname);
    if (!parsed) {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }
    const basic = parseBasic(req.headers.authorization);
    const identity = parsed.identity;
    if (basic && basic.user !== identity) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }
    const remoteHash = hashRemoteAddress(req.socket.remoteAddress);
    const auth = await authorizeChargePointConnection({
      identity,
      pathVersion: parsed.version,
      password: basic?.password ?? null,
      duplicate: chargerConnectionRegistry.has(identity),
      connectionCount: chargerConnectionRegistry.size(),
      ipCount: chargerConnectionRegistry.countForIp(remoteHash),
    });
    if (!auth.ok) {
      log("charger_rejected", { reason: auth.reason, identityHash: sha256Hex(identity).slice(0, 12) });
      const status = auth.reason === "unknown_charge_point" || auth.reason === "unauthorized" ? 401 : 403;
      rejectUpgrade(socket, status, "Forbidden");
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      void attachSocket(ws, auth.chargePoint, identity, remoteHash);
    });
  });

  server.on("request", (req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const size = chunks.reduce((sum, part) => sum + part.length, 0);
      if (size > maxOcppPayloadBytes()) {
        req.destroy();
      }
    });
    req.on("end", () => {
      void handleControl(req, res, Buffer.concat(chunks).toString("utf8"));
    });
  });

  const staleTimer = setInterval(() => {
    void markExpiredHeartbeats().catch((error) => {
      log("stale_job_error", { error: error instanceof Error ? error.message : "unknown" });
    });
    void csmsCommandService.reconcileTimeouts().catch((error) => {
      log("timeout_job_error", { error: error instanceof Error ? error.message : "unknown" });
    });
  }, 30_000);

  const shutdown = () => {
    shuttingDown = true;
    log("shutdown", {});
    clearInterval(staleTimer);
    chargerConnectionRegistry.closeAll(1001, "csms_shutdown");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 4000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  const port = csmsListenPort();
  const host = csmsListenHost();
  server.listen(port, host, () => {
    log("listen", {
      host,
      port,
      mode: getCsmsMode(),
      ocppEnabled: ocppEnabled(),
      pathExample: "/ocpp/1.6/{chargePointIdentity}",
    });
  });
}

void main();
