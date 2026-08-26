import { getPrisma } from "@/lib/db/prisma";
import { computePublicStatus } from "@/lib/status";
import { remoteChargingPolicyGate } from "./pilot";
import { toDriverSessionView } from "./sessions";
import { ocppRemoteCommandsEnabled } from "./config";

export async function getDriverSession(driverId: string, publicRef: string) {
  const prisma = getPrisma();
  const session = await prisma.chargingSession.findFirst({
    where: { publicRef, driverId },
    include: {
      station: { select: { name: true, slug: true, city: true } },
      connector: { select: { publicRef: true, connectorType: true, maxPowerWatts: true } },
      booking: { select: { publicRef: true, referenceCode: true, status: true } },
    },
  });
  return session;
}

export async function listDriverSessions(driverId: string) {
  const prisma = getPrisma();
  return prisma.chargingSession.findMany({
    where: { driverId },
    include: {
      station: { select: { name: true, slug: true, city: true } },
      connector: { select: { publicRef: true, connectorType: true, maxPowerWatts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function driverSessionApiView(session: {
  publicRef: string;
  status: Awaited<ReturnType<typeof listDriverSessions>>[number]["status"];
  failReason: string | null;
  supportReference: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  lastEvidenceAt: Date | null;
  energyMilliWh: bigint | null;
  meterUnit: string | null;
  updatedAt: Date;
  createdAt: Date;
  station: { name: string; slug: string; city: string };
  connector: { publicRef: string; connectorType: string; maxPowerWatts: number };
  booking?: { publicRef: string; referenceCode: string; status: string } | null;
}) {
  return {
    ...toDriverSessionView(session),
    bookingPublicRef: session.booking?.publicRef ?? null,
    bookingReference: session.booking?.referenceCode ?? null,
  };
}

export async function getPilotChargeOffer(input: {
  stationSlug: string;
  driverId: string | null;
}) {
  if (!ocppRemoteCommandsEnabled()) {
    return { show: false as const, reason: "remote_disabled" as const };
  }
  if (!input.driverId) {
    return { show: false as const, reason: "unauthenticated" as const, signInWouldHelp: false };
  }
  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { slug: input.stationSlug, publicationStatus: "published", isDemo: false },
    include: {
      connectors: {
        where: { installationStatus: "installed" },
        include: {
          currentStatus: true,
          chargePointConnectors: { include: { chargePoint: { include: { capabilities: true } } } },
        },
      },
    },
  });
  if (!station) return { show: false as const, reason: "station_unpublished" as const };

  const eligible = [];
  for (const connector of station.connectors) {
    const map = connector.chargePointConnectors[0];
    if (!map) continue;
    const capability = map.chargePoint.capabilities.some((row) => row.code === "remote_start" && row.enabled);
    const computed = computePublicStatus({
      recordedStatus: connector.currentStatus?.recordedStatus ?? null,
      statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
      overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
    });
    if (computed.publicStatus !== "available") continue;
    const gate = remoteChargingPolicyGate({
      commissioningState: map.chargePoint.commissioningState,
      stationId: station.id,
      connectorId: connector.id,
      driverId: input.driverId,
      capabilityEnabled: capability,
    });
    if (!gate.ok) continue;
    eligible.push({
      connectorId: connector.id,
      connectorPublicRef: connector.publicRef,
      evseHint: `connector ${connector.connectorIndex}`,
      connectorType: connector.connectorType,
      maxKw: connector.maxPowerWatts / 1000,
    });
  }
  if (eligible.length === 0) {
    return { show: false as const, reason: "not_pilot_eligible" as const };
  }
  return { show: true as const, connectors: eligible };
}
