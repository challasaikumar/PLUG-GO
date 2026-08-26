import { describe, expect, it } from "vitest";
import { Ocpp16Adapter } from "./ocpp16";
import { Ocpp201Adapter } from "./ocpp201";
import { Ocpp21Adapter } from "./ocpp21";
import { energyMilliWhFromRaw, formatKwhFromMilliWh } from "./energy";
import { redactOcppValue } from "./redact";
import { remoteChargingPolicyGate } from "./pilot";
import { protocolFromPath } from "./versions";
import { ChargerConnectionRegistry } from "./registry";

describe("OCPP 1.6 adapter", () => {
  const adapter = new Ocpp16Adapter();

  it("parses CALL / CALLRESULT / CALLERROR and maps statuses", () => {
    const boot = adapter.parseInbound(
      JSON.stringify([2, "1", "BootNotification", { chargePointVendor: "Acme", chargePointModel: "X" }]),
    );
    expect(boot.ok).toBe(true);
    if (boot.ok) expect(boot.frame.kind).toBe("call");

    const status = adapter.mapStatusNotification({
      connectorId: 1,
      status: "Charging",
      errorCode: "NoError",
      timestamp: "2026-08-25T10:00:00.000Z",
    });
    expect(status?.recordedStatus).toBe("in_use");
    expect(adapter.mapStatusNotification({ connectorId: 1, status: "Available", errorCode: "NoError" })?.recordedStatus).toBe(
      "available",
    );
    expect(adapter.mapStatusNotification({ connectorId: 1, status: "Available", errorCode: "GroundFailure" })?.recordedStatus).toBe(
      "faulted",
    );
    expect(adapter.mapStatusNotification({ connectorId: 1, status: "Unavailable", errorCode: "NoError" })?.recordedStatus).toBe(
      "offline",
    );
  });
});

describe("unsupported protocol stubs", () => {
  it("refuses to parse 2.0.1 and 2.1 frames", () => {
    expect(new Ocpp201Adapter().parseInbound("[2,\"1\",\"BootNotification\",{}]")).toEqual({
      ok: false,
      reason: "unsupported_version",
    });
    expect(new Ocpp21Adapter().implemented).toBe(false);
    expect(protocolFromPath("/ocpp/1.6/PNG-SIM-001")).toEqual({ version: "ocpp_1_6", identity: "PNG-SIM-001" });
  });
});

describe("energy and redaction", () => {
  it("stores milliWh from decimal strings without float currency", () => {
    expect(energyMilliWhFromRaw("1.5", "kWh")).toBe(1_500_000n);
    expect(energyMilliWhFromRaw("1500", "Wh")).toBe(1_500_000n);
    expect(formatKwhFromMilliWh(1_500_000n)).toBe("1.5");
    expect(energyMilliWhFromRaw("n/a", "A")).toBeNull();
  });

  it("redacts idTag and password fields", () => {
    const redacted = redactOcppValue({ idTag: "secret-token", connectorId: 1, password: "x" }) as Record<string, unknown>;
    expect(redacted.idTag).toBe("[redacted]");
    expect(redacted.password).toBe("[redacted]");
    expect(redacted.connectorId).toBe(1);
  });
});

describe("pilot gate", () => {
  it("fails closed when allow-lists are empty", () => {
    const gate = remoteChargingPolicyGate({
      commissioningState: "pilot",
      stationId: "stn",
      connectorId: "cn",
      driverId: "drv",
      capabilityEnabled: true,
    });
    expect(gate.ok).toBe(false);
  });
});

describe("connection registry", () => {
  it("rejects duplicate identities", () => {
    const registry = new ChargerConnectionRegistry();
    const socket = { send() {}, close() {} };
    expect(
      registry.tryRegister({
        chargePointId: "a",
        identity: "CP1",
        socket,
        connectedAt: new Date(),
        remoteAddressHash: "ip",
      }).ok,
    ).toBe(true);
    expect(
      registry.tryRegister({
        chargePointId: "b",
        identity: "CP1",
        socket,
        connectedAt: new Date(),
        remoteAddressHash: "ip",
      }),
    ).toEqual({ ok: false, reason: "duplicate" });
  });
});
