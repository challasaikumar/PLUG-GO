import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { rotateChargePointCredential } from "@/lib/ocpp/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardStaff(ROLE_MATRIX.commissionChargePoint);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await rotateChargePointCredential(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Charge point not found.");
  if (!result.ok) return jsonError(400, "validation_error", "Credential rotation failed.");
  return jsonOk({
    oneTimePassword: result.oneTimePassword,
    secretKid: result.secretKid,
    notice: "Password shown once. Do not commit it or paste it into a public page.",
  });
}
