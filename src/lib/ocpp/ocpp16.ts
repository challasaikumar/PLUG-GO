import type { ChargePointAdapter, RemoteStartParams, RemoteStopParams } from "./adapter";
import type { NormalizedMeterSample, NormalizedStatus, OcppCallFrame, OcppFrame, ParseOutcome } from "./types";

const CALL = 2;
const CALLRESULT = 3;
const CALLERROR = 4;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value, 10);
  return null;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapStatus(status: string, errorCode: string | null): NormalizedStatus["recordedStatus"] {
  const error = (errorCode ?? "NoError").toLowerCase();
  if (error && error !== "noerror") return "faulted";
  switch (status) {
    case "Available":
      return "available";
    case "Preparing":
    case "Charging":
    case "SuspendedEVSE":
    case "SuspendedEV":
    case "Finishing":
    case "Reserved":
      return "in_use";
    case "Faulted":
      return "faulted";
    case "Unavailable":
      return "offline";
    default:
      return "unknown";
  }
}

export class Ocpp16Adapter implements ChargePointAdapter {
  readonly protocolVersion = "ocpp_1_6" as const;
  readonly implemented = true;

  parseInbound(raw: string): ParseOutcome {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, reason: "malformed_json" };
    }
    if (!Array.isArray(parsed) || parsed.length < 3) {
      return { ok: false, reason: "malformed_frame" };
    }
    const type = parsed[0];
    const uniqueId = parsed[1];
    if (typeof uniqueId !== "string" || !uniqueId.trim()) {
      return { ok: false, reason: "missing_unique_id" };
    }
    if (type === CALL) {
      const action = parsed[2];
      if (typeof action !== "string" || !action.trim()) {
        return { ok: false, reason: "missing_action" };
      }
      return {
        ok: true,
        frame: {
          kind: "call",
          uniqueId,
          action,
          payload: asRecord(parsed[3]),
        },
      };
    }
    if (type === CALLRESULT) {
      return {
        ok: true,
        frame: { kind: "call_result", uniqueId, payload: asRecord(parsed[2]) },
      };
    }
    if (type === CALLERROR) {
      return {
        ok: true,
        frame: {
          kind: "call_error",
          uniqueId,
          errorCode: typeof parsed[2] === "string" ? parsed[2] : "GenericError",
          errorDescription: typeof parsed[3] === "string" ? parsed[3] : "",
          errorDetails: asRecord(parsed[4]),
        },
      };
    }
    return { ok: false, reason: "unknown_message_type" };
  }

  serialize(frame: OcppFrame): string {
    if (frame.kind === "call") {
      return JSON.stringify([CALL, frame.uniqueId, frame.action, frame.payload]);
    }
    if (frame.kind === "call_result") {
      return JSON.stringify([CALLRESULT, frame.uniqueId, frame.payload]);
    }
    return JSON.stringify([
      CALLERROR,
      frame.uniqueId,
      frame.errorCode,
      frame.errorDescription,
      frame.errorDetails,
    ]);
  }

  mapStatusNotification(payload: Record<string, unknown>): NormalizedStatus | null {
    const ocppConnectorId = asInt(payload.connectorId);
    const status = asString(payload.status);
    if (ocppConnectorId == null || ocppConnectorId < 0 || !status) return null;
    const errorCode = asString(payload.errorCode);
    return {
      ocppConnectorId,
      recordedStatus: mapStatus(status, errorCode),
      internalStatus: status,
      errorCode,
      vendorError: asString(payload.vendorErrorCode),
      info: asString(payload.info),
      timestamp: asDate(payload.timestamp),
    };
  }

  mapMeterValues(payload: Record<string, unknown>): NormalizedMeterSample[] {
    const ocppConnectorId = asInt(payload.connectorId) ?? 0;
    const transactionId = payload.transactionId == null ? null : String(payload.transactionId);
    const meterValue = Array.isArray(payload.meterValue) ? payload.meterValue : [];
    const samples: NormalizedMeterSample[] = [];
    for (const entry of meterValue) {
      const row = asRecord(entry);
      const sampledAt = asDate(row.timestamp) ?? new Date();
      const sampledValue = Array.isArray(row.sampledValue) ? row.sampledValue : [];
      for (const sample of sampledValue) {
        const item = asRecord(sample);
        const rawValue = item.value == null ? null : String(item.value);
        if (!rawValue) continue;
        samples.push({
          ocppConnectorId,
          transactionId,
          sampledAt,
          rawValue,
          rawUnit: asString(item.unit) ?? "Wh",
          measurand: asString(item.measurand) ?? "Energy.Active.Import.Register",
          context: asString(item.context),
        });
      }
    }
    return samples;
  }

  mapBoot(payload: Record<string, unknown>) {
    return {
      vendor: asString(payload.chargePointVendor),
      model: asString(payload.chargePointModel),
      serialNumber: asString(payload.chargePointSerialNumber),
      firmwareVersion: asString(payload.firmwareVersion),
    };
  }

  mapStartTransaction(payload: Record<string, unknown>) {
    const ocppConnectorId = asInt(payload.connectorId);
    if (ocppConnectorId == null || ocppConnectorId < 1) return null;
    return {
      ocppConnectorId,
      idTag: asString(payload.idTag),
      meterStart: payload.meterStart == null ? null : String(payload.meterStart),
      timestamp: asDate(payload.timestamp),
    };
  }

  mapStopTransaction(payload: Record<string, unknown>) {
    if (payload.transactionId == null) return null;
    return {
      transactionId: String(payload.transactionId),
      idTag: asString(payload.idTag),
      meterStop: payload.meterStop == null ? null : String(payload.meterStop),
      timestamp: asDate(payload.timestamp),
      reason: asString(payload.reason),
    };
  }

  mapAuthorize(payload: Record<string, unknown>) {
    return { idTag: asString(payload.idTag) };
  }

  bootResponse(intervalSeconds: number, status: "Accepted" | "Pending" | "Rejected") {
    return {
      status,
      currentTime: new Date().toISOString(),
      interval: intervalSeconds,
    };
  }

  heartbeatResponse() {
    return { currentTime: new Date().toISOString() };
  }

  authorizeResponse(status: "Accepted" | "Invalid" | "Blocked") {
    return { idTagInfo: { status } };
  }

  startTransactionResponse(transactionId: number, idTagStatus: "Accepted" | "Invalid") {
    return { transactionId, idTagInfo: { status: idTagStatus } };
  }

  stopTransactionResponse() {
    return { idTagInfo: { status: "Accepted" } };
  }

  buildRemoteStart(params: RemoteStartParams): OcppCallFrame {
    return {
      kind: "call",
      uniqueId: params.uniqueId,
      action: "RemoteStartTransaction",
      payload: { connectorId: params.ocppConnectorId, idTag: params.idTag },
    };
  }

  buildRemoteStop(params: RemoteStopParams): OcppCallFrame {
    return {
      kind: "call",
      uniqueId: params.uniqueId,
      action: "RemoteStopTransaction",
      payload: { transactionId: Number.parseInt(params.transactionId, 10) || params.transactionId },
    };
  }

  parseRemoteCommandResult(payload: Record<string, unknown>): "Accepted" | "Rejected" | "unknown" {
    const status = asString(payload.status);
    if (status === "Accepted" || status === "Rejected") return status;
    return "unknown";
  }
}

export const ocpp16Adapter = new Ocpp16Adapter();
