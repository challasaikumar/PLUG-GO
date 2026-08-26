import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { estimatePublicTariff } from "@/lib/catalogue/station-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isDatabaseConfigured()) {
    return jsonError(503, "not_configured", "DATABASE_URL is not set. Public catalogue is unavailable.");
  }
  const { slug } = await context.params;
  const url = new URL(request.url);
  const energyRaw = url.searchParams.get("energyKwhMilli") ?? "10000";
  const energyKwhMilli = Number.parseInt(energyRaw, 10);
  if (!Number.isInteger(energyKwhMilli) || energyKwhMilli < 0) {
    return jsonError(400, "validation_error", "energyKwhMilli must be a non-negative integer (thousandths of a kWh).");
  }
  const idleMinutes = url.searchParams.get("idleMinutes")
    ? Number.parseInt(url.searchParams.get("idleMinutes") ?? "", 10)
    : 0;
  const parkingMinutes = url.searchParams.get("parkingMinutes")
    ? Number.parseInt(url.searchParams.get("parkingMinutes") ?? "", 10)
    : 0;
  if (!Number.isInteger(idleMinutes) || idleMinutes < 0) {
    return jsonError(400, "validation_error", "idleMinutes must be a non-negative integer.");
  }
  if (!Number.isInteger(parkingMinutes) || parkingMinutes < 0) {
    return jsonError(400, "validation_error", "parkingMinutes must be a non-negative integer.");
  }

  const result = await estimatePublicTariff(slug, {
    energyKwhMilli,
    idleMinutes,
    parkingMinutes,
    includeReservation: url.searchParams.get("includeReservation") === "true",
    connectorId: url.searchParams.get("connectorId")?.trim() || undefined,
  });

  if ("notFound" in result && result.notFound) {
    return jsonError(404, "not_found", "No published station matches that slug.");
  }
  if ("unpublished" in result && result.unpublished) {
    return jsonError(
      404,
      "not_found",
      "Price is not published for this station. No approved tariff covers the requested time.",
    );
  }
  if (!result.ok) {
    return jsonError(404, "not_found", "Price is not published.");
  }
  const response = jsonOk({ estimate: result.estimate });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
