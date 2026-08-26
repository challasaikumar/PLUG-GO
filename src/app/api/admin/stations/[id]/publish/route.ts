import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { publishStation } from "@/lib/catalogue/station-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.publishStation);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await publishStation(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Station not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "This station cannot be published yet.", result.errors);
  }
  return jsonOk({ station: result.station });
}
