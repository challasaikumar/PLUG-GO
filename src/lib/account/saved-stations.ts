import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { publicStationWhere } from "@/lib/catalogue/station-service";
import { getPrisma } from "@/lib/db/prisma";
import { aggregateStationStatus } from "@/lib/finder/station-status";
import { stationCanonicalPath } from "@/lib/geo";
import { computePublicStatus, freshnessCopy } from "@/lib/status";
import { writeDriverAudit } from "./audit";

const publicSavedInclude = {
  evses: {
    where: { installationStatus: "installed" as const },
    include: {
      connectors: {
        where: { installationStatus: "installed" as const },
        include: { currentStatus: true },
      },
    },
  },
  media: {
    where: { publicationStatus: "published" as const, rightsConfirmed: true },
  },
  tariffs: {
    where: { approvalStatus: "approved" as const },
    include: { lineItems: true },
  },
};

export type SavedStationView = {
  savedId: string;
  slug: string | null;
  name: string;
  href: string | null;
  locationLabel: string;
  connectorSummary: string;
  status: string;
  freshnessLabel: string | null;
  published: boolean;
  unpublishedReason: string | null;
  savedAt: string;
};

export async function listSavedStations(driverId: string): Promise<SavedStationView[]> {
  const prisma = getPrisma();
  const rows = await prisma.savedStation.findMany({
    where: { driverId },
    include: {
      station: { include: publicSavedInclude },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => {
    const station = row.station;
    const published = station.publicationStatus === "published" && !station.isDemo;
    if (!published) {
      return {
        savedId: row.id,
        slug: null,
        name: station.name,
        href: null,
        locationLabel: [station.city, station.state].filter(Boolean).join(", "),
        connectorSummary: "Connector details are hidden because this station is no longer published.",
        status: "unpublished",
        freshnessLabel: null,
        published: false,
        unpublishedReason:
          station.publicationStatus === "archived"
            ? "This station has been archived and is no longer listed publicly."
            : "This station is no longer published.",
        savedAt: row.createdAt.toISOString(),
      };
    }

    const connectors = station.evses.flatMap((evse) =>
      evse.connectors.map((connector) => {
        const computed = computePublicStatus({
          recordedStatus: connector.currentStatus?.recordedStatus ?? null,
          statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
          overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
        });
        return {
          connectorType: connector.connectorType,
          publicStatus: computed.publicStatus,
          statusUpdatedAt: computed.statusUpdatedAt,
        };
      }),
    );
    const aggregate = aggregateStationStatus(connectors);
    const types = Array.from(
      new Set(connectors.map((connector) => connectorTypeLabel(connector.connectorType))),
    );
    return {
      savedId: row.id,
      slug: station.slug,
      name: station.name,
      href: stationCanonicalPath(station),
      locationLabel: [station.locality, station.city, station.state].filter(Boolean).join(", "),
      connectorSummary: types.length ? types.join(", ") : "Connector types unpublished",
      status: aggregate.publicStatus,
      freshnessLabel: freshnessCopy({
        status: aggregate.publicStatus,
        statusUpdatedAt: aggregate.statusUpdatedAt,
      }),
      published: true,
      unpublishedReason: null,
      savedAt: row.createdAt.toISOString(),
    };
  });
}

export async function isStationSaved(driverId: string, slug: string): Promise<boolean> {
  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { slug, ...publicStationWhere },
    select: { id: true },
  });
  if (!station) return false;
  const saved = await prisma.savedStation.findUnique({
    where: { driverId_stationId: { driverId, stationId: station.id } },
    select: { id: true },
  });
  return Boolean(saved);
}

export async function savePublishedStation(driverId: string, slug: string, requestId?: string) {
  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { slug, ...publicStationWhere },
    select: { id: true, slug: true, name: true },
  });
  if (!station) return { ok: false as const, notFound: true as const };

  const saved = await prisma.savedStation.upsert({
    where: { driverId_stationId: { driverId, stationId: station.id } },
    create: { driverId, stationId: station.id },
    update: {},
  });
  await writeDriverAudit({
    driverId,
    action: "station.saved",
    targetType: "station",
    targetId: station.id,
    summary: { slug: station.slug },
    requestId,
  });
  return { ok: true as const, savedId: saved.id, slug: station.slug };
}

export async function removeSavedStation(
  driverId: string,
  savedIdOrSlug: string,
  requestId?: string,
) {
  const prisma = getPrisma();
  const existing = await prisma.savedStation.findFirst({
    where: {
      driverId,
      OR: [{ id: savedIdOrSlug }, { station: { slug: savedIdOrSlug } }],
    },
  });
  if (!existing) return { ok: false as const, notFound: true as const };
  await prisma.savedStation.delete({ where: { id: existing.id } });
  await writeDriverAudit({
    driverId,
    action: "station.unsaved",
    targetType: "saved_station",
    targetId: existing.id,
    requestId,
  });
  return { ok: true as const };
}
