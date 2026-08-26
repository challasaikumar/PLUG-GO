import { ACCESS_TYPES, CONNECTOR_TYPES } from "@/lib/catalogue/validation";
import { isValidLatitude, isValidLongitude } from "@/lib/geo";
import { PUBLIC_STATUSES, type PublicStatus } from "@/lib/status";

export const FINDER_SORTS = ["name", "nearest", "availability", "power", "price"] as const;
export type FinderSort = (typeof FINDER_SORTS)[number];

export const FINDER_QUERY_MAX_LENGTH = 80;
export const FINDER_PAGE_SIZE_MAX = 50;
export const FINDER_DEFAULT_PAGE_SIZE = 20;
export const FINDER_RADIUS_KM_MAX = 250;

export type FinderQuery = {
  q: string;
  city?: string;
  state?: string;
  connectorType?: (typeof CONNECTOR_TYPES)[number];
  minKw?: number;
  availability?: PublicStatus;
  access?: (typeof ACCESS_TYPES)[number];
  openNow: boolean;
  amenity?: string;
  accessible: boolean;
  sort: FinderSort;
  page: number;
  pageSize: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
};

export type FinderQueryResult =
  | { ok: true; query: FinderQuery }
  | { ok: false; errors: Record<string, string> };

function optionalInt(
  raw: string | null,
  key: string,
  errors: Record<string, string>,
  min: number,
  max: number,
): number | undefined {
  if (raw === null || raw === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    errors[key] = `${key} must be an integer between ${min} and ${max}.`;
    return undefined;
  }
  return parsed;
}

function optionalFloat(
  raw: string | null,
  key: string,
  errors: Record<string, string>,
  validate: (value: number) => boolean,
  message: string,
): number | undefined {
  if (raw === null || raw === "") return undefined;
  const parsed = Number.parseFloat(raw);
  if (!validate(parsed)) {
    errors[key] = message;
    return undefined;
  }
  return parsed;
}

function optionalEnum<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  key: string,
  errors: Record<string, string>,
): T | undefined {
  if (!raw) return undefined;
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  errors[key] = `Unknown ${key}.`;
  return undefined;
}

function flag(raw: string | null): boolean {
  return raw === "1" || raw === "true" || raw === "yes";
}

export function defaultFinderQuery(): FinderQuery {
  return {
    q: "",
    openNow: false,
    accessible: false,
    sort: "name",
    page: 1,
    pageSize: FINDER_DEFAULT_PAGE_SIZE,
  };
}

