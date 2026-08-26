import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom, staffErrorResponse } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { commissionChargePoint } from "@/lib/ocpp/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = guardStaff(ROLE_MATRIX.commissionChargePoint);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  try {
    const result = await commissionChargePoint(auth.actor, json.value, requestIdFrom(request));
    if (!result.ok) {
      return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
    }
    return jsonOk(
      {
        chargePoint: result.chargePoint,
        oneTimePassword: result.oneTimePassword,
        notice:
          "This Basic-auth password is shown once. Store it in the charger vendor CSMS configuration, not in Git. Plug and Go does not treat this charger as certified.",
      },
      201,
    );
  } catch (error) {
    return staffErrorResponse(error);
  }
}
