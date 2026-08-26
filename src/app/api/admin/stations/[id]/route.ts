import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { getAdminStation, updateStation } from "@/lib/catalogue/station-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.readCatalogue);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const station = await getAdminStation(id);
  if (!station) return jsonError(404, "not_found", "Station not found.");
  return jsonOk({ station });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.writeStationFacts);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await updateStation(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Station not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
  }
  return jsonOk({ station: result.station });
}
