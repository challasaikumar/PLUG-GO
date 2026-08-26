import type { StaffActor } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import { getPaymentAdapter } from "@/lib/payments/adapter";
import { writeAudit } from "@/lib/catalogue/audit";
import { BookingError } from "@/lib/booking/service";
import { featureEnabledSync } from "@/lib/release/flags";

export async function staffSendPendingRefund(input: {
  actor: StaffActor;
  refundId: string;
  requestId?: string;
}) {
  if (!featureEnabledSync("refunds")) {
    throw new BookingError(503, "not_configured", "Refunds are disabled until FLAG_REFUNDS is true and payment is configured.");
  }
  const prisma = getPrisma();
  const refund = await prisma.refund.findUnique({
    where: { id: input.refundId },
    include: { paymentAttempt: true, booking: true },
  });
  if (!refund) throw new BookingError(404, "not_found", "That refund was not found.");
  if (refund.status !== "pending_review" && refund.status !== "requested") {
    throw new BookingError(409, "conflict", "This refund is not waiting for finance to send it to the provider.");
  }
  return sendRefundToProvider({
    actor: input.actor,
    refundId: refund.id,
    paymentAttempt: refund.paymentAttempt,
    requestId: input.requestId,
    reason: refund.reason,
  });
}

async function sendRefundToProvider(input: {
  actor: StaffActor;
  refundId: string;
  paymentAttempt: { providerPaymentId: string | null; provider: string; id: string };
  requestId?: string;
  reason: string;
}) {
  const prisma = getPrisma();
  const adapter = getPaymentAdapter();
  await prisma.refund.update({
    where: { id: input.refundId },
    data: { status: "pending_provider", approvedById: input.actor.id },
  });
  await prisma.refundStatusHistory.create({
    data: {
      refundId: input.refundId,
      fromStatus: "pending_review",
      toStatus: "pending_provider",
      actorType: "staff",
      actorId: input.actor.id,
      reason: "Finance sent the refund to the payment provider.",
    },
  });
  try {
    const providerResult = await adapter.createRefund({
      providerPaymentId: input.paymentAttempt.providerPaymentId || `mock_pay_${input.paymentAttempt.id.slice(0, 12)}`,
      amountPaise: (
        await prisma.refund.findUniqueOrThrow({ where: { id: input.refundId } })
      ).amountPaise,
      notes: input.reason,
    });
    await prisma.refund.update({
      where: { id: input.refundId },
      data: {
        providerRefundId: providerResult.providerRefundId,
        status: "processing",
      },
    });
  } catch {
    await prisma.refund.update({
      where: { id: input.refundId },
      data: { status: "pending_review" },
    });
    await prisma.refundStatusHistory.create({
      data: {
        refundId: input.refundId,
        fromStatus: "pending_provider",
        toStatus: "pending_review",
        actorType: "staff",
        actorId: input.actor.id,
        reason: "Provider refund API did not accept the request. Manual review required.",
      },
    });
  }
  await writeAudit({
    actor: input.actor,
    action: "refund.provider_submitted",
    targetType: "refund",
    targetId: input.refundId,
    requestId: input.requestId,
  });
  return prisma.refund.findUniqueOrThrow({ where: { id: input.refundId } });
}

export async function staffInitiateRefund(input: {
  actor: StaffActor;
  bookingPublicRef: string;
  amountPaise: number;
  reason: string;
  requestId?: string;
}) {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 1) {
    throw new BookingError(400, "validation_error", "Refund amount must be a positive integer in paise.");
  }
  if (!featureEnabledSync("refunds")) {
    throw new BookingError(503, "not_configured", "Refunds are disabled until FLAG_REFUNDS is true and payment is configured.");
  }
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new BookingError(400, "validation_error", "A refund reason is required.");
  }
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { publicRef: input.bookingPublicRef },
    include: { paymentAttempts: { where: { status: "succeeded" }, orderBy: { createdAt: "desc" } } },
  });
  if (!booking) throw new BookingError(404, "not_found", "That booking was not found.");
  const paid = booking.paymentAttempts[0];
  if (!paid?.providerPaymentId && paid?.provider !== "mock") {
    throw new BookingError(409, "conflict", "No captured payment is available to refund.");
  }
  if (!paid) throw new BookingError(409, "conflict", "No captured payment is available to refund.");
  if (input.amountPaise > paid.amountPaise) {
    throw new BookingError(400, "validation_error", "Refund amount cannot exceed the captured payment.");
  }

  const adapter = getPaymentAdapter();
  const refund = await prisma.refund.create({
    data: {
      bookingId: booking.id,
      paymentAttemptId: paid.id,
      driverId: booking.driverId,
      amountPaise: input.amountPaise,
      status: "pending_provider",
      reason,
      requestedByType: "staff",
      requestedById: input.actor.id,
      approvedById: input.actor.id,
      history: {
        create: {
          fromStatus: null,
          toStatus: "pending_provider",
          actorType: "staff",
          actorId: input.actor.id,
          reason,
        },
      },
    },
  });
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "refund_pending" },
  });
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: "refund_pending",
      actorType: "staff",
      actorId: input.actor.id,
      reason,
    },
  });

  try {
    const providerResult = await adapter.createRefund({
      providerPaymentId: paid.providerPaymentId || `mock_pay_${paid.id.slice(0, 12)}`,
      amountPaise: input.amountPaise,
      notes: reason,
    });
    await prisma.refund.update({
      where: { id: refund.id },
      data: {
        providerRefundId: providerResult.providerRefundId,
        status: providerResult.status === "processed" ? "processing" : "processing",
      },
    });
  } catch {
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "pending_review" },
    });
    await prisma.refundStatusHistory.create({
      data: {
        refundId: refund.id,
        fromStatus: "pending_provider",
        toStatus: "pending_review",
        actorType: "staff",
        actorId: input.actor.id,
        reason: "Provider refund API did not accept the request. Manual review required.",
      },
    });
  }

  await writeAudit({
    actor: input.actor,
    action: "refund.initiated",
    targetType: "booking",
    targetId: booking.id,
    after: { amountPaise: input.amountPaise },
    requestId: input.requestId,
  });

  return prisma.refund.findUniqueOrThrow({ where: { id: refund.id } });
}
