import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { listStationPolicies, upsertDraftPolicy } from "@/lib/booking/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.readCatalogue);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const policies = await listStationPolicies(id);
  return jsonOk({ policies });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.writeBookingPolicy);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await upsertDraftPolicy(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Station not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "This booking policy cannot be saved.", result.errors);
  }
  return jsonOk({ policy: result.policy }, 201);
}
