import type { OcppProtocolVersion } from "@prisma/client";

export type OcppCallFrame = {
  kind: "call";
  uniqueId: string;
  action: string;
  payload: Record<string, unknown>;
};

export type OcppCallResultFrame = {
  kind: "call_result";
  uniqueId: string;
  payload: Record<string, unknown>;
};

export type OcppCallErrorFrame = {
  kind: "call_error";
  uniqueId: string;
  errorCode: string;
  errorDescription: string;
  errorDetails: Record<string, unknown>;
};

export type OcppFrame = OcppCallFrame | OcppCallResultFrame | OcppCallErrorFrame;

export type ParseOk = { ok: true; frame: OcppFrame };
export type ParseFail = { ok: false; reason: string };
export type ParseOutcome = ParseOk | ParseFail;

export type NormalizedStatus = {
  ocppConnectorId: number;
  recordedStatus: "available" | "in_use" | "faulted" | "offline" | "unknown";
  internalStatus: string;
  errorCode: string | null;
  vendorError: string | null;
  info: string | null;
  timestamp: Date | null;
};

export type NormalizedMeterSample = {
  ocppConnectorId: number;
  transactionId: string | null;
  sampledAt: Date;
  rawValue: string;
  rawUnit: string;
  measurand: string;
  context: string | null;
};

export type ChargePointSocket = {
  send(data: string): void;
  close(code?: number, reason?: string): void;
};

export type ConnectionRejectReason =
  | "unknown_charge_point"
  | "disabled"
  | "draft"
  | "duplicate"
  | "unauthorized"
  | "unsupported_version"
  | "payload_limit"
  | "connection_limit"
  | "suspicious";

export type VerifiedProtocol = Extract<OcppProtocolVersion, "ocpp_1_6">;

export const VERIFIED_OCPP_VERSIONS: readonly VerifiedProtocol[] = ["ocpp_1_6"];

export type PublicRealtimeEvent =
  | {
      type: "connector_status";
      eventId: string;
      stationSlug: string;
      connectorPublicRef: string;
      publicStatus: string;
      statusUpdatedAt: string;
    }
  | {
      type: "session";
      eventId: string;
      sessionPublicRef: string;
      status: string;
      lastUpdatedAt: string;
      energyMilliWh: string | null;
      startedAt: string | null;
      endedAt: string | null;
    };

export class OcppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "OcppError";
    this.status = status;
    this.code = code;
  }
}
