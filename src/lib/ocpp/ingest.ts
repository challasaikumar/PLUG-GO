import type { AvailabilitySource, ChargePoint, Prisma, RecordedStatus } from "@prisma/client";
import { hashOpaque, sha256Hex } from "@/lib/auth/crypto";
import { getPrisma } from "@/lib/db/prisma";
import { computePublicStatus } from "@/lib/status";
import { credentialPepper, csmsHeartbeatIntervalSeconds, heartbeatStaleSeconds } from "./config";
import { energyMilliWhFromRaw } from "./energy";
import { csmsEventNormalizer } from "./normalizer";
import { realTimeEventPublisher } from "./publisher";
import { redactOcppValue } from "./redact";
import { chargingSessionService } from "./sessions";
import type { ChargePointAdapter } from "./adapter";
import { adapterFor } from "./versions";
import type { OcppCallFrame, OcppFrame, PublicRealtimeEvent } from "./types";

export type IngestResult = {
  parseResult: string;
  response: OcppFrame | null;
  duplicate: boolean;
};

async function persistEvent(input: {
  chargePoint: ChargePoint;
  correlationId: string;
  uniqueId: string;
  action: string;
  direction: string;
  parseResult: "accepted" | "ignored" | "duplicate" | "malformed" | "unsupported_version" | "unauthorized";
  raw: string;
  payload: unknown;
  relatedSessionId?: string | null;
}) {
  const prisma = getPrisma();
  const payloadHash = sha256Hex(input.raw);
  try {
    return await prisma.ocppProtocolEvent.create({
      data: {
        chargePointId: input.chargePoint.id,
        correlationId: input.correlationId,
        protocolVersion: input.chargePoint.protocolVersion,
        uniqueId: input.uniqueId,
        action: input.action,
        direction: input.direction,
        parseResult: input.parseResult,
        payloadHash,
        redactedPayload: redactOcppValue(input.payload) as Prisma.InputJsonValue,
        processedAt: new Date(),
        relatedSessionId: input.relatedSessionId ?? null,
      },
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code === "P2002") {
      return null;
    }
    throw error;
  }
}

async function publishConnectorStatus(connectorId: string, recordedStatus: RecordedStatus, statusUpdatedAt: Date) {
  const prisma = getPrisma();
  const connector = await prisma.connector.findUnique({
    where: { id: connectorId },
    include: { station: { select: { slug: true } } },
  });
  if (!connector) return;
  const computed = computePublicStatus({ recordedStatus, statusUpdatedAt });
  const event: PublicRealtimeEvent = {
    type: "connector_status",
    eventId: crypto.randomUUID(),
    stationSlug: connector.station.slug,
    connectorPublicRef: connector.publicRef,
    publicStatus: computed.publicStatus,
    statusUpdatedAt: computed.statusUpdatedAt ?? statusUpdatedAt.toISOString(),
  };
  await realTimeEventPublisher.publish(event);
}

async function writeConnectorStatus(input: {
  connectorId: string;
  recordedStatus: RecordedStatus;
  source: AvailabilitySource;
  occurredAt: Date;
  internalStatus: string;
  heartbeatAt?: Date | null;
  payload?: Prisma.InputJsonValue;
}) {
  const prisma = getPrisma();
  const connector = await prisma.connector.findUnique({ where: { id: input.connectorId } });
  if (!connector) return;

  const current = await prisma.currentConnectorStatus.findUnique({ where: { connectorId: input.connectorId } });
  const currentIsCsms = current?.source === "csms_ocpp" || current?.source === "heartbeat_timeout";
  if (currentIsCsms && current && current.statusUpdatedAt.getTime() > input.occurredAt.getTime()) {
    return "out_of_order";
  }

  const event = await prisma.connectorAvailabilityEvent.create({
    data: {
      stationId: connector.stationId,
      evseId: connector.evseId,
      connectorId: connector.id,
      recordedStatus: input.recordedStatus,
      source: input.source,
      occurredAt: input.occurredAt,
      statusUpdatedAt: input.occurredAt,
      payload: input.payload,
    },
  });
  await prisma.currentConnectorStatus.upsert({
    where: { connectorId: connector.id },
    create: {
      connectorId: connector.id,
      recordedStatus: input.recordedStatus,
      source: input.source,
      statusUpdatedAt: input.occurredAt,
      lastEventId: event.id,
    },
    update: {
      recordedStatus: input.recordedStatus,
      source: input.source,
      statusUpdatedAt: input.occurredAt,
      lastEventId: event.id,
      overrideReason: null,
      overrideExpiresAt: null,
    },
  });
  await prisma.connectorStatusSnapshot.create({
    data: {
      connectorId: connector.id,
      publicStatus: computePublicStatus({
        recordedStatus: input.recordedStatus,
        statusUpdatedAt: input.occurredAt,
      }).publicStatus,
      internalStatus: input.internalStatus,
      source: input.source,
      statusUpdatedAt: input.occurredAt,
      heartbeatAt: input.heartbeatAt ?? null,
    },
  });
  await prisma.station.update({
    where: { id: connector.stationId },
    data: { statusUpdatedAt: input.occurredAt },
  });
  await publishConnectorStatus(connector.id, input.recordedStatus, input.occurredAt);
  return "applied";
}

async function connectorForOcpp(chargePointId: string, ocppConnectorId: number) {
  const prisma = getPrisma();
  return prisma.chargePointConnector.findUnique({
    where: { chargePointId_ocppConnectorId: { chargePointId, ocppConnectorId } },
    include: { connector: true },
  });
}

function idTagHash(idTag: string): string {
  const pepper = credentialPepper() ?? "plug-and-go-ocpp-dev";
  return hashOpaque(idTag, pepper);
}

export class CsmsEventIngestor {
  adapterForChargePoint(chargePoint: ChargePoint): ChargePointAdapter {
    return adapterFor(chargePoint.protocolVersion);
  }

  async ingestRaw(input: {
    chargePoint: ChargePoint;
    raw: string;
    correlationId?: string;
  }): Promise<IngestResult> {
    const adapter = this.adapterForChargePoint(input.chargePoint);
    const correlationId = input.correlationId ?? crypto.randomUUID();
    if (!adapter.implemented) {
      await persistEvent({
        chargePoint: input.chargePoint,
        correlationId,
        uniqueId: crypto.randomUUID(),
        action: "Unsupported",
        direction: "in",
        parseResult: "unsupported_version",
        raw: input.raw,
        payload: { note: "stub adapter refused parse" },
      });
      return { parseResult: "unsupported_version", response: null, duplicate: false };
    }

    const parsed = adapter.parseInbound(input.raw);
    if (!parsed.ok) {
      await persistEvent({
        chargePoint: input.chargePoint,
        correlationId,
        uniqueId: crypto.randomUUID(),
        action: "Malformed",
        direction: "in",
        parseResult: "malformed",
        raw: input.raw,
        payload: { reason: parsed.reason },
      });
      return { parseResult: "malformed", response: null, duplicate: false };
    }

    const frame = parsed.frame;
    const action = frame.kind === "call" ? frame.action : "CallResult";
    const uniqueId = frame.uniqueId;
    const stored = await persistEvent({
      chargePoint: input.chargePoint,
      correlationId,
      uniqueId,
      action,
      direction: frame.kind === "call" ? "in" : "result_in",
      parseResult: "accepted",
      raw: input.raw,
      payload: frame.kind === "call" || frame.kind === "call_result" ? frame.payload : frame,
    });
    if (!stored) {
      return { parseResult: "duplicate", response: null, duplicate: true };
    }

    if (frame.kind === "call_result" || frame.kind === "call_error") {
      await this.handleCommandResult(input.chargePoint, adapter, frame);
      return { parseResult: "accepted", response: null, duplicate: false };
    }

    const response = await this.handleCall(input.chargePoint, adapter, frame);
    return { parseResult: "accepted", response, duplicate: false };
  }

  private async handleCall(
    chargePoint: ChargePoint,
    adapter: ChargePointAdapter,
    frame: OcppCallFrame,
  ): Promise<OcppFrame> {
    const prisma = getPrisma();
    const now = new Date();

    switch (frame.action) {
      case "BootNotification": {
        const boot = adapter.mapBoot(frame.payload);
        await prisma.chargePoint.update({
          where: { id: chargePoint.id },
          data: {
            lastBootAt: now,
            vendor: chargePoint.vendor ?? boot.vendor,
            model: chargePoint.model ?? boot.model,
            firmwareVersion: boot.firmwareVersion ?? chargePoint.firmwareVersion,
            serialNumber: chargePoint.serialNumber ?? boot.serialNumber,
            connectionStatus: "connected",
          },
        });
        return {
          kind: "call_result",
          uniqueId: frame.uniqueId,
          payload: adapter.bootResponse(csmsHeartbeatIntervalSeconds(), "Accepted"),
        };
      }
      case "Heartbeat": {
        await prisma.chargePoint.update({
          where: { id: chargePoint.id },
          data: { lastHeartbeatAt: now, connectionStatus: "connected" },
        });
        return { kind: "call_result", uniqueId: frame.uniqueId, payload: adapter.heartbeatResponse() };
      }
      case "StatusNotification": {
        const mapped = adapter.mapStatusNotification(frame.payload);
        if (!mapped) {
          return {
            kind: "call_error",
            uniqueId: frame.uniqueId,
            errorCode: "FormationViolation",
            errorDescription: "StatusNotification missing connectorId or status",
            errorDetails: {},
          };
        }
        await prisma.chargePoint.update({
          where: { id: chargePoint.id },
          data: {
            lastHeartbeatAt: now,
            lastFaultAt: mapped.recordedStatus === "faulted" ? mapped.timestamp ?? now : chargePoint.lastFaultAt,
            lastFaultCode: mapped.errorCode,
          },
        });
        if (mapped.ocppConnectorId > 0) {
          const map = await connectorForOcpp(chargePoint.id, mapped.ocppConnectorId);
          if (map) {
            const occurredAt = mapped.timestamp ?? now;
            await writeConnectorStatus({
              connectorId: map.connectorId,
              recordedStatus: mapped.recordedStatus,
              source: "csms_ocpp",
              occurredAt,
              internalStatus: mapped.internalStatus,
              heartbeatAt: now,
              payload: { internalStatus: mapped.internalStatus, errorCode: mapped.errorCode },
            });
            if (mapped.recordedStatus === "faulted") {
              await prisma.chargerFault.create({
                data: {
                  chargePointId: chargePoint.id,
                  connectorId: map.connectorId,
                  code: mapped.errorCode ?? mapped.internalStatus,
                  vendorError: mapped.vendorError,
                  info: mapped.info,
                  occurredAt,
                },
              });
              const open = await chargingSessionService.openForConnector(map.connectorId);
              if (open && (open.status === "charging" || open.status === "starting" || open.status === "stopping")) {
                await chargingSessionService.transition(open.id, "interrupted", "ocpp.fault", mapped.info ?? mapped.errorCode ?? undefined, {
                  failReason: mapped.errorCode ?? "faulted",
                  endedAt: occurredAt,
                });
              }
            }
          }
        }
        return { kind: "call_result", uniqueId: frame.uniqueId, payload: {} };
      }
      case "Authorize": {
        const { idTag } = adapter.mapAuthorize(frame.payload);
        if (!idTag) {
          return {
            kind: "call_result",
            uniqueId: frame.uniqueId,
            payload: adapter.authorizeResponse("Invalid"),
          };
        }
        const session = await chargingSessionService.byIdTag(idTagHash(idTag));
        await prisma.sessionAuthorization.create({
          data: {
            sessionId: session?.id,
            driverId: session?.driverId,
            idTagHash: idTagHash(idTag),
            status: session ? "Accepted" : "Invalid",
          },
        });
        if (session) {
          await chargingSessionService.transition(session.id, "authorizing", "ocpp.authorize");
        }
        return {
          kind: "call_result",
          uniqueId: frame.uniqueId,
          payload: adapter.authorizeResponse(session ? "Accepted" : "Invalid"),
        };
      }
      case "StartTransaction": {
        const start = adapter.mapStartTransaction(frame.payload);
        if (!start) {
          return {
            kind: "call_error",
            uniqueId: frame.uniqueId,
            errorCode: "FormationViolation",
            errorDescription: "StartTransaction missing connectorId",
            errorDetails: {},
          };
        }
        const map = await connectorForOcpp(chargePoint.id, start.ocppConnectorId);
        const hashed = start.idTag ? idTagHash(start.idTag) : null;
        let session = hashed ? await chargingSessionService.byIdTag(hashed) : null;
        if (!session && map) session = await chargingSessionService.openForConnector(map.connectorId);
        const transactionId = await this.allocateTransactionId(chargePoint.id);
        if (session) {
          const meterMilli = start.meterStart ? energyMilliWhFromRaw(start.meterStart, "Wh") : null;
          await chargingSessionService.transition(session.id, "charging", "ocpp.start_transaction", "Verified transaction start", {
            ocppTransactionId: String(transactionId),
            startedAt: start.timestamp ?? now,
            lastEvidenceAt: now,
            energyMilliWh: meterMilli ?? undefined,
            meterUnit: start.meterStart ? "Wh" : undefined,
          });
          await prisma.remoteCommand.updateMany({
            where: { sessionId: session.id, type: "remote_start", status: { in: ["accepted", "dispatching"] } },
            data: { status: "reconciled_started", evidenceState: "start_transaction" },
          });
        }
        if (map) {
          await writeConnectorStatus({
            connectorId: map.connectorId,
            recordedStatus: "in_use",
            source: "csms_ocpp",
            occurredAt: start.timestamp ?? now,
            internalStatus: "Charging",
            heartbeatAt: now,
          });
        }
        return {
          kind: "call_result",
          uniqueId: frame.uniqueId,
          payload: adapter.startTransactionResponse(transactionId, session ? "Accepted" : "Invalid"),
        };
      }
      case "StopTransaction": {
        const stop = adapter.mapStopTransaction(frame.payload);
        if (!stop) {
          return {
            kind: "call_error",
            uniqueId: frame.uniqueId,
            errorCode: "FormationViolation",
            errorDescription: "StopTransaction missing transactionId",
            errorDetails: {},
          };
        }
        const session = await chargingSessionService.byTransaction(chargePoint.id, stop.transactionId);
        const meterMilli = stop.meterStop ? energyMilliWhFromRaw(stop.meterStop, "Wh") : null;
        if (session) {
          await chargingSessionService.transition(session.id, "completed", "ocpp.stop_transaction", stop.reason ?? undefined, {
            endedAt: stop.timestamp ?? now,
            lastEvidenceAt: now,
            energyMilliWh: meterMilli ?? undefined,
            meterUnit: stop.meterStop ? "Wh" : undefined,
          });
          await prisma.remoteCommand.updateMany({
            where: { sessionId: session.id, type: "remote_stop", status: { in: ["accepted", "dispatching"] } },
            data: { status: "reconciled_stopped", evidenceState: "stop_transaction" },
          });
          await writeConnectorStatus({
            connectorId: session.connectorId,
            recordedStatus: "available",
            source: "csms_ocpp",
            occurredAt: stop.timestamp ?? now,
            internalStatus: "Available",
            heartbeatAt: now,
          });
        }
        return { kind: "call_result", uniqueId: frame.uniqueId, payload: adapter.stopTransactionResponse() };
      }
      case "MeterValues": {
        const samples = adapter.mapMeterValues(frame.payload);
        let relatedSessionId: string | null = null;
        for (const sample of samples) {
          const session = sample.transactionId
            ? await chargingSessionService.byTransaction(chargePoint.id, sample.transactionId)
            : null;
          relatedSessionId = session?.id ?? relatedSessionId;
          const milli = energyMilliWhFromRaw(sample.rawValue, sample.rawUnit);
          await prisma.meterValue.create({
            data: {
              sessionId: session?.id,
              chargePointId: chargePoint.id,
              connectorId: session?.connectorId ?? null,
              sampledAt: sample.sampledAt,
              rawValue: sample.rawValue,
              rawUnit: sample.rawUnit,
              measurand: sample.measurand,
              context: sample.context,
              source: "ocpp.MeterValues",
              energyMilliWh: milli,
            },
          });
          if (session) {
            const energyMeasurand = sample.measurand.toLowerCase().includes("energy");
            if (session.status === "starting" || session.status === "authorizing" || session.status === "requested") {
              await chargingSessionService.transition(session.id, "charging", "ocpp.meter", "Verified meter evidence", {
                lastEvidenceAt: now,
                energyMilliWh: milli ?? undefined,
                meterUnit: sample.rawUnit,
                startedAt: session.startedAt ?? sample.sampledAt,
              });
            } else if (session.status === "charging" && energyMeasurand && milli != null) {
              await prisma.chargingSession.update({
                where: { id: session.id },
                data: { lastEvidenceAt: now, energyMilliWh: milli, meterUnit: sample.rawUnit },
              });
              await prisma.chargePoint.update({
                where: { id: chargePoint.id },
                data: { lastMeterAt: now },
              });
            }
          }
        }
        if (samples[0]) {
          await prisma.chargePoint.update({
            where: { id: chargePoint.id },
            data: { lastMeterAt: now, lastHeartbeatAt: now },
          });
        }
        return { kind: "call_result", uniqueId: frame.uniqueId, payload: {} };
      }
      default:
        return {
          kind: "call_error",
          uniqueId: frame.uniqueId,
          errorCode: "NotImplemented",
          errorDescription: `${frame.action} is not handled for this verified protocol version`,
          errorDetails: {},
        };
    }
  }

  private async handleCommandResult(
    chargePoint: ChargePoint,
    adapter: ChargePointAdapter,
    frame: Extract<OcppFrame, { kind: "call_result" | "call_error" }>,
  ) {
    const prisma = getPrisma();
    const audit = await prisma.ocppMessageAudit.findFirst({
      where: { chargePointId: chargePoint.id, uniqueId: frame.uniqueId },
      orderBy: { createdAt: "desc" },
    });
    if (!audit?.commandId) return;
    const command = await prisma.remoteCommand.findUnique({ where: { id: audit.commandId } });
    if (!command) return;

    if (frame.kind === "call_error") {
      await prisma.remoteCommand.update({
        where: { id: command.id },
        data: {
          status: "failed",
          respondedAt: new Date(),
          protocolResponse: frame.errorCode,
          evidenceState: "protocol_error",
        },
      });
      await prisma.remoteCommandAttempt.create({
        data: { commandId: command.id, result: "protocol_error", note: frame.errorDescription },
      });
      if (command.sessionId) {
        await chargingSessionService.transition(command.sessionId, "failed", "ocpp.call_error", frame.errorDescription, {
          failReason: frame.errorCode,
        });
      }
      return;
    }

    const result = adapter.parseRemoteCommandResult(frame.payload);
    const protocolResponse = result;
    await prisma.ocppMessageAudit.update({
      where: { id: audit.id },
      data: { result: protocolResponse },
    });
    if (result === "Accepted") {
      await prisma.remoteCommand.update({
        where: { id: command.id },
        data: {
          status: "accepted",
          respondedAt: new Date(),
          protocolResponse,
          evidenceState: "protocol_accepted_not_charging",
        },
      });
      if (command.sessionId) {
        await chargingSessionService.transition(
          command.sessionId,
          command.type === "remote_stop" ? "stopping" : "starting",
          "ocpp.remote_result",
          "Protocol Accepted is not verified charging.",
        );
      }
    } else {
      await prisma.remoteCommand.update({
        where: { id: command.id },
        data: {
          status: "rejected",
          respondedAt: new Date(),
          protocolResponse,
          evidenceState: "protocol_rejected",
        },
      });
      if (command.sessionId && command.type === "remote_start") {
        await chargingSessionService.transition(command.sessionId, "failed", "ocpp.remote_rejected", "Charger rejected remote start", {
          failReason: "remote_start_rejected",
        });
      }
    }
    await prisma.remoteCommandAttempt.create({
      data: { commandId: command.id, result: protocolResponse, note: "CALLRESULT" },
    });
  }

  private async allocateTransactionId(chargePointId: string): Promise<number> {
    const prisma = getPrisma();
    const last = await prisma.chargingSession.findFirst({
      where: { chargePointId, ocppTransactionId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { ocppTransactionId: true },
    });
    const prev = last?.ocppTransactionId ? Number.parseInt(last.ocppTransactionId, 10) : 0;
    if (Number.isInteger(prev) && prev > 0) return prev + 1;
    return 1;
  }
}

export const csmsEventIngestor = new CsmsEventIngestor();

export async function markExpiredHeartbeats(now = new Date()) {
  const prisma = getPrisma();
  const staleMs = heartbeatStaleSeconds() * 1000;
  const cutoff = new Date(now.getTime() - staleMs);
  const connected = await prisma.chargePoint.findMany({
    where: {
      connectionStatus: "connected",
      OR: [{ lastHeartbeatAt: { lt: cutoff } }, { lastHeartbeatAt: null, lastBootAt: { lt: cutoff } }],
    },
    include: { connectorMaps: true },
  });
  for (const chargePoint of connected) {
    const last = chargePoint.lastHeartbeatAt ?? chargePoint.lastBootAt;
    if (last && last.getTime() > cutoff.getTime()) continue;
    await prisma.deviceHealthAlert.create({
      data: {
        chargePointId: chargePoint.id,
        severity: "warning",
        code: "heartbeat_stale",
        message: "Heartbeat or status updates expired. Public availability must not stay Available.",
      },
    });
    for (const map of chargePoint.connectorMaps) {
      const current = await prisma.currentConnectorStatus.findUnique({ where: { connectorId: map.connectorId } });
      const normalised = csmsEventNormalizer.fromHeartbeatTimeout(current?.recordedStatus ?? null);
      if (current?.recordedStatus === "available") {
        await writeConnectorStatus({
          connectorId: map.connectorId,
          recordedStatus: normalised.recordedStatus,
          source: "heartbeat_timeout",
          occurredAt: now,
          internalStatus: "heartbeat_timeout",
          heartbeatAt: last,
        });
      } else if (current?.recordedStatus && current.recordedStatus !== "faulted") {
        const computed = computePublicStatus({
          recordedStatus: current.recordedStatus,
          statusUpdatedAt: current.statusUpdatedAt,
          now,
        });
        if (computed.publicStatus === "stale" || computed.publicStatus === "available") {
          await writeConnectorStatus({
            connectorId: map.connectorId,
            recordedStatus: "offline",
            source: "heartbeat_timeout",
            occurredAt: now,
            internalStatus: "heartbeat_timeout",
            heartbeatAt: last,
          });
        }
      }
    }
  }
}

export { writeConnectorStatus };
