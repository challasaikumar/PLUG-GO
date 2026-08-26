import type { Prisma } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import { OpsError } from "./roles";

export type IdScope = string[] | "all";

export type OpsScope = {
  actor: StaffActor;
  stationIds: IdScope;
  hostIds: IdScope;
  fleetIds: IdScope;
  organisationIds: IdScope;
};

function idsOrEmpty(rows: Array<{ id?: string } | { stationId?: string } | { hostId?: string } | { fleetOrganisationId?: string } | { organisationId?: string | null }>, key: string): string[] {
  return rows
    .map((row) => (row as Record<string, string | null | undefined>)[key])
    .filter((value): value is string => Boolean(value));
}

export async function resolveOpsScope(actor: StaffActor): Promise<OpsScope> {
  const prisma = getPrisma();

  if (actor.role === "super_admin") {
    return {
      actor,
      stationIds: "all",
      hostIds: "all",
      fleetIds: "all",
      organisationIds: "all",
    };
  }

  if (actor.role === "host_admin" || actor.role === "host_viewer") {
    const memberships = await prisma.hostMembership.findMany({
      where: { actorId: actor.id, active: true, role: actor.role },
      select: { hostId: true },
    });
    const hostIds = memberships.map((row) => row.hostId);
    const stations = hostIds.length
      ? await prisma.station.findMany({ where: { hostId: { in: hostIds } }, select: { id: true } })
      : [];
    return {
      actor,
      stationIds: stations.map((row) => row.id),
      hostIds,
      fleetIds: [],
      organisationIds: [],
    };
  }

  if (actor.role === "fleet_admin" || actor.role === "fleet_viewer") {
    const memberships = await prisma.fleetMembership.findMany({
      where: { actorId: actor.id, active: true, role: actor.role },
      select: { fleetOrganisationId: true },
    });
    return {
      actor,
      stationIds: [],
      hostIds: [],
      fleetIds: memberships.map((row) => row.fleetOrganisationId),
      organisationIds: [],
    };
  }

  if (actor.role === "technician") {
    const assignments = await prisma.stationAssignment.findMany({
      where: { actorId: actor.id, active: true, role: "technician" },
      select: { stationId: true },
    });
    return {
      actor,
      stationIds: assignments.map((row) => row.stationId),
      hostIds: [],
      fleetIds: [],
      organisationIds: [],
    };
  }

  const memberships = await prisma.staffMembership.findMany({
    where: { actorId: actor.id, active: true },
    select: { organisationId: true },
  });
  const organisationIds = idsOrEmpty(memberships, "organisationId");
  if (organisationIds.length === 0) {
    return {
      actor,
      stationIds: "all",
      hostIds: "all",
      fleetIds: [],
      organisationIds: "all",
    };
  }
  const stations = await prisma.station.findMany({
    where: { organisationId: { in: organisationIds } },
    select: { id: true, hostId: true },
  });
  return {
    actor,
    stationIds: stations.map((row) => row.id),
    hostIds: [...new Set(stations.map((row) => row.hostId))],
    fleetIds: [],
    organisationIds,
  };
}

export function stationWhere(scope: OpsScope): Prisma.StationWhereInput {
  if (scope.stationIds === "all") return {};
  if (scope.stationIds.length === 0) return { id: { in: [] } };
  return { id: { in: scope.stationIds } };
}

export function assertStationAccess(scope: OpsScope, stationId: string) {
  if (scope.stationIds === "all") return;
  if (!scope.stationIds.includes(stationId)) {
    throw new OpsError(403, "staff_forbidden", "This actor is not assigned to that station.");
  }
}

export function assertHostAccess(scope: OpsScope, hostId: string) {
  if (scope.hostIds === "all") return;
  if (!scope.hostIds.includes(hostId)) {
    throw new OpsError(403, "staff_forbidden", "This actor is not assigned to that host.");
  }
}

export function assertFleetAccess(scope: OpsScope, fleetId: string) {
  if (scope.fleetIds === "all") return;
  if (!scope.fleetIds.includes(fleetId)) {
    throw new OpsError(403, "staff_forbidden", "This actor is not assigned to that fleet.");
  }
}

export async function assertStationAccessById(actor: StaffActor, stationId: string) {
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, stationId);
  return scope;
}
