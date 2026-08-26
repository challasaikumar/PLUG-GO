"use client";

import { accessTypeLabel, connectorTypeLabel } from "@/lib/catalogue/labels";
import { ACCESS_TYPES } from "@/lib/catalogue/validation";
import type { FinderQuery } from "@/lib/finder/query";
import { FINDER_SORTS } from "@/lib/finder/query";
import { PUBLIC_STATUSES, statusLabel } from "@/lib/status";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";

export type FinderFacets = {
  connectorTypes: string[];
  amenities: string[];
  hasAccessibility: boolean;
};

type FinderFiltersProps = {
  query: FinderQuery;
  facets: FinderFacets;
  locationReady: boolean;
  onChange: (patch: Partial<FinderQuery>) => void;
  onClear: () => void;
};

const MIN_KW = [7, 22, 50, 60, 120, 180];

export function FinderFilters({
  query,
  facets,
  locationReady,
  onChange,
  onClear,
}: FinderFiltersProps) {
  const connectorOptions = facets.connectorTypes;
  const accessOptions = ACCESS_TYPES.filter((type) => type !== "unknown");

  return (
    <div className="finder-filters">
      <div className="finder-filter-grid">
        <div className="finder-filter-field">
          <label className="field-label" htmlFor="finder-connector">
            Connector type
          </label>
          <div className="field-control">
            <select
              id="finder-connector"
              value={query.connectorType ?? ""}
              onChange={(event) =>
                onChange({
                  connectorType: (event.target.value || undefined) as FinderQuery["connectorType"],
                  page: 1,
                })
              }
            >
              <option value="">Any connector</option>
              {connectorOptions.map((type) => (
                <option key={type} value={type}>
                  {connectorTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="finder-filter-field">
          <label className="field-label" htmlFor="finder-minkw">
            Minimum kW
          </label>
          <div className="field-control">
            <select
              id="finder-minkw"
              value={query.minKw ?? ""}
              onChange={(event) =>
                onChange({
                  minKw: event.target.value ? Number.parseInt(event.target.value, 10) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">Any power</option>
              {MIN_KW.map((kw) => (
                <option key={kw} value={kw}>
                  {kw} kW or more
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="finder-filter-field">
          <label className="field-label" htmlFor="finder-availability">
            Availability
          </label>
          <div className="field-control">
            <select
              id="finder-availability"
              value={query.availability ?? ""}
              onChange={(event) =>
                onChange({
                  availability: (event.target.value || undefined) as FinderQuery["availability"],
                  page: 1,
                })
              }
            >
              <option value="">Any recorded state</option>
              {PUBLIC_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="finder-filter-field">
          <label className="field-label" htmlFor="finder-access">
            Access
          </label>
          <div className="field-control">
            <select
              id="finder-access"
              value={query.access ?? ""}
              onChange={(event) =>
                onChange({
                  access: (event.target.value || undefined) as FinderQuery["access"],
                  page: 1,
                })
              }
            >
              <option value="">Any access</option>
              {accessOptions.map((type) => (
                <option key={type} value={type}>
                  {accessTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="finder-filter-field">
          <label className="field-label" htmlFor="finder-sort">
            Sort
          </label>
          <div className="field-control">
            <select
              id="finder-sort"
              value={query.sort}
              onChange={(event) =>
                onChange({ sort: event.target.value as FinderQuery["sort"], page: 1 })
              }
            >
              {FINDER_SORTS.map((sort) => (
                <option key={sort} value={sort} disabled={sort === "nearest" && !locationReady}>
                  {sort === "name"
                    ? "Name"
                    : sort === "nearest"
                      ? locationReady
                        ? "Nearest"
                        : "Nearest (needs location)"
                      : sort === "availability"
                        ? "Availability"
                        : sort === "power"
                          ? "Charging power"
                          : "Price (when published)"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <FilterChip
          label="Open now"
          pressed={query.openNow}
          onPressedChange={(pressed) => onChange({ openNow: pressed, page: 1 })}
        />
        {facets.hasAccessibility ? (
          <FilterChip
            label="Accessible bay"
            pressed={query.accessible}
            onPressedChange={(pressed) => onChange({ accessible: pressed, page: 1 })}
          />
        ) : null}
        {facets.amenities.map((amenity) => (
          <FilterChip
            key={amenity}
            label={amenity}
            pressed={query.amenity === amenity}
            showClear={query.amenity === amenity}
            onPressedChange={(pressed) =>
              onChange({ amenity: pressed ? amenity : undefined, page: 1 })
            }
          />
        ))}
      </div>

      <p className="type-caption" style={{ margin: "12px 0 0", color: "var(--color-text-tertiary)" }}>
        Open now only includes stations with confirmed 24/7 or structured hours. Price sort skips
        stations without an approved tariff.
      </p>
      <div style={{ marginTop: 12 }}>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear all filters
        </Button>
      </div>
    </div>
  );
}
