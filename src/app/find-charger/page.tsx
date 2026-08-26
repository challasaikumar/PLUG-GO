import type { Metadata } from "next";
import { FinderShell } from "@/components/finder/FinderShell";
import { Alert } from "@/components/ui/Alert";
import { copy } from "@/content/copy";
import {
  listPublicStations,
  listPublishedFilterFacets,
} from "@/lib/catalogue/station-service";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import {
  defaultFinderQuery,
  finderShouldIndex,
  parseFinderQuery,
} from "@/lib/finder/query";
import { getPublicMapConfig } from "@/lib/maps/config";
import { pageMeta } from "@/lib/metadata";
import { getPreferredConnectorType } from "@/lib/account/vehicles";
import { getOptionalDriver } from "@/lib/auth/driver";
import { isFeatureEnabled } from "@/lib/release/overrides";
import { FeatureUnavailable } from "@/components/release/FeatureUnavailable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramsFromRecord(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
    } else if (value) {
      params.set(key, value);
    }
  }
  return params;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  if (!(await isFeatureEnabled("publicStationFinder"))) {
    return pageMeta({
      title: copy.findCharger.title,
      description: copy.findCharger.description,
      path: "/find-charger",
      index: false,
    });
  }
  const raw = await searchParams;
  const parsed = parseFinderQuery(paramsFromRecord(raw));
  const query = parsed.ok ? parsed.query : defaultFinderQuery();
  const index = parsed.ok && finderShouldIndex(query);
  return pageMeta({
    title: copy.findCharger.title,
    description: copy.findCharger.description,
    path: "/find-charger",
    index,
  });
}

export default async function FindChargerPage({ searchParams }: PageProps) {
  if (!(await isFeatureEnabled("publicStationFinder"))) {
    return (
      <FeatureUnavailable title="Find a charger">
        Public station search is not open on this environment. Searching stays off until FLAG_PUBLIC_FINDER is enabled
        and published stations exist.
      </FeatureUnavailable>
    );
  }
  const raw = await searchParams;
  const parsed = parseFinderQuery(paramsFromRecord(raw));
  const query = parsed.ok ? parsed.query : defaultFinderQuery();
  const mapConfig = getPublicMapConfig();
  const driver = await getOptionalDriver();
  const preferredConnectorType = driver ? await getPreferredConnectorType(driver.id) : null;

  let initialError: string | null = null;
  let initialResult = null;
  let facets = { connectorTypes: [] as string[], amenities: [] as string[], hasAccessibility: false };

  if (!isDatabaseConfigured()) {
    initialError = "The station catalogue is not configured on this server.";
  } else {
    try {
      const [list, nextFacets] = await Promise.all([
        listPublicStations({
          page: query.page,
          pageSize: query.pageSize,
          q: query.q || undefined,
          city: query.city,
          state: query.state,
          connectorType: query.connectorType,
          minKw: query.minKw,
          availability: query.availability,
          access: query.access,
          openNow: query.openNow,
          amenity: query.amenity,
          accessible: query.accessible,
          sort: query.sort,
        }),
        listPublishedFilterFacets(),
      ]);
      initialResult = list;
      facets = nextFacets;
    } catch {
      initialError = "The station list could not be loaded. Try again, or search later.";
    }
  }

  return (
    <div className="container-png finder-page">
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        {copy.findCharger.h1}
      </h1>
      <p className="type-body-lg" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)", maxWidth: "42rem" }}>
        {copy.findCharger.lead}
      </p>
      {!parsed.ok ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="warning" title="Filters were adjusted">
            {Object.values(parsed.errors).join(" ")} Search still works without those values.
          </Alert>
        </div>
      ) : null}
      <FinderShell
        initialQuery={query}
        initialResult={initialResult}
        initialError={isDatabaseConfigured() ? (initialResult ? null : initialError) : initialError}
        facets={facets}
        mapConfig={mapConfig}
        preferredConnectorType={preferredConnectorType}
      />
    </div>
  );
}
