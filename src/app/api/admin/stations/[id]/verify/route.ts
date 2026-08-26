import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { verifyStation } from "@/lib/catalogue/station-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.writeStationFacts);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = (json.value ?? {}) as { scope?: string; notes?: string };
  const result = await verifyStation(
    auth.actor,
    id,
    body.scope ?? "facts",
    body.notes,
    requestIdFrom(request),
  );
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Station not found.");
  if (!result.ok) return jsonError(400, "validation_error", "Verification failed.");
  return jsonOk({ station: result.station });
}