export function parseFinderQuery(params: URLSearchParams): FinderQueryResult {
  const errors: Record<string, string> = {};
  const qRaw = params.get("q")?.trim() ?? "";
  if (qRaw.length > FINDER_QUERY_MAX_LENGTH) {
    errors.q = `Search text must be at most ${FINDER_QUERY_MAX_LENGTH} characters.`;
  }

  const page = optionalInt(params.get("page"), "page", errors, 1, 1000) ?? 1;
  const pageSize =
    optionalInt(params.get("pageSize"), "pageSize", errors, 1, FINDER_PAGE_SIZE_MAX) ??
    FINDER_DEFAULT_PAGE_SIZE;
  const minKw = optionalInt(params.get("minKw"), "minKw", errors, 1, 1000);
  const radiusKm = optionalInt(params.get("radiusKm"), "radiusKm", errors, 1, FINDER_RADIUS_KM_MAX);
  const connectorType = optionalEnum(params.get("connectorType"), CONNECTOR_TYPES, "connectorType", errors);
  const availability = optionalEnum(params.get("availability"), PUBLIC_STATUSES, "availability", errors);
  const access = optionalEnum(params.get("access"), ACCESS_TYPES, "access", errors);
  const sort = optionalEnum(params.get("sort"), FINDER_SORTS, "sort", errors) ?? "name";

  const amenityRaw = params.get("amenity")?.trim() ?? "";
  if (amenityRaw.length > 40) {
    errors.amenity = "Amenity filter is too long.";
  }
  const city = params.get("city")?.trim() || undefined;
  const state = params.get("state")?.trim() || undefined;
  if (city && city.length > 80) errors.city = "city is too long.";
  if (state && state.length > 80) errors.state = "state is too long.";

  const lat = optionalFloat(
    params.get("lat"),
    "lat",
    errors,
    isValidLatitude,
    "lat must be a valid latitude.",
  );
  const lng = optionalFloat(
    params.get("lng"),
    "lng",
    errors,
    isValidLongitude,
    "lng must be a valid longitude.",
  );
  if ((lat === undefined) !== (lng === undefined)) {
    errors.lat = "lat and lng must be provided together.";
  }

  const north = optionalFloat(params.get("north"), "north", errors, isValidLatitude, "north must be a valid latitude.");
  const south = optionalFloat(params.get("south"), "south", errors, isValidLatitude, "south must be a valid latitude.");
  const east = optionalFloat(params.get("east"), "east", errors, isValidLongitude, "east must be a valid longitude.");
  const west = optionalFloat(params.get("west"), "west", errors, isValidLongitude, "west must be a valid longitude.");
  const boundCount = [north, south, east, west].filter((value) => value !== undefined).length;
  if (boundCount > 0 && boundCount < 4) {
    errors.north = "north, south, east, and west must be provided together.";
  }
  if (north !== undefined && south !== undefined && north < south) {
    errors.north = "north must be greater than or equal to south.";
  }
  if (east !== undefined && west !== undefined && east < west) {
    errors.east = "east must be greater than or equal to west for this query.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    query: {
      q: qRaw.slice(0, FINDER_QUERY_MAX_LENGTH),
      city,
      state,
      connectorType,
      minKw,
      availability,
      access,
      openNow: flag(params.get("openNow")),
      amenity: amenityRaw || undefined,
      accessible: flag(params.get("accessible")),
      sort,
      page,
      pageSize,
      lat,
      lng,
      radiusKm,
      north,
      south,
      east,
      west,
    },
  };
}

export function finderActiveFilterCount(query: FinderQuery): number {
  let count = 0;
  if (query.city) count += 1;
  if (query.state) count += 1;
  if (query.connectorType) count += 1;
  if (query.minKw) count += 1;
  if (query.availability) count += 1;
  if (query.access) count += 1;
  if (query.openNow) count += 1;
  if (query.amenity) count += 1;
  if (query.accessible) count += 1;
  if (query.sort !== "name") count += 1;
  return count;
}

export function finderHasShareableState(query: FinderQuery): boolean {
  return (
    Boolean(query.q.trim()) ||
    finderActiveFilterCount(query) > 0 ||
    query.page > 1 ||
    query.pageSize !== FINDER_DEFAULT_PAGE_SIZE
  );
}

export function finderShouldIndex(query: FinderQuery): boolean {
  return !finderHasShareableState(query);
}

/** Shareable URL params only. Precise browser location is never written here. */
export function serializeFinderQuery(query: FinderQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.city) params.set("city", query.city);
  if (query.state) params.set("state", query.state);
  if (query.connectorType) params.set("connectorType", query.connectorType);
  if (query.minKw) params.set("minKw", String(query.minKw));
  if (query.availability) params.set("availability", query.availability);
  if (query.access) params.set("access", query.access);
  if (query.openNow) params.set("openNow", "1");
  if (query.amenity) params.set("amenity", query.amenity);
  if (query.accessible) params.set("accessible", "1");
  if (query.sort !== "name") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== FINDER_DEFAULT_PAGE_SIZE) params.set("pageSize", String(query.pageSize));
  return params;
}

export function finderQueryString(query: FinderQuery): string {
  const params = serializeFinderQuery(query);
  const text = params.toString();
  return text ? `?${text}` : "";
}
