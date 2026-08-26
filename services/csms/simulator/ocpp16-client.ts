/**
 * OCPP 1.6 JSON simulator for the Plug and Go CSMS.
 * Usage: npm run csms:simulator -- --identity PNG-SIM-001 --password <one-time>
 * Never point this at a customer-facing production charger endpoint.
 */
import WebSocket from "ws";

function arg(name: string, fallback?: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1] as string;
  const env = process.env[`OCPP_SIM_${name.toUpperCase()}`]?.trim();
  if (env) return env;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing --${name}`);
}

const identity = arg("identity", process.env.OCPP_SIM_IDENTITY ?? "PNG-SIM-001");
const password = arg("password", process.env.OCPP_SIM_PASSWORD ?? "");
const base = (process.env.CSMS_WSS_BASE_URL?.trim() || "ws://127.0.0.1:9000").replace(/\/+$/, "");
const url = `${base}/ocpp/1.6/${encodeURIComponent(identity)}`;
const scenario = arg("scenario", "boot-heartbeat-available");

function call(uniqueId: string, action: string, payload: Record<string, unknown>) {
  return JSON.stringify([2, uniqueId, action, payload]);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!password) {
    throw new Error("Simulator password required (--password). Do not commit it.");
  }
  const ws = new WebSocket(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${identity}:${password}`).toString("base64")}`,
    },
  });

  const pending = new Map<string, (payload: unknown) => void>();

  ws.on("open", async () => {
    process.stdout.write(`${JSON.stringify({ event: "connected", url, scenario })}\n`);
    ws.send(
      call("boot-1", "BootNotification", {
        chargePointVendor: "PlugAndGoSim",
        chargePointModel: "SIM-1.6",
        chargePointSerialNumber: "SIM-SERIAL-NOT-PRODUCTION",
        firmwareVersion: "sim-0.1.0",
      }),
    );
    await wait(200);
    ws.send(call("hb-1", "Heartbeat", {}));
    await wait(200);

    if (scenario.includes("available")) {
      ws.send(
        call("st-avail", "StatusNotification", {
          connectorId: 1,
          status: "Available",
          errorCode: "NoError",
          timestamp: new Date().toISOString(),
        }),
      );
    }
    if (scenario.includes("fault")) {
      ws.send(
        call("st-fault", "StatusNotification", {
          connectorId: 1,
          status: "Faulted",
          errorCode: "GroundFailure",
          timestamp: new Date().toISOString(),
        }),
      );
    }
    if (scenario.includes("heartbeat-only")) {
      return;
    }
  });

  ws.on("message", async (data) => {
    const raw = data.toString();
    process.stdout.write(`${JSON.stringify({ event: "in", raw })}\n`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(parsed)) return;
    if (parsed[0] === 2 && parsed[2] === "RemoteStartTransaction") {
      const uniqueId = String(parsed[1]);
      const payload = (parsed[3] ?? {}) as { connectorId?: number; idTag?: string };
      const accept = !scenario.includes("reject-start");
      ws.send(JSON.stringify([3, uniqueId, { status: accept ? "Accepted" : "Rejected" }]));
      if (!accept) return;
      await wait(150);
      ws.send(
        call("st-inuse", "StatusNotification", {
          connectorId: payload.connectorId ?? 1,
          status: "Charging",
          errorCode: "NoError",
          timestamp: new Date().toISOString(),
        }),
      );
      ws.send(
        call("start-1", "StartTransaction", {
          connectorId: payload.connectorId ?? 1,
          idTag: payload.idTag,
          meterStart: 0,
          timestamp: new Date().toISOString(),
        }),
      );
      await wait(100);
      ws.send(
        call("meter-1", "MeterValues", {
          connectorId: payload.connectorId ?? 1,
          transactionId: 1,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [{ value: "1500", unit: "Wh", measurand: "Energy.Active.Import.Register" }],
            },
          ],
        }),
      );
    }
    if (parsed[0] === 2 && parsed[2] === "RemoteStopTransaction") {
      const uniqueId = String(parsed[1]);
      ws.send(JSON.stringify([3, uniqueId, { status: "Accepted" }]));
      await wait(100);
      ws.send(
        call("stop-1", "StopTransaction", {
          transactionId: 1,
          meterStop: 2500,
          timestamp: new Date().toISOString(),
          reason: "Remote",
        }),
      );
    }
    if (parsed[0] === 3) {
      const cb = pending.get(String(parsed[1]));
      cb?.(parsed[2]);
    }
  });

  ws.on("close", (code, reason) => {
    process.stdout.write(`${JSON.stringify({ event: "close", code, reason: reason.toString() })}\n`);
  });
  ws.on("error", (error) => {
    process.stderr.write(`${JSON.stringify({ event: "error", message: error.message })}\n`);
  });
}

void main();
