import { directionsUrl, voltran } from "@/content/voltran";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import type { FinderQuery } from "@/lib/finder/query";

export type PublishedHubListResult = {
  page: number;
  pageSize: number;
  total: number;
  publishedTotal: number;
  sortApplied: string;
  nearestRequiresLocation: boolean;
  stations: PublicStationListItem[];
};

function hubSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function publishedHubsAsStations(): PublicStationListItem[] {
  return voltran.hubs.map((hub) => {
    const slug = hubSlug(hub.name);
    const is24 = hub.amenities.includes("OPEN24-7");
    return {
      stationId: `hub-${slug}`,
      slug,
      name: hub.name,
      city: hub.area,
      state: "Andhra Pradesh",
      locality: hub.area,
      pincode: "",
      landmark: null,
      latitude: hub.latitude,
      longitude: hub.longitude,
      href: directionsUrl(hub.mapsQuery),
      accessType: "public",
      hoursSummary: is24 ? "Open 24x7" : "Hours unpublished",
      hoursReliable: is24,
      openNow: is24 ? true : null,
      amenities: [...hub.amenities],
      accessibleBayCount: null,
      accessibilityNotes: null,
      connectors: [],
      installedConnectorCount: 0,
      availableConnectorCount: 0,
      publicStatus: "unknown",
      statusUpdatedAt: null,
      maxKw: null,
      startingPriceLabel: null,
      energyPaisePerKwh: null,
      pricePublished: false,
      lastVerifiedAt: null,
      distanceKm: null,
      embedUrl: hub.embedUrl,
    };
  });
}

export function listPublishedHubs(query?: Pick<FinderQuery, "q" | "openNow" | "page" | "pageSize">): PublishedHubListResult {
  const all = publishedHubsAsStations();
  const needle = query?.q?.trim().toLowerCase() ?? "";
  let stations = needle
    ? all.filter((station) =>
        [station.name, station.city, station.state, station.locality, station.hoursSummary]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : all;

  if (query?.openNow) {
    stations = stations.filter((station) => station.openNow === true);
  }

  const page = query?.page && query.page > 0 ? query.page : 1;
  const pageSize = query?.pageSize && query.pageSize > 0 ? query.pageSize : Math.max(stations.length, 1);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total: stations.length,
    publishedTotal: all.length,
    sortApplied: "name",
    nearestRequiresLocation: false,
    stations: stations.slice(start, start + pageSize),
  };
}
