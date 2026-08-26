import type { ChargePointAdapter, RemoteStartParams, RemoteStopParams } from "./adapter";
import { unsupportedAdapterMessage } from "./adapter";
import type { OcppCallFrame, OcppFrame, ParseOutcome } from "./types";
import { OcppError } from "./types";

/**
 * Documented stub. Plug and Go has no verified OCPP 2.0.1 charger.
 * Do not parse 2.0.1 frames with the 1.6 handler.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export class Ocpp201Adapter implements ChargePointAdapter {
  readonly protocolVersion = "ocpp_2_0_1" as const;
  readonly implemented = false;

  parseInbound(_raw: string): ParseOutcome {
    return { ok: false, reason: "unsupported_version" };
  }

  serialize(_frame: OcppFrame): string {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  mapStatusNotification() {
    return null;
  }

  mapMeterValues() {
    return [];
  }

  mapBoot() {
    return { vendor: null, model: null, serialNumber: null, firmwareVersion: null };
  }

  mapStartTransaction() {
    return null;
  }

  mapStopTransaction() {
    return null;
  }

  mapAuthorize() {
    return { idTag: null };
  }

  bootResponse(_intervalSeconds: number, _status: "Accepted" | "Pending" | "Rejected"): Record<string, unknown> {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  heartbeatResponse(): Record<string, unknown> {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  authorizeResponse(_status: "Accepted" | "Invalid" | "Blocked"): Record<string, unknown> {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  startTransactionResponse(_transactionId: number, _idTagStatus: "Accepted" | "Invalid"): Record<string, unknown> {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  stopTransactionResponse(): Record<string, unknown> {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  buildRemoteStart(_params: RemoteStartParams): OcppCallFrame {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  buildRemoteStop(_params: RemoteStopParams): OcppCallFrame {
    throw new OcppError(501, "unsupported_version", unsupportedAdapterMessage(this.protocolVersion));
  }

  parseRemoteCommandResult(): "unknown" {
    return "unknown";
  }
}

export const ocpp201Adapter = new Ocpp201Adapter();
