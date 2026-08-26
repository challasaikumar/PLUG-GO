import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import { maskDriverRef, OpsError } from "./roles";
import { resolveOpsScope } from "./scope";

export async function getFleetPortal(actor: StaffActor) {
  if (!roleAllows(actor, ROLE_MATRIX.readFleetPortal)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot open the fleet portal.");
  }
  const scope = await resolveOpsScope(actor);
  if (scope.fleetIds !== "all" && scope.fleetIds.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      fleets: [],
      note: "No fleet membership is assigned to this actor.",
    };
  }
  const prisma = getPrisma();
  const fleets = await prisma.fleetOrganisation.findMany({
    where: scope.fleetIds === "all" ? {} : { id: { in: scope.fleetIds } },
    include: {
      costCentres: true,
      driverRefs: { where: { approved: true } },
      vehicles: true,
    },
  });

  const result = [];
  for (const fleet of fleets) {
    const driverIds = fleet.driverRefs.map((row) => row.driverId).filter((id): id is string => Boolean(id));
    const [sessionAgg, bookings, documents] = await Promise.all([
      driverIds.length
        ? prisma.chargingSession.groupBy({
            by: ["status"],
            where: { driverId: { in: driverIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      driverIds.length
        ? prisma.booking.count({ where: { driverId: { in: driverIds } } })
        : Promise.resolve(0),
      driverIds.length
        ? prisma.financialDocument.findMany({
            where: { driverId: { in: driverIds } },
            select: { number: true, kind: true, status: true, totalPaise: true },
            take: 20,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);
    result.push({
      id: fleet.id,
      name: fleet.name,
      costCentres: fleet.costCentres.map((row) => ({ code: row.code, name: row.name })),
      vehicles: fleet.vehicles.map((row) => ({ label: row.label, connectorType: row.connectorType })),
      drivers: fleet.driverRefs.map((row) => ({
        label: row.label,
        driverRef: row.driverId ? maskDriverRef(row.driverId) : null,
      })),
      chargingByStatus: sessionAgg.map((row) => ({ status: row.status, count: row._count._all })),
      bookingCount: bookings,
      invoiceReferences: documents.map((row) => ({
        number: row.number,
        kind: row.kind,
        status: row.status,
      })),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    privacy: "Fleet users see only their organisation. Driver phone numbers and payment instruments are omitted.",
    deferred: "Driver invitations, payroll, and full cost allocation are not in this phase.",
    fleets: result,
  };
}
