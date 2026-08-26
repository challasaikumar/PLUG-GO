import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { getPublicStationBySlug } from "@/lib/catalogue/station-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isDatabaseConfigured()) {
    return jsonError(503, "not_configured", "DATABASE_URL is not set. Public catalogue is unavailable.");
  }
  const { slug } = await context.params;
  const station = await getPublicStationBySlug(slug);
  if (!station) {
    return jsonError(404, "not_found", "No published station matches that slug.");
  }
  const response = jsonOk({ station });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
