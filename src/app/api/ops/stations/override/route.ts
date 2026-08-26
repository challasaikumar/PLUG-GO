import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { opsOverrideStatus } from "@/lib/ops/stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = guardOps(ROLE_MATRIX.statusOverride);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const result = await opsOverrideStatus(auth.actor, body, requestIdFrom(request));
    if (!result.ok) {
      if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "That connector was not found.");
      return jsonError(400, "validation_error", "Override was not valid.", "errors" in result ? result.errors : undefined);
    }
    const response = jsonOk({ eventId: result.event.id });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}
