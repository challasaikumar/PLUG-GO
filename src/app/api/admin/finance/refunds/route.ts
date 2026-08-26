import { ROLE_MATRIX } from "@/lib/auth/staff";
import { bookingErrorResponse, jsonError, jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { withIdempotency } from "@/lib/api/idempotency";
import { staffInitiateRefund } from "@/lib/payments/refunds";
import { BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = guardStaff(ROLE_MATRIX.initiateRefund);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  const publicRef = typeof body.publicRef === "string" ? body.publicRef : "";
  const amountPaise = typeof body.amountPaise === "number" ? body.amountPaise : Number.parseInt(String(body.amountPaise ?? ""), 10);
  const reason = typeof body.reason === "string" ? body.reason : "";
  if (!publicRef) return jsonError(400, "validation_error", "A booking reference is required.");

  return withIdempotency(request, auth.actor, "POST /api/admin/finance/refunds", body, async () => {
    try {
      const refund = await staffInitiateRefund({
        actor: auth.actor,
        bookingPublicRef: publicRef,
        amountPaise,
        reason,
        requestId: requestIdFrom(request),
      });
      return jsonOk({
        refund: {
          id: refund.id,
          status: refund.status,
          amountPaise: refund.amountPaise,
        },
      });
    } catch (error) {
      if (error instanceof BookingError) return bookingErrorResponse(error);
      throw error;
    }
  });
}
