import { accessTypeLabel, connectorTypeLabel } from "@/lib/catalogue/labels";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import { formatDistanceKm } from "@/lib/geo";
import { freshnessCopy, statusGuidance } from "@/lib/status";
import type { StationCardModel } from "@/components/ui/StationCard";

export function listItemToCard(
  station: PublicStationListItem,
  options: { compact?: boolean; selected?: boolean; showMapSelect?: boolean } = {},
): StationCardModel {
  const locality = [station.locality, station.city].filter(Boolean).join(", ") || station.city;
  const connectorCounts = new Map<string, { type: string; maxKw: number; installedCount: number }>();
  for (const connector of station.connectors) {
    const key = `${connector.connectorType}-${connector.maxKw}`;
    const current = connectorCounts.get(key);
    if (current) current.installedCount += 1;
    else {
      connectorCounts.set(key, {
        type: connectorTypeLabel(connector.connectorType),
        maxKw: connector.maxKw,
        installedCount: 1,
      });
    }
  }

  return {
    id: station.stationId,
    name: station.name,
    locality,
    status: station.publicStatus,
    lastUpdatedLabel: freshnessCopy({
      status: station.publicStatus,
      statusUpdatedAt: station.statusUpdatedAt,
    }),
    connectors: Array.from(connectorCounts.values()),
    priceLabel: station.startingPriceLabel,
    accessSummary: `${accessTypeLabel(station.accessType)} · ${station.hoursSummary}`,
    href: station.href,
    distanceLabel: station.distanceKm != null ? formatDistanceKm(station.distanceKm) : null,
    selected: options.selected,
    compact: options.compact ?? true,
    showPhoto: false,
    primaryLabel: "View station",
    guidance: statusGuidance(station.publicStatus),
  };
}
