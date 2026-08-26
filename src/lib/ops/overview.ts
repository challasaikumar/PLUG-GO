import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import { heartbeatStaleSeconds } from "@/lib/ocpp/config";
import { computePublicStatus } from "@/lib/status";
import { canSeeFinance, canSeeCustomerContext } from "./roles";
import { resolveOpsScope, stationWhere } from "./scope";

export type OverviewFilters = {
  city?: string;
  stationId?: string;
  hostId?: string;
  connectorStatus?: string;
  severity?: "critical" | "high" | "medium" | "low";
  technicianId?: string;
  q?: string;
};

export async function getNetworkOverview(actor: StaffActor, filters: OverviewFilters = {}) {
  const generatedAt = new Date().toISOString();
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  const stationFilter = {
    AND: [
      stationWhere(scope),
      filters.stationId ? { id: filters.stationId } : {},
      filters.city ? { city: { equals: filters.city, mode: "insensitive" as const } } : {},
      filters.hostId ? { hostId: filters.hostId } : {},
      filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" as const } },
              { city: { contains: filters.q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [stations, incidents, commands, supportOpen, refundsPending, bookingsFailed] = await Promise.all([
    prisma.station.findMany({
      where: stationFilter,
      include: {
        host: { select: { id: true, hostDisplayName: true } },
        connectors: { include: { currentStatus: true } },
        chargePoints: {
          select: {
            id: true,
            connectionStatus: true,
            lastHeartbeatAt: true,
            lastBootAt: true,
            lastMeterAt: true,
            lastFaultCode: true,
            lastFaultAt: true,
          },
        },
        assignments: {
          where: { active: true, role: "technician" },
          select: { actorId: true },
        },
      },
      take: 200,
      orderBy: { name: "asc" },
    }),
    prisma.incident.groupBy({
      by: ["severity"],
      where: {
        status: { not: "closed" },
        station: stationFilter,
        severity: filters.severity,
        assignedTechnicianId: filters.technicianId,
      },
      _count: { _all: true },
    }),
    prisma.remoteCommand.groupBy({
      by: ["status"],
      where: {
        stationId: scope.stationIds === "all" ? undefined : { in: scope.stationIds },
      },
      _count: { _all: true },
    }),
    roleAllows(actor, ROLE_MATRIX.readSupportQueue)
      ? prisma.supportIssue.count({
          where: {
            status: { in: ["open", "pending_ops", "pending_user"] },
            station: stationFilter,
          },
        })
      : Promise.resolve(null),
    canSeeFinance(actor)
      ? prisma.refund.count({
          where: {
            status: { in: ["requested", "pending_review", "pending_provider", "failed"] },
            booking: { station: stationFilter },
          },
        })
      : Promise.resolve(null),
    canSeeCustomerContext(actor) || roleAllows(actor, ROLE_MATRIX.readOpsSessions)
      ? prisma.booking.count({
          where: {
            status: { in: ["payment_failed", "expired"] },
            station: stationFilter,
          },
        })
      : Promise.resolve(null),
  ]);

  const staleMs = heartbeatStaleSeconds() * 1000;
  let fresh = 0;
  let stale = 0;
  let offline = 0;
  let unknown = 0;
  let faulted = 0;
  let available = 0;
  let inUse = 0;
  const heartbeatIssues: Array<{
    stationId: string;
    stationName: string;
    chargePointId: string;
    lastHeartbeatAt: string | null;
    connectionStatus: string;
    issue: string;
  }> = [];

  for (const station of stations) {
    if (filters.technicianId && !station.assignments.some((row) => row.actorId === filters.technicianId)) {
      continue;
    }
    for (const connector of station.connectors) {
      const computed = computePublicStatus({
        recordedStatus: connector.currentStatus?.recordedStatus ?? null,
        statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
        overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
      });
      if (filters.connectorStatus && computed.publicStatus !== filters.connectorStatus) continue;
      if (computed.publicStatus === "available") available += 1;
      else if (computed.publicStatus === "in_use") inUse += 1;
      else if (computed.publicStatus === "faulted") faulted += 1;
      else if (computed.publicStatus === "offline") offline += 1;
      else if (computed.publicStatus === "stale") stale += 1;
      else unknown += 1;
      if (computed.freshnessPolicy === "configured" && computed.publicStatus === "available") fresh += 1;
    }
    for (const cp of station.chargePoints) {
      const last = cp.lastHeartbeatAt;
      const age = last ? Date.now() - last.getTime() : null;
      if (cp.connectionStatus === "disconnected" || cp.connectionStatus === "rejected") {
        heartbeatIssues.push({
          stationId: station.id,
          stationName: station.name,
          chargePointId: cp.id,
          lastHeartbeatAt: last?.toISOString() ?? null,
          connectionStatus: cp.connectionStatus,
          issue: "offline",
        });
      } else if (age === null || age > staleMs) {
        heartbeatIssues.push({
          stationId: station.id,
          stationName: station.name,
          chargePointId: cp.id,
          lastHeartbeatAt: last?.toISOString() ?? null,
          connectionStatus: cp.connectionStatus,
          issue: "stale_heartbeat",
        });
      }
    }
  }

  const pendingCommands = commands
    .filter((row) => row.status === "queued" || row.status === "dispatching")
    .reduce((sum, row) => sum + row._count._all, 0);
  const failedCommands = commands
    .filter((row) => row.status === "failed" || row.status === "timeout" || row.status === "rejected")
    .reduce((sum, row) => sum + row._count._all, 0);

  return {
    generatedAt,
    freshnessPolicyMinutes: computePublicStatus({
      recordedStatus: null,
      statusUpdatedAt: null,
      overrideExpiresAt: null,
    }).freshnessMinutes,
    stationCount: stations.length,
    connectorHealth: { available, inUse, faulted, offline, stale, unknown, freshAvailable: fresh },
    incidentsOpenBySeverity: {
      critical: incidents.find((row) => row.severity === "critical")?._count._all ?? 0,
      high: incidents.find((row) => row.severity === "high")?._count._all ?? 0,
      medium: incidents.find((row) => row.severity === "medium")?._count._all ?? 0,
      low: incidents.find((row) => row.severity === "low")?._count._all ?? 0,
    },
    commands: { pending: pendingCommands, failed: failedCommands },
    heartbeatIssues: heartbeatIssues.slice(0, 20),
    exceptions: {
      supportOpen,
      refundsPending,
      bookingsFailed,
    },
    stations: stations.slice(0, 40).map((station) => ({
      id: station.id,
      name: station.name,
      city: station.city,
      slug: station.slug,
      host: station.host.hostDisplayName,
      connectorCount: station.connectors.length,
      chargePointCount: station.chargePoints.length,
      assignedTechnicians: station.assignments.map((row) => row.actorId),
    })),
  };
}
