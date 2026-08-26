import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { publicStationWhere } from "@/lib/catalogue/station-service";
import { getPrisma } from "@/lib/db/prisma";
import { stationCanonicalPath } from "@/lib/geo";
import { computePublicStatus, freshnessCopy, statusGuidance } from "@/lib/status";

const PUBLIC_REF_PATTERN = /^[a-zA-Z0-9_-]{8,40}$/;

export function isPublicRef(value: string): boolean {
  return PUBLIC_REF_PATTERN.test(value);
}

export type QrHandoffContext = {
  stationName: string;
  stationSlug: string;
  href: string;
  city: string;
  state: string;
  locality: string | null;
  connectorType: string;
  connectorTypeLabel: string;
  maxKw: number;
  publicStatus: ReturnType<typeof computePublicStatus>["publicStatus"];
  statusUpdatedAt: string | null;
  freshnessLabel: string;
  guidance: string | null;
};

export async function resolvePublishedQrContext(
  stationPublicId: string,
  connectorPublicId: string,
): Promise<QrHandoffContext | null> {
  if (!isPublicRef(stationPublicId) || !isPublicRef(connectorPublicId)) {
    return null;
  }

  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { publicRef: stationPublicId, ...publicStationWhere },
    include: {
      connectors: {
        where: { publicRef: connectorPublicId, installationStatus: "installed" },
        include: { currentStatus: true },
      },
    },
  });
  if (!station || station.connectors.length !== 1) return null;

  const connector = station.connectors[0];
  const computed = computePublicStatus({
    recordedStatus: connector.currentStatus?.recordedStatus ?? null,
    statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
    overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
  });

  return {
    stationName: station.name,
    stationSlug: station.slug,
    href: stationCanonicalPath(station),
    city: station.city,
    state: station.state,
    locality: station.locality,
    connectorType: connector.connectorType,
    connectorTypeLabel: connectorTypeLabel(connector.connectorType),
    maxKw: connector.maxPowerWatts / 1000,
    publicStatus: computed.publicStatus,
    statusUpdatedAt: computed.statusUpdatedAt,
    freshnessLabel: freshnessCopy({
      status: computed.publicStatus,
      statusUpdatedAt: computed.statusUpdatedAt,
    }),
    guidance: statusGuidance(computed.publicStatus),
  };
}
