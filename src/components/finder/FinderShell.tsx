"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorRetryPanel } from "@/components/ui/ErrorRetryPanel";
import { StationCardSkeleton } from "@/components/ui/Skeleton";
import type { PublicStationListItem } from "@/lib/catalogue/published-hubs";
import {
  defaultFinderQuery,
  finderActiveFilterCount,
  finderQueryString,
  FINDER_QUERY_MAX_LENGTH,
  type FinderQuery,
} from "@/lib/finder/query";
import type { PublicMapConfig } from "@/lib/maps/config";
import { accessTypeLabel } from "@/lib/catalogue/labels";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { ChargerPowerStrip } from "@/components/marketing/voltran/ChargerPowerStrip";
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
  mapConfig: PublicMapConfig;
};

type Origin = { lat: number; lng: number };

const EMPTY_STATIONS: PublicStationListItem[] = [];

export function FinderShell({
  initialQuery,
  initialResult,
  initialError,
  mapConfig,
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
  const mapUsable = mapConfig.enabled || stations.some((item) => item.embedUrl);

  const resultsLabel =
    publishedTotal === 0
      ? "No published hubs yet"
      : `${matchedTotal} published hub${matchedTotal === 1 ? "" : "s"}`;

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
      <ul className="find-hubs" aria-label="Published hubs">
        {stations.map((station) => (
          <li key={station.stationId}>
            <HubCard
              station={station}
              selected={station.stationId === selectedId}
              onSelect={mapUsable ? () => setSelectedId(station.stationId) : undefined}
            />
          </li>
        ))}
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
    <div className="find-desk">
      <form
        className="find-dock"
        onSubmit={(event) => {
          event.preventDefault();
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          applyQuery({ q: qInput.trim(), page: 1 });
        }}
      >
        <label className="find-dock__label" htmlFor="finder-q">
          Search hubs
        </label>
        <input
          id="finder-q"
          name="q"
          className="find-dock__input"
          value={qInput}
          maxLength={FINDER_QUERY_MAX_LENGTH}
          placeholder="City, hub name, or pincode"
          autoComplete="off"
          onChange={(event) => onSearchInput(event.target.value)}
        />
        <button type="submit" className="find-dock__go" disabled={searching}>
          {searching ? "Searching" : "Search"}
        </button>
        <button type="button" className="find-dock__near" onClick={requestLocation}>
          Near me
        </button>
      </form>

      {locationMessage ? (
        <div className="find-alert">
          <Alert variant={locationDenied ? "warning" : "info"} title={locationDenied ? "Location not used" : "Location for this visit"}>
            {locationMessage}
          </Alert>
        </div>
      ) : null}

      <div className="find-meta">
        <p id={resultsId} aria-live="polite">
          {resultsLabel}
          {searching ? " · Updating" : ""}
          {filterCount > 0 ? ` · ${filterCount} filter${filterCount === 1 ? "" : "s"} on` : ""}
        </p>
      </div>

      {result?.nearestRequiresLocation ? (
        <div className="find-alert">
          <Alert variant="info" title="Nearest needs your location">
            Sorted by name until you use your location or search a place.
          </Alert>
        </div>
      ) : null}

      <div className="find-board">
        <div className="find-board__map" aria-hidden={matchedTotal === 0}>
          {mapPane}
        </div>
        <div className="find-board__list" aria-describedby={resultsId}>
          {renderListBody()}
          {matchedTotal > (result?.pageSize ?? 0) ? (
            <div className="find-pager">
              <button
                type="button"
                className="find-pager__btn"
                disabled={!result || result.page <= 1 || searching}
                onClick={() => applyQuery({ page: Math.max(1, query.page - 1) })}
              >
                Previous
              </button>
              <p>Page {result?.page ?? 1}</p>
              <button
                type="button"
                className="find-pager__btn"
                disabled={!result || result.page * result.pageSize >= matchedTotal || searching}
                onClick={() => applyQuery({ page: query.page + 1 })}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HubCard({
  station,
  selected,
  onSelect,
}: {
  station: PublicStationListItem;
  selected: boolean;
  onSelect?: () => void;
}) {
  const place = [station.locality, station.city].filter(Boolean).join(", ") || station.city;
  const hours = station.hoursSummary;
  const access = accessTypeLabel(station.accessType);

  return (
    <article className={selected ? "find-hub is-on" : "find-hub"} id={`station-card-${station.stationId}`}>
      <div className="find-hub__top">
        {station.openNow ? <span className="find-hub__live">Open 24×7</span> : <span className="find-hub__tag">{hours}</span>}
        {selected ? <span className="find-hub__pin">On the map</span> : null}
      </div>
      <h2>{station.name}</h2>
      <p className="find-hub__place">{place}</p>
      <p className="find-hub__meta">
        {access}
        {station.distanceKm != null ? ` · ${station.distanceKm.toFixed(1)} km` : ""}
      </p>
      <ChargerPowerStrip className="vt-kw--compact" />
      <div className="find-hub__actions">
        {onSelect ? (
          <button type="button" className="find-hub__map" onClick={onSelect} aria-pressed={selected}>
            {selected ? "Showing on map" : "Show on map"}
          </button>
        ) : null}
        <a className="find-hub__go" href={station.href} rel="noreferrer noopener" target="_blank">
          Get directions
        </a>
      </div>
    </article>
  );
}
