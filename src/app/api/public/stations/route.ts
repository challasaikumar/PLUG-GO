import { jsonError, jsonOk } from "@/lib/api/http";
import { listPublicStations } from "@/lib/catalogue/station-service";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { parseFinderQuery } from "@/lib/finder/query";
import { isFeatureEnabled } from "@/lib/release/overrides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isFeatureEnabled("publicStationFinder"))) {
    return jsonError(503, "not_configured", "Public station search is not enabled on this server.");
  }
  if (!isDatabaseConfigured()) {
    return jsonError(503, "not_configured", "DATABASE_URL is not set. Public catalogue is unavailable.");
  }

  const url = new URL(request.url);
  const parsed = parseFinderQuery(url.searchParams);
  if (!parsed.ok) {
    return jsonError(400, "validation_error", "Invalid search or filter parameters.", parsed.errors);
  }

  const query = parsed.query;
  const result = await listPublicStations({
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
    lat: query.lat,
    lng: query.lng,
    radiusKm: query.radiusKm,
    north: query.north,
    south: query.south,
    east: query.east,
    west: query.west,
  });

  const response = jsonOk({
    ...result,
    freshness: {
      note: "availableConnectorCount only includes connectors whose public status is Available under the freshness rules. Unknown and Stale are never counted as Available.",
    },
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
