import { canonicalUrl } from "@/lib/env";
import { stationCanonicalPath } from "@/lib/geo";
import { accessTypeLabel, connectorTypeLabel } from "@/lib/catalogue/labels";

type JsonLdStation = {
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  address: {
    line1: string;
    line2?: string | null;
    locality?: string | null;
    pincode: string;
    country: string;
  };
  access: {
    type: string;
    hoursSummary: string;
    is24_7?: boolean | null;
  };
  connectors: Array<{ connectorType: string; maxKw: number }>;
};

export function stationJsonLd(
  station: JsonLdStation,
  cityPage?: { name: string; path: string } | null,
) {
  const path = stationCanonicalPath(station);
  const url = canonicalUrl(path);
  const connectorNames = Array.from(
    new Set(station.connectors.map((connector) => connectorTypeLabel(connector.connectorType))),
  );
  const descriptionParts = [
    `${station.name} in ${station.city}, ${station.state}.`,
    connectorNames.length ? `Connectors: ${connectorNames.join(", ")}.` : null,
    `Access: ${accessTypeLabel(station.access.type)}.`,
    station.access.hoursSummary ? `Hours: ${station.access.hoursSummary}.` : null,
  ].filter(Boolean);

  const localBusiness = {
    "@type": ["LocalBusiness", "ElectricVehicleChargingStation"],
    "@id": `${url}#station`,
    name: station.name,
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress: [station.address.line1, station.address.line2].filter(Boolean).join(", "),
      addressLocality: station.address.locality || station.city,
      addressRegion: station.state,
      postalCode: station.address.pincode,
      addressCountry: station.address.country || "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: station.latitude,
      longitude: station.longitude,
    },
    description: descriptionParts.join(" "),
  };

  const crumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
    { "@type": "ListItem", position: 2, name: "Find a charger", item: canonicalUrl("/find-charger") },
  ];
  if (cityPage) {
    crumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: cityPage.name,
      item: canonicalUrl(cityPage.path),
    });
    crumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: station.name,
      item: url,
    });
  } else {
    crumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: station.name,
      item: url,
    });
  }

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: crumbItems,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [localBusiness, breadcrumbs],
  };
}
