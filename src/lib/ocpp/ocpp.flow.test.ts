import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { requestDriverOtp, verifyDriverOtp } from "@/lib/auth/otp";
import { getPublicStationBySlug } from "@/lib/catalogue/station-service";
import { authorizeChargePointConnection } from "./authorize-connection";
import { CsmsCommandService, type CommandDispatcher } from "./commands";
import { chargerCredentialService } from "./credentials";
import { csmsEventIngestor, markExpiredHeartbeats } from "./ingest";
import { ocpp16Adapter } from "./ocpp16";
import { getDriverSession } from "./queries";
import { ChargerConnectionRegistry } from "./registry";

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

const db = process.env.DATABASE_URL?.trim();

function uniquePhone(head: "6" | "7" | "8" | "9"): string {
  const rest = String(100000000 + Math.floor(Math.random() * 899999999)).slice(0, 9);
  return `+91${head}${rest}`;
}

describe.skipIf(!db)("phase 9 OCPP CSMS foundation", () => {
  const prisma = new PrismaClient();
  const suffix = `p9-${Date.now()}`;
  const ids = { org: `p9-org-${suffix}`, host: `p9-host-${suffix}` };
  const phoneA = uniquePhone("8");
  const phoneB = uniquePhone("9");
  const original = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DEV_OTP: process.env.AUTH_DEV_OTP,
    NODE_ENV: process.env.NODE_ENV,
    OCPP_ENABLED: process.env.OCPP_ENABLED,
    OCPP_REMOTE_COMMANDS_ENABLED: process.env.OCPP_REMOTE_COMMANDS_ENABLED,
    CSMS_MODE: process.env.CSMS_MODE,
    OCPP_PILOT_STATION_IDS: process.env.OCPP_PILOT_STATION_IDS,
    OCPP_PILOT_CONNECTOR_IDS: process.env.OCPP_PILOT_CONNECTOR_IDS,
    OCPP_PILOT_DRIVER_IDS: process.env.OCPP_PILOT_DRIVER_IDS,
    AVAILABILITY_FRESHNESS_MINUTES: process.env.AVAILABILITY_FRESHNESS_MINUTES,
    OCPP_COMMAND_TIMEOUT_SECONDS: process.env.OCPP_COMMAND_TIMEOUT_SECONDS,
    OCPP_START_EVIDENCE_TIMEOUT_SECONDS: process.env.OCPP_START_EVIDENCE_TIMEOUT_SECONDS,
    OCPP_HEARTBEAT_STALE_SECONDS: process.env.OCPP_HEARTBEAT_STALE_SECONDS,
    CSMS_CREDENTIAL_PEPPER: process.env.CSMS_CREDENTIAL_PEPPER,
  };

  beforeAll(() => {
    setEnv("AUTH_SECRET", "phase9-test-secret-value");
    setEnv("CSMS_CREDENTIAL_PEPPER", "phase9-test-secret-value");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("NODE_ENV", "test");
    setEnv("OCPP_ENABLED", "true");
    setEnv("OCPP_REMOTE_COMMANDS_ENABLED", "true");
    setEnv("CSMS_MODE", "test");
    setEnv("AVAILABILITY_FRESHNESS_MINUTES", "120");
    setEnv("OCPP_COMMAND_TIMEOUT_SECONDS", "5");
    setEnv("OCPP_START_EVIDENCE_TIMEOUT_SECONDS", "5");
    setEnv("OCPP_HEARTBEAT_STALE_SECONDS", "30");
  });

  afterAll(async () => {
    for (const [key, value] of Object.entries(original)) setEnv(key, value);
    await prisma.remoteCommandAttempt.deleteMany({
      where: { command: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } } },
    });
    await prisma.remoteCommand.deleteMany({
      where: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    const chargePointIds = (
      await prisma.chargePoint.findMany({
        where: { station: { slug: { startsWith: `p9-${suffix}` } } },
        select: { id: true },
      })
    ).map((row) => row.id);
    await prisma.meterValue.deleteMany({ where: { chargePointId: { in: chargePointIds } } });
    await prisma.chargingSessionEvent.deleteMany({
      where: { session: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.sessionAuthorization.deleteMany({
      where: { session: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.chargingSession.deleteMany({ where: { station: { slug: { startsWith: `p9-${suffix}` } } } });
    await prisma.ocppProtocolEvent.deleteMany({
      where: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.ocppMessageAudit.deleteMany({
      where: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.chargerFault.deleteMany({
      where: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.deviceHealthAlert.deleteMany({
      where: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.chargerConnection.deleteMany({
      where: { chargePoint: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.connectorStatusSnapshot.deleteMany({
      where: { connector: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.maintenanceEvidence.deleteMany({
      where: { workOrder: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.maintenanceChecklist.deleteMany({
      where: { workOrder: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.technicianWorkOrder.deleteMany({
      where: { station: { slug: { startsWith: `p9-${suffix}` } } },
    });
    await prisma.incidentEvent.deleteMany({
      where: { incident: { station: { slug: { startsWith: `p9-${suffix}` } } } },
    });
    await prisma.incident.deleteMany({ where: { station: { slug: { startsWith: `p9-${suffix}` } } } });
    await prisma.commandApproval.deleteMany({
      where: { station: { slug: { startsWith: `p9-${suffix}` } } },
    });
    await prisma.chargePoint.deleteMany({ where: { station: { slug: { startsWith: `p9-${suffix}` } } } });
    await prisma.station.deleteMany({ where: { slug: { startsWith: `p9-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: ids.host } });
    await prisma.organisation.deleteMany({ where: { id: ids.org } });
    await prisma.driver.deleteMany({ where: { phoneE164: { in: [phoneA, phoneB] } } });
    await prisma.driverAuthChallenge.deleteMany({ where: { phoneE164: { in: [phoneA, phoneB] } } });
    await prisma.$disconnect();
  });

  async function signIn(phone: string, ip: string) {
    const otp = await requestDriverOtp({ phone, ip });
    const session = await verifyDriverOtp({
      phone,
      challengeId: otp.challengeId,
      code: otp.developmentCode,
    });
    return session.driver;
  }

  it("rejects unknown/disabled chargers, normalizes 1.6 events, and keeps charging evidence-gated", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: ids.org,
        legalName: "Phase 9 org",
        brandName: "Phase 9",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const host = await prisma.host.create({
      data: {
        id: ids.host,
        organisationId: organisation.id,
        hostLegalName: "Phase 9 host",
        hostDisplayName: "Phase 9 host",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    const station = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: `Phase 9 hub ${suffix}`,
        slug: `p9-${suffix}-hub`,
        city: "Hyderabad",
        state: "Telangana",
        latitude: "17.385000",
        longitude: "78.486700",
        addressLine1: "Test road",
        pincode: "500001",
        accessHoursSummary: "24/7",
        accessType: "public",
        publicationStatus: "published",
        operationalLifecycle: "open",
        isDemo: false,
        dataSource: "other",
        lastVerifiedAt: new Date(),
        verifiedBy: "test",
      },
    });
    const evse = await prisma.evse.create({
      data: {
        stationId: station.id,
        evseLabel: "Bay 1",
        maxPowerWatts: 60000,
        powerType: "dc",
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    const connector = await prisma.connector.create({
      data: {
        evseId: evse.id,
        stationId: station.id,
        connectorIndex: 1,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    await prisma.currentConnectorStatus.create({
      data: {
        connectorId: connector.id,
        recordedStatus: "unknown",
        source: "manual_import",
        statusUpdatedAt: new Date(),
      },
    });

    const unknown = await authorizeChargePointConnection({
      identity: "no-such-cp",
      pathVersion: "ocpp_1_6",
      password: "x",
      duplicate: false,
      connectionCount: 0,
      ipCount: 0,
    });
    expect(unknown).toEqual({ ok: false, reason: "unknown_charge_point" });

    const identity = `PNG-P9-${suffix}`;
    const chargePoint = await prisma.chargePoint.create({
      data: {
        identity,
        stationId: station.id,
        evseId: evse.id,
        vendor: "PlugAndGoSim",
        model: "SIM-1.6",
        serialNumber: "STAFF-ONLY-SERIAL",
        firmwareVersion: "sim-0.1.0",
        protocolVersion: "ocpp_1_6",
        securityProfile: "basic_auth",
        endpointPath: `/ocpp/1.6/${identity}`,
        commissioningState: "disabled",
        connectorMaps: { create: { connectorId: connector.id, ocppConnectorId: 1 } },
        capabilities: {
          create: [
            { code: "remote_start", enabled: true },
            { code: "remote_stop", enabled: true },
            { code: "meter_values", enabled: true },
          ],
        },
      },
    });
    const rotated = await chargerCredentialService.rotate(chargePoint.id);
    const disabled = await authorizeChargePointConnection({
      identity,
      pathVersion: "ocpp_1_6",
      password: rotated.password,
      duplicate: false,
      connectionCount: 0,
      ipCount: 0,
    });
    expect(disabled).toEqual({ ok: false, reason: "disabled" });

    await prisma.chargePoint.update({ where: { id: chargePoint.id }, data: { commissioningState: "test" } });
    const authed = await authorizeChargePointConnection({
      identity,
      pathVersion: "ocpp_1_6",
      password: rotated.password,
      duplicate: false,
      connectionCount: 0,
      ipCount: 0,
    });
    expect(authed.ok).toBe(true);
    const badPassword = await authorizeChargePointConnection({
      identity,
      pathVersion: "ocpp_1_6",
      password: "wrong-password",
      duplicate: false,
      connectionCount: 0,
      ipCount: 0,
    });
    expect(badPassword).toEqual({ ok: false, reason: "unauthorized" });
    const dup = await authorizeChargePointConnection({
      identity,
      pathVersion: "ocpp_1_6",
      password: rotated.password,
      duplicate: true,
      connectionCount: 0,
      ipCount: 0,
    });
    expect(dup).toEqual({ ok: false, reason: "duplicate" });

    const v201 = await authorizeChargePointConnection({
      identity,
      pathVersion: "ocpp_2_0_1",
      password: rotated.password,
      duplicate: false,
      connectionCount: 0,
      ipCount: 0,
    });
    expect(v201).toEqual({ ok: false, reason: "suspicious" });

    const cp = await prisma.chargePoint.findUniqueOrThrow({ where: { id: chargePoint.id } });
    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "boot-1",
        action: "BootNotification",
        payload: { chargePointVendor: "PlugAndGoSim", chargePointModel: "SIM-1.6", firmwareVersion: "sim-0.1.0" },
      }),
    });
    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({ kind: "call", uniqueId: "hb-1", action: "Heartbeat", payload: {} }),
    });
    const availableAt = new Date().toISOString();
    const firstStatus = await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "st-1",
        action: "StatusNotification",
        payload: {
          connectorId: 1,
          status: "Available",
          errorCode: "NoError",
          timestamp: availableAt,
        },
      }),
    });
    expect(firstStatus.duplicate).toBe(false);
    const dupEvent = await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "st-1",
        action: "StatusNotification",
        payload: { connectorId: 1, status: "Faulted", errorCode: "GroundFailure" },
      }),
    });
    expect(dupEvent.duplicate).toBe(true);

    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "st-old",
        action: "StatusNotification",
        payload: {
          connectorId: 1,
          status: "Faulted",
          errorCode: "GroundFailure",
          timestamp: new Date(Date.now() - 60_000).toISOString(),
        },
      }),
    });
    const current = await prisma.currentConnectorStatus.findUniqueOrThrow({ where: { connectorId: connector.id } });
    expect(current.recordedStatus).toBe("available");

    const publicStation = await getPublicStationBySlug(station.slug);
    const publicJson = JSON.stringify(publicStation);
    expect(publicJson).not.toContain("STAFF-ONLY-SERIAL");
    expect(publicJson).not.toContain(rotated.password);
    expect(publicJson).not.toContain(identity);
    expect(publicStation?.connectors[0]?.publicStatus).toBe("available");
    expect(publicStation?.connectors[0]?.statusUpdatedAt).toBeTruthy();

    const driverA = await signIn(phoneA, `198.51.100.${20 + (Date.now() % 50)}`);
    const driverB = await signIn(phoneB, `198.51.100.${80 + (Date.now() % 50)}`);
    setEnv("OCPP_PILOT_STATION_IDS", station.id);
    setEnv("OCPP_PILOT_CONNECTOR_IDS", connector.id);
    setEnv("OCPP_PILOT_DRIVER_IDS", driverA.id);

    const outbound: string[] = [];
    const dispatcher: CommandDispatcher = async (input) => {
      outbound.push(input.rawFrame);
      return { delivered: true };
    };
    const commands = new CsmsCommandService(dispatcher);
    const started = await commands.requestRemoteStart({
      actorType: "driver",
      actorId: driverA.id,
      driverId: driverA.id,
      connectorId: connector.id,
      reason: "test_start",
      idempotencyKey: `p9-start-${suffix}`,
    });
    expect(started.command.session?.status).toBe("requested");
    const again = await commands.requestRemoteStart({
      actorType: "driver",
      actorId: driverA.id,
      driverId: driverA.id,
      connectorId: connector.id,
      reason: "test_start",
      idempotencyKey: `p9-start-${suffix}`,
    });
    expect(again.reused).toBe(true);
    expect(outbound).toHaveLength(1);

    const call = JSON.parse(outbound[0] ?? "[]") as unknown[];
    expect(call[2]).toBe("RemoteStartTransaction");
    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call_result",
        uniqueId: String(call[1]),
        payload: { status: "Accepted" },
      }),
    });
    const afterAccept = await prisma.chargingSession.findFirstOrThrow({
      where: { id: started.command.sessionId! },
    });
    expect(afterAccept.status).toBe("starting");

    const idTag = (call[3] as { idTag: string }).idTag;
    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "start-tx",
        action: "StartTransaction",
        payload: { connectorId: 1, idTag, meterStart: 0, timestamp: new Date().toISOString() },
      }),
    });
    const charging = await prisma.chargingSession.findFirstOrThrow({ where: { id: afterAccept.id } });
    expect(charging.status).toBe("charging");
    expect(charging.ocppTransactionId).toBeTruthy();

    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "meter-1",
        action: "MeterValues",
        payload: {
          connectorId: 1,
          transactionId: Number(charging.ocppTransactionId),
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [{ value: "1500", unit: "Wh", measurand: "Energy.Active.Import.Register" }],
            },
          ],
        },
      }),
    });
    const metered = await prisma.chargingSession.findFirstOrThrow({ where: { id: charging.id } });
    expect(metered.energyMilliWh).toBe(1_500_000n);

    const owned = await getDriverSession(driverA.id, metered.publicRef);
    const other = await getDriverSession(driverB.id, metered.publicRef);
    expect(owned?.id).toBe(metered.id);
    expect(other).toBeNull();

    await csmsEventIngestor.ingestRaw({
      chargePoint: cp,
      raw: ocpp16Adapter.serialize({
        kind: "call",
        uniqueId: "fault-1",
        action: "StatusNotification",
        payload: {
          connectorId: 1,
          status: "Faulted",
          errorCode: "GroundFailure",
          timestamp: new Date().toISOString(),
        },
      }),
    });
    const interrupted = await prisma.chargingSession.findFirstOrThrow({ where: { id: metered.id } });
    expect(interrupted.status).toBe("interrupted");

    const secondConnector = await prisma.connector.create({
      data: {
        evseId: evse.id,
        stationId: station.id,
        connectorIndex: 2,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    await prisma.currentConnectorStatus.create({
      data: {
        connectorId: secondConnector.id,
        recordedStatus: "available",
        source: "csms_ocpp",
        statusUpdatedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });
    await prisma.chargePointConnector.create({
      data: { chargePointId: chargePoint.id, connectorId: secondConnector.id, ocppConnectorId: 2 },
    });
    await prisma.chargePoint.update({
      where: { id: chargePoint.id },
      data: { connectionStatus: "connected", lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000) },
    });
    await markExpiredHeartbeats(new Date());
    const stale = await prisma.currentConnectorStatus.findUniqueOrThrow({
      where: { connectorId: secondConnector.id },
    });
    expect(stale.recordedStatus).not.toBe("available");
    expect(stale.source).toBe("heartbeat_timeout");

    const timeoutStationAllow = station.id;
    setEnv("OCPP_PILOT_CONNECTOR_IDS", `${connector.id},${secondConnector.id}`);
    await prisma.currentConnectorStatus.update({
      where: { connectorId: secondConnector.id },
      data: { recordedStatus: "available", source: "csms_ocpp", statusUpdatedAt: new Date() },
    });
    const timeoutCommands = new CsmsCommandService(async () => ({ delivered: true }));
    const pending = await timeoutCommands.requestRemoteStart({
      actorType: "driver",
      actorId: driverA.id,
      driverId: driverA.id,
      connectorId: secondConnector.id,
      reason: "timeout_case",
      idempotencyKey: `p9-timeout-${suffix}`,
    });
    await prisma.remoteCommand.update({
      where: { id: pending.command.id },
      data: { timeoutAt: new Date(Date.now() - 1000), status: "dispatching" },
    });
    await timeoutCommands.reconcileTimeouts(new Date());
    const timed = await prisma.chargingSession.findFirstOrThrow({ where: { id: pending.command.sessionId! } });
    expect(timed.status).toBe("timed_out");
    void timeoutStationAllow;

    const registry = new ChargerConnectionRegistry();
    expect(registry.size()).toBe(0);
  });
});
