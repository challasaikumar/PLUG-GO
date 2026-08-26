import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import { heartbeatStaleSeconds } from "@/lib/ocpp/config";
import { computePublicStatus } from "@/lib/status";
import { createIncident, hasOpenIncident, OPEN_STATUSES } from "./incidents";
import { OpsError } from "./roles";
import { resolveOpsScope, stationWhere } from "./scope";

/**
 * Suggests or creates incidents from operational signals.
 * Never closes an incident because a charger reconnects.
 */
export async function suggestIncidents(actor: StaffActor) {
  if (!roleAllows(actor, ROLE_MATRIX.writeIncidents)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot suggest incidents.");
  }
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  const staleMs = heartbeatStaleSeconds() * 1000;
  const created: string[] = [];
  const skippedOpen: string[] = [];

  const chargePoints = await prisma.chargePoint.findMany({
    where: { station: stationWhere(scope) },
    include: { station: { select: { id: true, name: true } } },
  });
  for (const cp of chargePoints) {
    const last = cp.lastHeartbeatAt;
    const age = last ? Date.now() - last.getTime() : Number.POSITIVE_INFINITY;
    const offline = cp.connectionStatus === "disconnected" || cp.connectionStatus === "rejected";
    const stale = age > staleMs;
    if (!offline && !stale) continue;
    const open = await hasOpenIncident(scope, { stationId: cp.stationId, chargePointId: cp.id });
    if (open) {
      skippedOpen.push(open.id);
      continue;
    }
    const incident = await createIncident(actor, {
      stationId: cp.stationId,
      chargePointId: cp.id,
      title: offline ? `${cp.station.name} charger offline` : `${cp.station.name} heartbeat stale`,
      summary: offline
        ? "Charge point connection is disconnected or rejected."
        : "Heartbeat is older than the stale threshold. Reconnect does not auto-close this incident.",
      severity: offline ? "high" : "medium",
      suggestedFrom: offline ? "heartbeat_offline" : "heartbeat_stale",
    });
    created.push(incident.id);
  }

  const connectors = await prisma.connector.findMany({
    where: { station: stationWhere(scope) },
    include: { currentStatus: true, station: { select: { name: true } } },
  });
  for (const connector of connectors) {
    const computed = computePublicStatus({
      recordedStatus: connector.currentStatus?.recordedStatus ?? null,
      statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
      overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
    });
    if (computed.publicStatus !== "faulted") continue;
    const open = await hasOpenIncident(scope, { stationId: connector.stationId, connectorId: connector.id });
    if (open) {
      skippedOpen.push(open.id);
      continue;
    }
    const incident = await createIncident(actor, {
      stationId: connector.stationId,
      connectorId: connector.id,
      title: `Faulted connector at ${connector.station.name}`,
      summary: "Connector public status is faulted.",
      severity: "high",
      suggestedFrom: "connector_faulted",
    });
    created.push(incident.id);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failed = await prisma.remoteCommand.groupBy({
    by: ["stationId", "connectorId"],
    where: {
      createdAt: { gte: since },
      status: { in: ["failed", "timeout"] },
      stationId: scope.stationIds === "all" ? undefined : { in: scope.stationIds },
    },
    _count: { _all: true },
  });
  for (const row of failed) {
    if (row._count._all < 2) continue;
    const open = await hasOpenIncident(scope, { stationId: row.stationId, connectorId: row.connectorId });
    if (open) {
      skippedOpen.push(open.id);
      continue;
    }
    const incident = await createIncident(actor, {
      stationId: row.stationId,
      connectorId: row.connectorId,
      title: "Repeated remote command failure",
      summary: `${row._count._all} failed or timed-out remote commands in 24 hours.`,
      severity: "high",
      suggestedFrom: "command_failure",
    });
    created.push(incident.id);
  }

  const anomalous = await prisma.chargingSession.findMany({
    where: {
      station: stationWhere(scope),
      status: "completed",
      energyMilliWh: null,
      endedAt: { gte: since },
    },
    take: 20,
  });
  for (const session of anomalous) {
    const open = await hasOpenIncident(scope, { stationId: session.stationId, connectorId: session.connectorId });
    if (open) {
      skippedOpen.push(open.id);
      continue;
    }
    const incident = await createIncident(actor, {
      stationId: session.stationId,
      connectorId: session.connectorId,
      chargingSessionId: session.id,
      title: "Session completed without meter energy",
      summary: "A completed session has no energyMilliWh. Finance settlement is not inferred.",
      severity: "medium",
      suggestedFrom: "meter_anomaly",
    });
    created.push(incident.id);
  }

  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const repeats = await prisma.supportIssue.groupBy({
    by: ["stationId"],
    where: {
      createdAt: { gte: week },
      stationId: { not: null },
      station: stationWhere(scope),
    },
    _count: { _all: true },
  });
  for (const row of repeats) {
    if (!row.stationId || row._count._all < 3) continue;
    const open = await prisma.incident.findFirst({
      where: { stationId: row.stationId, suggestedFrom: "support_repeat", status: { in: OPEN_STATUSES } },
    });
    if (open) {
      skippedOpen.push(open.id);
      continue;
    }
    const incident = await createIncident(actor, {
      stationId: row.stationId,
      title: "Repeated customer support issues",
      summary: `${row._count._all} support tickets at this station in 7 days.`,
      severity: "medium",
      suggestedFrom: "support_repeat",
    });
    created.push(incident.id);
  }

  return { created, skippedOpen, note: "Reconnect does not close incidents." };
}
