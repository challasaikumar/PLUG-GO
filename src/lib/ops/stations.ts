import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { listStationAudit, overrideStatus } from "@/lib/catalogue/hardware-service";
import { getPrisma } from "@/lib/db/prisma";
import { computePublicStatus } from "@/lib/status";
import { canSeeRawDeviceIdentity, canSeeSessions, OpsError } from "./roles";
import { assertStationAccess, resolveOpsScope, stationWhere } from "./scope";

export async function listOpsStations(actor: StaffActor, filters: { city?: string; q?: string; hostId?: string }) {
  if (!roleAllows(actor, ROLE_MATRIX.readOpsStations)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot list operational stations.");
  }
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  return prisma.station.findMany({
    where: {
      AND: [
        stationWhere(scope),
        filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {},
        filters.hostId ? { hostId: filters.hostId } : {},
        filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { slug: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: {
      host: { select: { id: true, hostDisplayName: true } },
      connectors: { include: { currentStatus: true } },
      _count: { select: { incidents: true, chargePoints: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function getOpsStation(actor: StaffActor, stationId: string) {
  if (!roleAllows(actor, ROLE_MATRIX.readOpsStations)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot open operational stations.");
  }
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, stationId);
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
      host: true,
      organisation: { select: { id: true, brandName: true } },
      evses: {
        include: {
          connectors: { include: { currentStatus: true } },
        },
      },
      tariffs: { orderBy: { createdAt: "desc" }, take: 20 },
      chargePoints: {
        include: {
          capabilities: true,
          faults: { orderBy: { occurredAt: "desc" }, take: 5 },
        },
      },
      incidents: { orderBy: { createdAt: "desc" }, take: 20 },
      supportIssues: { orderBy: { createdAt: "desc" }, take: 10 },
      assignments: { where: { active: true } },
      workOrders: { orderBy: { createdAt: "desc" }, take: 10 },
      chargingSessions: canSeeSessions(actor)
        ? { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, publicRef: true, status: true, createdAt: true, driverId: true } }
        : false,
      bookings: canSeeSessions(actor)
        ? { orderBy: { createdAt: "desc" }, take: 10, select: { publicRef: true, status: true, windowStart: true } }
        : false,
    },
  });
  if (!station) throw new OpsError(404, "not_found", "That station was not found.");
  const audit = roleAllows(actor, ROLE_MATRIX.readAudit) ? await listStationAudit(stationId) : [];
  const connectors = station.evses.flatMap((evse) =>
    evse.connectors.map((connector) => {
      const computed = computePublicStatus({
        recordedStatus: connector.currentStatus?.recordedStatus ?? null,
        statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
        overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
      });
      return {
        id: connector.id,
        publicRef: connector.publicRef,
        connectorType: connector.connectorType,
        evseId: evse.id,
        computed,
        recordedStatus: connector.currentStatus?.recordedStatus ?? null,
        overrideReason: connector.currentStatus?.overrideReason ?? null,
        overrideExpiresAt: connector.currentStatus?.overrideExpiresAt?.toISOString() ?? null,
        statusUpdatedAt: connector.currentStatus?.statusUpdatedAt?.toISOString() ?? null,
      };
    }),
  );

  const rawOk = canSeeRawDeviceIdentity(actor);
  return {
    station: {
      id: station.id,
      name: station.name,
      slug: station.slug,
      city: station.city,
      state: station.state,
      addressLine1: station.addressLine1,
      landmark: station.landmark,
      arrivalInstructions: station.arrivalInstructions,
      emergencyInstructions: station.emergencyInstructions,
      accessHoursSummary: station.accessHoursSummary,
      accessType: station.accessType,
      supportPhoneOverride: station.supportPhoneOverride,
      publicationStatus: station.publicationStatus,
      operationalLifecycle: station.operationalLifecycle,
      host: {
        id: station.host.id,
        hostDisplayName: station.host.hostDisplayName,
        contractStatus: station.host.contractStatus,
      },
      organisation: station.organisation,
      publicPath: `/stations/${station.state.toLowerCase()}/${station.city.toLowerCase()}/${station.slug}`,
    },
    connectors,
    chargePoints: station.chargePoints.map((cp) => ({
      id: cp.id,
      vendor: cp.vendor,
      model: cp.model,
      identity: rawOk ? cp.identity : null,
      serialNumber: rawOk ? cp.serialNumber : null,
      firmwareVersion: rawOk ? cp.firmwareVersion : null,
      commissioningState: cp.commissioningState,
      connectionStatus: cp.connectionStatus,
      lastHeartbeatAt: cp.lastHeartbeatAt?.toISOString() ?? null,
      lastMeterAt: cp.lastMeterAt?.toISOString() ?? null,
      lastBootAt: cp.lastBootAt?.toISOString() ?? null,
      lastFaultAt: cp.lastFaultAt?.toISOString() ?? null,
      lastFaultCode: cp.lastFaultCode,
      capabilities: cp.capabilities.map((row) => ({ code: row.code, enabled: row.enabled })),
      recentFaults: cp.faults.map((fault) => ({
        code: fault.code,
        occurredAt: fault.occurredAt.toISOString(),
        info: fault.info,
      })),
    })),
    tariffs: station.tariffs.map((row) => ({
      id: row.id,
      approvalStatus: row.approvalStatus,
      effectiveFrom: row.effectiveFrom.toISOString(),
      effectiveTo: row.effectiveTo?.toISOString() ?? null,
      energyPaisePerKwh: row.energyPaisePerKwh,
      timeBand: row.timeBand,
    })),
    incidents: station.incidents,
    supportIssues: station.supportIssues.map((issue) => ({
      id: issue.id,
      publicReference: issue.publicReference,
      status: issue.status,
      category: issue.category,
      createdAt: issue.createdAt.toISOString(),
    })),
    assignments: station.assignments,
    workOrders: station.workOrders,
    sessions: station.chargingSessions || [],
    bookings: station.bookings || [],
    audit: (audit ?? []).slice(0, 20).map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actorId,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function opsOverrideStatus(
  actor: StaffActor,
  raw: unknown,
  requestId?: string,
) {
  if (!roleAllows(actor, ROLE_MATRIX.statusOverride)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot override connector status.");
  }
  const parsed = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const connectorId = typeof parsed.connectorId === "string" ? parsed.connectorId : "";
  const prisma = getPrisma();
  const connector = await prisma.connector.findUnique({ where: { id: connectorId } });
  if (!connector) throw new OpsError(404, "not_found", "That connector was not found.");
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, connector.stationId);
  return overrideStatus(actor, raw, requestId);
}
