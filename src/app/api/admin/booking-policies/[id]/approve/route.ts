import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { approvePolicy } from "@/lib/booking/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.approveBookingPolicy);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await approvePolicy(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Booking policy not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "This booking policy cannot be approved.", result.errors);
  }
  return jsonOk({ policy: result.policy });
}
