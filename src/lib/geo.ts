/**
 * Geography helpers for published station coordinates.
 * Distances are computed from WGS84 decimal degrees; they are not stored.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) {
    const metres = Math.round(km * 1000);
    return `${metres} m`;
  }
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${rounded} km`;
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function boundingBoxFromRadiusKm(
  lat: number,
  lng: number,
  radiusKm: number,
): { north: number; south: number; east: number; west: number } {
  const latDelta = radiusKm / 110.574;
  const lngDelta = radiusKm / (111.32 * Math.cos(toRad(lat)) || 1);
  return {
    north: Math.min(90, lat + latDelta),
    south: Math.max(-90, lat - latDelta),
    east: Math.min(180, lng + lngDelta),
    west: Math.max(-180, lng - lngDelta),
  };
}

/** URL path segment for Indian state/city names. */
export function pathSegment(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "location";
}

export function stationCanonicalPath(station: {
  state: string;
  city: string;
  slug: string;
}): string {
  return `/stations/${pathSegment(station.state)}/${pathSegment(station.city)}/${station.slug}`;
}

export function isCanonicalStationPath(
  params: { state: string; city: string; slug: string },
  station: { state: string; city: string; slug: string },
): boolean {
  return (
    params.slug === station.slug &&
    params.state === pathSegment(station.state) &&
    params.city === pathSegment(station.city)
  );
}

export const STATION_PATH_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidStationRouteParam(value: string, max = 72): boolean {
  return value.length > 0 && value.length <= max && STATION_PATH_SEGMENT.test(value);
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function appleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function formatFullAddress(address: {
  line1: string;
  line2?: string | null;
  locality?: string | null;
  city: string;
  district?: string | null;
  state: string;
  pincode: string;
  country?: string | null;
}): string {
  return [
    address.line1,
    address.line2,
    address.locality,
    address.city,
    address.district,
    address.state,
    address.pincode,
    address.country && address.country !== "IN" ? address.country : null,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
