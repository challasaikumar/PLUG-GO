import type { OcppProtocolVersion } from "@prisma/client";
import type {
  NormalizedMeterSample,
  NormalizedStatus,
  OcppCallFrame,
  OcppFrame,
  ParseOutcome,
} from "./types";

export type RemoteStartParams = {
  uniqueId: string;
  ocppConnectorId: number;
  idTag: string;
};

export type RemoteStopParams = {
  uniqueId: string;
  transactionId: string;
};

export type ChargePointAdapter = {
  readonly protocolVersion: OcppProtocolVersion;
  readonly implemented: boolean;
  parseInbound(raw: string): ParseOutcome;
  serialize(frame: OcppFrame): string;
  mapStatusNotification(payload: Record<string, unknown>): NormalizedStatus | null;
  mapMeterValues(payload: Record<string, unknown>): NormalizedMeterSample[];
  mapBoot(payload: Record<string, unknown>): {
    vendor: string | null;
    model: string | null;
    serialNumber: string | null;
    firmwareVersion: string | null;
  };
  mapStartTransaction(payload: Record<string, unknown>): {
    ocppConnectorId: number;
    idTag: string | null;
    meterStart: string | null;
    timestamp: Date | null;
  } | null;
  mapStopTransaction(payload: Record<string, unknown>): {
    transactionId: string;
    idTag: string | null;
    meterStop: string | null;
    timestamp: Date | null;
    reason: string | null;
  } | null;
  mapAuthorize(payload: Record<string, unknown>): { idTag: string | null };
  bootResponse(intervalSeconds: number, status: "Accepted" | "Pending" | "Rejected"): Record<string, unknown>;
  heartbeatResponse(): Record<string, unknown>;
  authorizeResponse(status: "Accepted" | "Invalid" | "Blocked"): Record<string, unknown>;
  startTransactionResponse(
    transactionId: number,
    idTagStatus: "Accepted" | "Invalid",
  ): Record<string, unknown>;
  stopTransactionResponse(): Record<string, unknown>;
  buildRemoteStart(params: RemoteStartParams): OcppCallFrame;
  buildRemoteStop(params: RemoteStopParams): OcppCallFrame;
  parseRemoteCommandResult(payload: Record<string, unknown>): "Accepted" | "Rejected" | "unknown";
};

export function unsupportedAdapterMessage(version: OcppProtocolVersion): string {
  return `OCPP ${version} is not a verified Plug and Go protocol for any commissioned charger. Do not treat a stub adapter as a working implementation.`;
}
