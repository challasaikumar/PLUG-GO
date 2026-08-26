import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { guardStaff } from "@/lib/api/guard";
import { createStation, listAdminStations } from "@/lib/catalogue/station-service";
import type { PublicationStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = guardStaff(ROLE_MATRIX.readCatalogue);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const publicationStatus = url.searchParams.get("publicationStatus") as PublicationStatus | null;
  const stations = await listAdminStations({
    publicationStatus: publicationStatus || undefined,
    q: url.searchParams.get("q")?.trim() || undefined,
  });
  return jsonOk({ stations });
}

export async function POST(request: Request) {
  const auth = guardStaff(ROLE_MATRIX.writeStationFacts);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const requestId = requestIdFrom(request);
  return withIdempotency(request, auth.actor, "POST /api/admin/stations", json.value, async () => {
    const result = await createStation(auth.actor, json.value, requestId);
    if (!result.ok) {
      return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
    }
    return jsonOk({ station: result.station }, 201);
  });
}
