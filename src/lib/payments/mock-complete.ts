import { getDriverBooking } from "@/lib/booking/queries";
import { BookingError } from "@/lib/booking/service";
import { isPaymentMockEnabled } from "@/lib/payments/config";
import { signMockWebhook } from "@/lib/payments/mock";
import { processVerifiedPaymentEvent } from "@/lib/payments/webhook";
import { getPrisma } from "@/lib/db/prisma";

export async function completeMockCheckout(input: {
  driverId: string;
  publicRef: string;
  outcome: "captured" | "failed";
}) {
  if (!isPaymentMockEnabled()) {
    throw new BookingError(403, "forbidden", "Mock checkout is disabled.");
  }
  const booking = await getDriverBooking(input.driverId, input.publicRef);
  const attempt = booking.paymentAttempts.find((row) => row.providerOrderId);
  if (!attempt?.providerOrderId) {
    throw new BookingError(409, "conflict", "No payment order is waiting for this booking.");
  }
  if (booking.status === "confirmed") {
    return { alreadyConfirmed: true as const, publicRef: booking.publicRef };
  }
  const body = JSON.stringify({
    eventId: `mock_ui_${attempt.id}_${input.outcome}`,
    type: input.outcome === "captured" ? "payment.captured" : "payment.failed",
    orderId: attempt.providerOrderId,
    paymentId: `mock_pay_${attempt.id.slice(0, 12)}`,
    amountPaise: attempt.amountPaise,
  });
  const result = await processVerifiedPaymentEvent({
    provider: "mock",
    rawBody: body,
    headers: new Headers({ "x-png-mock-signature": signMockWebhook(body) }),
  });
  if (!result.ok) {
    throw new BookingError(400, "validation_error", "The mock payment event was rejected.");
  }
  const prisma = getPrisma();
  const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
  return { alreadyConfirmed: false as const, publicRef: booking.publicRef, status: updated.status, result: result.result };
}
