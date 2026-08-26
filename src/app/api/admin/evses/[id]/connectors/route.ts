import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { addConnector } from "@/lib/catalogue/hardware-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.writeHardware);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await addConnector(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "EVSE not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
  }
  return jsonOk({ connector: result.connector }, 201);
}
