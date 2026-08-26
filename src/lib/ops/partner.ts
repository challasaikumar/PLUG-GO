import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import { computePublicStatus } from "@/lib/status";
import { OpsError } from "./roles";
import { resolveOpsScope } from "./scope";

export async function getHostPortal(actor: StaffActor) {
  if (!roleAllows(actor, ROLE_MATRIX.readHostPortal)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot open the host portal.");
  }
  const scope = await resolveOpsScope(actor);
  if (scope.hostIds !== "all" && scope.hostIds.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      hosts: [],
      note: "No host membership is assigned to this actor.",
    };
  }
  const prisma = getPrisma();
  const hosts = await prisma.host.findMany({
    where: scope.hostIds === "all" ? {} : { id: { in: scope.hostIds } },
    include: {
      stations: {
        include: {
          connectors: { include: { currentStatus: true } },
          incidents: { where: { status: { not: "closed" } }, select: { id: true, status: true, severity: true } },
          bookings: { where: { status: "confirmed" }, select: { id: true } },
        },
      },
    },
  });
  return {
    generatedAt: new Date().toISOString(),
    privacy:
      "Host users see assigned locations only. Individual driver personal data and payment details are not included.",
    revenueNote:
      "Revenue reporting stays a placeholder until a host settlement agreement and real payout data exist.",
    hosts: hosts.map((host) => ({
      id: host.id,
      hostDisplayName: host.hostDisplayName,
      contractStatus: host.contractStatus,
      primaryContactName: host.primaryContactName,
      stations: host.stations.map((station) => {
        const statuses = station.connectors.map((connector) =>
          computePublicStatus({
            recordedStatus: connector.currentStatus?.recordedStatus ?? null,
            statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
            overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
          }).publicStatus,
        );
        return {
          id: station.id,
          name: station.name,
          city: station.city,
          slug: station.slug,
          connectorCount: station.connectors.length,
          availableCount: statuses.filter((status) => status === "available").length,
          openIncidents: station.incidents.length,
          confirmedBookingCount: station.bookings.length,
        };
      }),
    })),
  };
}
