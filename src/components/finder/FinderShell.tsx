"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorRetryPanel } from "@/components/ui/ErrorRetryPanel";
import { Modal } from "@/components/ui/Modal";
import { SearchField } from "@/components/ui/SearchField";
import { StationCardSkeleton } from "@/components/ui/Skeleton";
import { StationCard } from "@/components/ui/StationCard";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import {
  defaultFinderQuery,
  finderActiveFilterCount,
  finderQueryString,
  FINDER_QUERY_MAX_LENGTH,
  type FinderQuery,
} from "@/lib/finder/query";
import type { PublicMapConfig } from "@/lib/maps/config";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { FinderFilters, type FinderFacets } from "./FinderFilters";
import { listItemToCard } from "./listItemToCard";
import { StationMap } from "./StationMap";

export type FinderListResult = {
  page: number;
  pageSize: number;
  total: number;
  publishedTotal: number;
  sortApplied: string;
  nearestRequiresLocation: boolean;
  stations: PublicStationListItem[];
};

type FinderShellProps = {
  initialQuery: FinderQuery;
  initialResult: FinderListResult | null;
  initialError: string | null;
  facets: FinderFacets;
  mapConfig: PublicMapConfig;
  preferredConnectorType?: string | null;
};

type Origin = { lat: number; lng: number };

const EMPTY_STATIONS: PublicStationListItem[] = [];

