import { ROLE_MATRIX } from "@/lib/auth/staff";
import { bookingErrorResponse, jsonOk, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { withIdempotency } from "@/lib/api/idempotency";
import { staffSendPendingRefund } from "@/lib/payments/refunds";
import { BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.initiateRefund);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  return withIdempotency(request, auth.actor, `POST /api/admin/finance/refunds/${id}/send`, { id }, async () => {
    try {
      const refund = await staffSendPendingRefund({
        actor: auth.actor,
        refundId: id,
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
