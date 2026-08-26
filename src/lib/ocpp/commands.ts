import type { BookingActorType, RemoteCommandType } from "@prisma/client";
import { hashOpaque } from "@/lib/auth/crypto";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { getPrisma } from "@/lib/db/prisma";
import { computePublicStatus } from "@/lib/status";
import { adapterFor } from "./versions";
import {
  commandTimeoutSeconds,
  credentialPepper,
  csmsControlBaseUrl,
  remoteCommandRatePerHour,
  startEvidenceTimeoutSeconds,
} from "./config";
import { signInternalBody } from "./hmac";
import { remoteChargingPolicyGate, staffRemoteStopPolicyGate } from "./pilot";
import { chargingSessionService } from "./sessions";
import { OcppError } from "./types";

export type CommandDispatcher = (input: {
  chargePointId: string;
  identity: string;
  uniqueId: string;
  rawFrame: string;
  commandId: string;
}) => Promise<{ delivered: boolean; reason?: string }>;

function driverIdTag(driverId: string): string {
  const pepper = credentialPepper() ?? "plug-and-go-ocpp-dev";
  return `pngd${hashOpaque(driverId, pepper).slice(0, 16)}`;
}

export function idTagForDriver(driverId: string): string {
  return driverIdTag(driverId);
}

export async function httpCsmsDispatcher(input: {
  chargePointId: string;
  identity: string;
  uniqueId: string;
  rawFrame: string;
  commandId: string;
}): Promise<{ delivered: boolean; reason?: string }> {
  const body = JSON.stringify({
    chargePointId: input.chargePointId,
    identity: input.identity,
    uniqueId: input.uniqueId,
    rawFrame: input.rawFrame,
    commandId: input.commandId,
  });
  let signed;
  try {
    signed = signInternalBody(body);
  } catch {
    return { delivered: false, reason: "internal_hmac_unconfigured" };
  }
  try {
    const response = await fetch(`${csmsControlBaseUrl()}/internal/commands`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-png-csms-timestamp": signed.timestamp,
        "x-png-csms-signature": signed.signature,
      },
      body,
    });
    if (!response.ok) {
      return { delivered: false, reason: `csms_http_${response.status}` };
    }
    const json = (await response.json()) as { ok?: boolean; delivered?: boolean; reason?: string };
    return { delivered: Boolean(json.delivered ?? json.ok), reason: json.reason };
  } catch {
    return { delivered: false, reason: "csms_unreachable" };
  }
}

export class CsmsCommandService {
  constructor(private readonly dispatcher: CommandDispatcher = httpCsmsDispatcher) {}