export function FinderShell({
  initialQuery,
  initialResult,
  initialError,
  facets,
  mapConfig,
  preferredConnectorType = null,
}: FinderShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resultsId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [qInput, setQInput] = useState(initialQuery.q);
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialResult?.stations[0]?.stationId ?? null,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const queryRef = useRef(query);
  const originRef = useRef<Origin | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    originRef.current = origin;
  }, [origin]);
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const filterCount = finderActiveFilterCount(query);

  const syncUrl = useCallback(
    (next: FinderQuery) => {
      router.replace(`${pathname}${finderQueryString(next)}`, { scroll: false });
    },
    [pathname, router],
  );

  const fetchList = useCallback(
    async (next: FinderQuery, nextOrigin: Origin | null, mode: "search" | "initial") => {
      if (mode === "search") setSearching(true);
      else setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(finderQueryString(next).replace(/^\?/, ""));
        if (nextOrigin) {
          params.set("lat", String(nextOrigin.lat));
          params.set("lng", String(nextOrigin.lng));
        }
        const response = await fetch(`/api/public/stations?${params.toString()}`, {
          cache: "no-store",
        });
        const body = (await response.json()) as FinderListResult & {
          ok?: boolean;
          error?: string;
          errors?: Record<string, string>;
        };
        if (!response.ok || body.ok === false) {
          const detail = body.errors ? Object.values(body.errors).filter(Boolean).join(" ") : body.error;
          throw new Error(detail || "The station list could not be loaded.");
        }
        setResult(body);
        setSelectedId((current) => {
          if (current && body.stations.some((station) => station.stationId === current)) {
            return current;
          }
          return body.stations[0]?.stationId ?? null;
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The station list could not be loaded.");
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [],
  );

  const applyQuery = useCallback(
    (patch: Partial<FinderQuery>, options?: { fetch?: boolean }) => {
      const next = { ...query, ...patch };
      setQuery(next);
      syncUrl(next);
      if (options?.fetch === false) return;
      void fetchList(next, origin, "search");
      if (patch.q !== undefined || patch.connectorType !== undefined) {
        track(ANALYTICS_EVENTS.location_search, { q: next.q });
      }
      if (finderActiveFilterCount(next) > 0) {
        track(ANALYTICS_EVENTS.filter_applied, { count: finderActiveFilterCount(next) });
      }
    },
    [fetchList, origin, query, syncUrl],
  );

  function onSearchInput(value: string) {
    const nextValue = value.slice(0, FINDER_QUERY_MAX_LENGTH);
    setQInput(nextValue);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const next = { ...queryRef.current, q: nextValue, page: 1 };
      setQuery(next);
      syncUrl(next);
      void fetchList(next, originRef.current, "search");
    }, 300);
  }

  function clearFilters() {
    const next = { ...defaultFinderQuery(), q: qInput };
    setQuery(next);
    syncUrl(next);
    void fetchList(next, origin, "search");
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLocationMessage("This browser cannot share a location. Search by city, pincode, or landmark instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextOrigin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setOrigin(nextOrigin);
        setLocationDenied(false);
        setLocationMessage("Distance is shown for this visit only. Precise location is not stored.");
        const next = { ...query, sort: "nearest" as const, page: 1 };
        setQuery(next);
        syncUrl(next);
        void fetchList(next, nextOrigin, "search");
      },
      () => {
        setLocationDenied(true);
        setLocationMessage(
          "Location permission was denied. Search by city, pincode, or landmark — discovery is not blocked.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 0 },
    );
  }

  const stations = result?.stations ?? EMPTY_STATIONS;
  const publishedTotal = result?.publishedTotal ?? 0;
  const matchedTotal = result?.total ?? 0;

  const list = useMemo(
    () =>
      stations.map((station) =>
        listItemToCard(station, {
          compact: true,
          selected: station.stationId === selectedId,
        }),
      ),
    [selectedId, stations],
  );

  const resultsLabel =
    publishedTotal === 0
      ? "No published stations"
      : `${matchedTotal} published station${matchedTotal === 1 ? "" : "s"}`;

  function renderListBody() {
    if (loading && !result) {
      return (
        <div style={{ display: "grid", gap: 12 }}>
          <StationCardSkeleton />
          <StationCardSkeleton />
        </div>
      );
    }
    if (error) {
      return (
        <ErrorRetryPanel
          title="We could not load stations"
          body={error}
          onRetry={() => void fetchList(query, origin, "initial")}
        />
      );
    }
    if (publishedTotal === 0) {
      return (
        <EmptyState
          title="No published stations yet"
          body="Plug and Go has not published a public charger catalogue. This is not a live map of India, and nearby sites are not invented."
          action={{ href: "/contact", label: "Contact us" }}
          secondaryAction={{ href: "/host-a-charger", label: "Host a charger", variant: "outline" }}
        />
      );
    }
    if (matchedTotal === 0) {
      return (
        <EmptyState
          title={query.q.trim() ? "No published stations match this search" : "No stations match these filters"}
          body="Nothing was invented to fill this list. Clear filters or try a city, pincode, or landmark."
          action={{ label: "Clear all filters", onClick: clearFilters }}
          secondaryAction={{ href: "/support", label: "Get support", variant: "outline" }}
        />
      );
    }
    return (
      <ul className="finder-station-list" aria-label="Published stations">
        {list.map((card, index) => {
          const station = stations[index];
          return (
            <li key={card.id}>
              <StationCard
                station={card}
                selected={station.stationId === selectedId}
                compact
                onSelect={mapConfig.enabled ? () => setSelectedId(station.stationId) : undefined}
                selectLabel="Show on map"
              />
            </li>
          );
        })}
      </ul>
    );
  }

  const mapPane = (
    <StationMap
      config={mapConfig}
      stations={stations}
      selectedId={selectedId}
      onSelect={(stationId) => {
        setSelectedId(stationId);
        document.getElementById(`station-card-${stationId}`)?.scrollIntoView({ block: "nearest" });
      }}
    />
  );

  return (
    <div className="finder-shell">
      <form
        className="finder-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          applyQuery({ q: qInput.trim(), page: 1 });
        }}
      >
        <SearchField
          id="finder-q"
          name="q"
          label="Search published stations"
          placeholder="Station name, city, state, landmark, address, or pincode"
          value={qInput}
          maxLength={FINDER_QUERY_MAX_LENGTH}
          onChange={onSearchInput}
          onSubmit={(value) => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
            applyQuery({ q: value.trim(), page: 1 });
          }}
          loading={searching}
          help="Results update as you pause typing. Precise location is used only after you ask, and is not stored."
        />
        <div className="finder-search-actions">
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" onClick={requestLocation}>
            Use my location
          </Button>
        </div>
      </form>

      {locationMessage ? (
        <div style={{ marginTop: 12 }}>
          <Alert variant={locationDenied ? "warning" : "info"} title={locationDenied ? "Location not used" : "Location for this visit"}>
            {locationMessage}
          </Alert>
        </div>
      ) : null}

      {preferredConnectorType && !query.connectorType ? (
        <div style={{ marginTop: 12 }}>
          <Alert variant="info" title="Vehicle connector preference">
            Your saved vehicle uses {connectorTypeLabel(preferredConnectorType)}. Apply this as a visible filter if you
            want. Other published stations stay listed until you do.
            <span style={{ display: "inline-block", marginLeft: 8 }}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  applyQuery({
                    connectorType: preferredConnectorType as FinderQuery["connectorType"],
                    page: 1,
                  })
                }
              >
                Apply filter
              </Button>
            </span>
          </Alert>
        </div>
      ) : null}

      <div className="finder-toolbar">
        <p id={resultsId} className="type-small" aria-live="polite" style={{ margin: 0 }}>
          {resultsLabel}
          {searching ? " · Updating results" : ""}
          {filterCount > 0 ? ` · ${filterCount} filter${filterCount === 1 ? "" : "s"} on` : ""}
        </p>
        <div className="finder-toolbar-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="finder-mobile-only"
            onClick={() => setFiltersOpen(true)}
          >
            Filters{filterCount ? ` (${filterCount})` : ""}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="finder-mobile-only"
            onClick={() => setMapOpen(true)}
          >
            Map
          </Button>
        </div>
      </div>

      <div className="finder-desktop-only finder-desktop-filters">
        <FinderFilters
          query={query}
          facets={facets}
          locationReady={Boolean(origin)}
          onChange={(patch) => applyQuery(patch)}
          onClear={clearFilters}
        />
      </div>

      {result?.nearestRequiresLocation ? (
        <div style={{ margin: "12px 0" }}>
          <Alert variant="info" title="Nearest needs your location">
            Sorted by name until you use your location or search a place. Location is not written into the
            shareable URL.
          </Alert>
        </div>
      ) : null}

      <div className="finder-split">
        <div className="finder-list-pane" aria-describedby={resultsId}>
          {renderListBody()}
          {matchedTotal > (result?.pageSize ?? 0) ? (
            <div className="finder-pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={!result || result.page <= 1 || searching}
                onClick={() => applyQuery({ page: Math.max(1, query.page - 1) })}
              >
                Previous
              </Button>
              <p className="type-small" style={{ margin: 0 }}>
                Page {result?.page ?? 1}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  !result || result.page * result.pageSize >= matchedTotal || searching
                }
                onClick={() => applyQuery({ page: query.page + 1 })}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
        <div className="finder-map-pane finder-desktop-only">{mapPane}</div>
      </div>

      <Modal open={filtersOpen} title="Filters and sort" onClose={() => setFiltersOpen(false)} variant="sheet">
        <FinderFilters
          query={query}
          facets={facets}
          locationReady={Boolean(origin)}
          onChange={(patch) => applyQuery(patch)}
          onClear={() => {
            clearFilters();
            setFiltersOpen(false);
          }}
        />
        <div style={{ marginTop: 16 }}>
          <Button block onClick={() => setFiltersOpen(false)}>
            Show {matchedTotal} station{matchedTotal === 1 ? "" : "s"}
          </Button>
        </div>
      </Modal>

      <Modal open={mapOpen} title="Map" onClose={() => setMapOpen(false)} variant="sheet">
        <div className="finder-map-sheet">{mapPane}</div>
      </Modal>
    </div>
  );
}
