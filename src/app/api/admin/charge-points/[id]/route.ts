import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { rotateChargePointCredential, updateChargePointCommissioning } from "@/lib/ocpp/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardStaff(ROLE_MATRIX.commissionChargePoint);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await updateChargePointCommissioning(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Charge point not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
  }
  return jsonOk({
    chargePoint: {
      id: result.chargePoint.id,
      commissioningState: result.chargePoint.commissioningState,
      inventoryComplete: result.chargePoint.inventoryComplete,
    },
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardStaff(ROLE_MATRIX.commissionChargePoint);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const url = new URL(request.url);
  if (!url.pathname.endsWith("/rotate-credential") && !url.searchParams.has("rotate")) {
    return jsonError(400, "validation_error", "Use the rotate-credential route.");
  }
  const result = await rotateChargePointCredential(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Charge point not found.");
  if (!result.ok) return jsonError(400, "validation_error", "Credential rotation failed.");
  return jsonOk({
    oneTimePassword: result.oneTimePassword,
    secretKid: result.secretKid,
    notice: "Password shown once. Do not commit it.",
  });
}