  async requestRemoteStart(input: {
    actorType: BookingActorType;
    actorId: string;
    driverId: string;
    connectorId: string;
    reason: string;
    idempotencyKey: string;
    bookingId?: string | null;
  }) {
    const prisma = getPrisma();
    const existing = await prisma.remoteCommand.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { session: true },
    });
    if (existing) return { reused: true as const, command: existing };

    const rate = await consumeRateLimit(
      `ocpp:cmd:${input.driverId}`,
      remoteCommandRatePerHour(),
      60 * 60 * 1000,
    );
    if (!rate.allowed) {
      throw new OcppError(429, "auth_rate_limited", "Too many remote commands. Wait before retrying.");
    }

    const map = await prisma.chargePointConnector.findUnique({
      where: { connectorId: input.connectorId },
      include: {
        chargePoint: { include: { capabilities: true } },
        connector: { include: { currentStatus: true, station: true } },
      },
    });
    if (!map) {
      throw new OcppError(409, "conflict", "This connector is not mapped to a commissioned charge point.");
    }

    const capability = map.chargePoint.capabilities.some((row) => row.code === "remote_start" && row.enabled);
    const gate = remoteChargingPolicyGate({
      commissioningState: map.chargePoint.commissioningState,
      stationId: map.connector.stationId,
      connectorId: map.connectorId,
      driverId: input.driverId,
      capabilityEnabled: capability,
    });
    if (!gate.ok) {
      throw new OcppError(403, "forbidden", gate.reason);
    }

    if (map.connector.installationStatus !== "installed") {
      throw new OcppError(409, "conflict", "That connector is not installed.");
    }
    if (map.connector.station.publicationStatus !== "published" || map.connector.station.isDemo) {
      throw new OcppError(409, "conflict", "Remote charging is not offered on unpublished or demo stations.");
    }

    const computed = computePublicStatus({
      recordedStatus: map.connector.currentStatus?.recordedStatus ?? null,
      statusUpdatedAt: map.connector.currentStatus?.statusUpdatedAt ?? null,
      overrideExpiresAt: map.connector.currentStatus?.overrideExpiresAt ?? null,
    });
    if (computed.publicStatus !== "available") {
      throw new OcppError(
        409,
        "conflict",
        `Connector status is ${computed.publicStatus}. Remote start requires a fresh Available state.`,
      );
    }

    const open = await chargingSessionService.openForConnector(map.connectorId);
    if (open) {
      throw new OcppError(409, "conflict", "An open charging session already exists on this connector.");
    }

    const adapter = adapterFor(map.chargePoint.protocolVersion);
    if (!adapter.implemented) {
      throw new OcppError(501, "not_configured", "This charge point protocol version is not implemented.");
    }

    const supportReference = `PNG-S-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const idTag = driverIdTag(input.driverId);
    const pepper = credentialPepper() ?? "plug-and-go-ocpp-dev";
    const session = await prisma.chargingSession.create({
      data: {
        status: "requested",
        driverId: input.driverId,
        stationId: map.connector.stationId,
        connectorId: map.connectorId,
        chargePointId: map.chargePointId,
        bookingId: input.bookingId ?? null,
        idTagHash: hashOpaque(idTag, pepper),
        supportReference,
        events: { create: { toStatus: "requested", source: "api.remote_start", note: input.reason } },
      },
    });

    const timeoutAt = new Date(Date.now() + commandTimeoutSeconds() * 1000);
    const command = await prisma.remoteCommand.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        type: "remote_start",
        status: "queued",
        actorType: input.actorType,
        actorId: input.actorId,
        driverId: input.driverId,
        chargePointId: map.chargePointId,
        stationId: map.connector.stationId,
        connectorId: map.connectorId,
        sessionId: session.id,
        reason: input.reason,
        timeoutAt,
        evidenceState: "queued",
      },
    });

    return this.dispatch(command.id, command.type, map.chargePoint.identity, map.chargePoint.protocolVersion, {
      ocppConnectorId: map.ocppConnectorId,
      idTag,
      transactionId: null,
    });
  }

  async requestRemoteStop(input: {
    actorType: BookingActorType;
    actorId: string;
    driverId: string;
    sessionPublicRef: string;
    reason: string;
    idempotencyKey: string;
  }) {
    const prisma = getPrisma();
    const existing = await prisma.remoteCommand.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { session: true },
    });
    if (existing) return { reused: true as const, command: existing };

    const session = await prisma.chargingSession.findFirst({
      where: { publicRef: input.sessionPublicRef, driverId: input.driverId },
      include: {
        chargePoint: { include: { capabilities: true } },
        connector: true,
      },
    });
    if (!session) throw new OcppError(404, "not_found", "That charging session was not found.");
    if (!["starting", "charging", "authorizing"].includes(session.status)) {
      throw new OcppError(409, "conflict", "This session cannot be stopped in its current state.");
    }
    if (!session.ocppTransactionId) {
      throw new OcppError(
        409,
        "conflict",
        "Stop waits until a charger transaction id exists. A protocol start acceptance is not enough.",
      );
    }

    const capability = session.chargePoint.capabilities.some((row) => row.code === "remote_stop" && row.enabled);
    const gate = remoteChargingPolicyGate({
      commissioningState: session.chargePoint.commissioningState,
      stationId: session.stationId,
      connectorId: session.connectorId,
      driverId: input.driverId,
      capabilityEnabled: capability,
    });
    if (!gate.ok) throw new OcppError(403, "forbidden", gate.reason);

    const timeoutAt = new Date(Date.now() + commandTimeoutSeconds() * 1000);
    const command = await prisma.remoteCommand.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        type: "remote_stop",
        status: "queued",
        actorType: input.actorType,
        actorId: input.actorId,
        driverId: input.driverId,
        chargePointId: session.chargePointId,
        stationId: session.stationId,
        connectorId: session.connectorId,
        sessionId: session.id,
        reason: input.reason,
        timeoutAt,
        evidenceState: "queued",
      },
    });

    await chargingSessionService.transition(session.id, "stopping", "api.remote_stop", input.reason);

    return this.dispatch(command.id, command.type, session.chargePoint.identity, session.chargePoint.protocolVersion, {
      ocppConnectorId: 0,
      idTag: null,
      transactionId: session.ocppTransactionId,
    });
  }

  async requestStaffRemoteStop(input: {
    actorId: string;
    sessionPublicRef: string;
    reason: string;
    idempotencyKey: string;
  }) {
    const prisma = getPrisma();
    const existing = await prisma.remoteCommand.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { session: true },
    });
    if (existing) return { reused: true as const, command: existing };

    const session = await prisma.chargingSession.findFirst({
      where: { publicRef: input.sessionPublicRef },
      include: {
        chargePoint: { include: { capabilities: true } },
        connector: true,
      },
    });
    if (!session) throw new OcppError(404, "not_found", "That charging session was not found.");
    if (!["starting", "charging", "authorizing"].includes(session.status)) {
      throw new OcppError(409, "conflict", "This session cannot be stopped in its current state.");
    }
    if (!session.ocppTransactionId) {
      throw new OcppError(
        409,
        "conflict",
        "Stop waits until a charger transaction id exists. A protocol start acceptance is not enough.",
      );
    }

    const capability = session.chargePoint.capabilities.some((row) => row.code === "remote_stop" && row.enabled);
    const gate = staffRemoteStopPolicyGate({
      commissioningState: session.chargePoint.commissioningState,
      stationId: session.stationId,
      connectorId: session.connectorId,
      capabilityEnabled: capability,
    });
    if (!gate.ok) throw new OcppError(403, "forbidden", gate.reason);

    const timeoutAt = new Date(Date.now() + commandTimeoutSeconds() * 1000);
    const command = await prisma.remoteCommand.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        type: "remote_stop",
        status: "queued",
        actorType: "staff",
        actorId: input.actorId,
        driverId: session.driverId,
        chargePointId: session.chargePointId,
        stationId: session.stationId,
        connectorId: session.connectorId,
        sessionId: session.id,
        reason: input.reason,
        timeoutAt,
        evidenceState: "queued",
      },
    });

    await chargingSessionService.transition(session.id, "stopping", "ops.staff_remote_stop", input.reason);

    return this.dispatch(command.id, command.type, session.chargePoint.identity, session.chargePoint.protocolVersion, {
      ocppConnectorId: 0,
      idTag: null,
      transactionId: session.ocppTransactionId,
    });
  }

  private async dispatch(
    commandId: string,
    type: RemoteCommandType,
    identity: string,
    protocolVersion: Parameters<typeof adapterFor>[0],
    payload: { ocppConnectorId: number; idTag: string | null; transactionId: string | null },
  ) {
    const prisma = getPrisma();
    const adapter = adapterFor(protocolVersion);
    const uniqueId = crypto.randomUUID();
    const frame =
      type === "remote_start"
        ? adapter.buildRemoteStart({
            uniqueId,
            ocppConnectorId: payload.ocppConnectorId,
            idTag: payload.idTag ?? "",
          })
        : adapter.buildRemoteStop({ uniqueId, transactionId: payload.transactionId ?? "" });
    const rawFrame = adapter.serialize(frame);
    const command = await prisma.remoteCommand.update({
      where: { id: commandId },
      data: {
        status: "dispatching",
        dispatchedAt: new Date(),
        evidenceState: "dispatching",
      },
    });
    await prisma.ocppMessageAudit.create({
      data: {
        chargePointId: command.chargePointId,
        uniqueId,
        action: frame.action,
        commandId,
        result: "dispatched",
      },
    });
    await prisma.remoteCommandAttempt.create({
      data: { commandId, result: "dispatched", note: "Not retried automatically." },
    });

    const delivered = await this.dispatcher({
      chargePointId: command.chargePointId,
      identity,
      uniqueId,
      rawFrame,
      commandId,
    });
    if (!delivered.delivered) {
      await prisma.remoteCommand.update({
        where: { id: commandId },
        data: { status: "failed", protocolResponse: delivered.reason, evidenceState: "dispatch_failed" },
      });
      if (command.sessionId && type === "remote_start") {
        await chargingSessionService.transition(command.sessionId, "failed", "csms.dispatch_failed", delivered.reason, {
          failReason: delivered.reason ?? "dispatch_failed",
        });
      }
    }
    const latest = await prisma.remoteCommand.findUniqueOrThrow({
      where: { id: commandId },
      include: { session: true },
    });
    return { reused: false as const, command: latest };
  }

  async reconcileTimeouts(now = new Date()) {
    const prisma = getPrisma();
    const pending = await prisma.remoteCommand.findMany({
      where: {
        status: { in: ["queued", "dispatching", "accepted"] },
        timeoutAt: { lte: now },
      },
    });
    for (const command of pending) {
      if (command.status === "accepted") {
        const session = command.sessionId
          ? await prisma.chargingSession.findUnique({ where: { id: command.sessionId } })
          : null;
        if (session?.status === "charging" || session?.status === "completed" || session?.status === "stopping") {
          continue;
        }
        const evidenceDeadline = new Date(
          (command.respondedAt ?? command.dispatchedAt ?? command.requestedAt).getTime() +
            startEvidenceTimeoutSeconds() * 1000,
        );
        if (evidenceDeadline > now) continue;
        await prisma.remoteCommand.update({
          where: { id: command.id },
          data: { status: "timeout", evidenceState: "no_session_evidence" },
        });
        if (session && (session.status === "starting" || session.status === "requested" || session.status === "authorizing")) {
          await chargingSessionService.transition(
            session.id,
            "timed_out",
            "command.timeout",
            "No transaction/meter evidence after protocol acceptance.",
            { failReason: "start_evidence_timeout" },
          );
        }
        continue;
      }
      await prisma.remoteCommand.update({
        where: { id: command.id },
        data: { status: "timeout", evidenceState: "no_protocol_response" },
      });
      if (command.sessionId && command.type === "remote_start") {
        await chargingSessionService.transition(
          command.sessionId,
          "timed_out",
          "command.timeout",
          "No protocol response. The command is not retried automatically because it may have executed.",
          { failReason: "command_timeout" },
        );
      }
    }
  }
}

export const csmsCommandService = new CsmsCommandService();
