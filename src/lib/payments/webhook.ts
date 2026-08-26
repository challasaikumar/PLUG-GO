import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { getPaymentAdapter } from "./adapter";
import type { VerifiedPaymentEvent } from "./types";
import { issueBookingReceipts } from "./documents";

const RETRYABLE_RESULTS = new Set(["order_not_found", "refund_not_found"]);

export async function processVerifiedPaymentEvent(input: {
  provider: string;
  rawBody: string;
  headers: Headers;
}): Promise<{ ok: true; result: string } | { ok: false; reason: string }> {
  void input.provider;
  const adapter = getPaymentAdapter();
  const verified = adapter.verifyWebhook(input.rawBody, input.headers);
  if (!verified) {
    return { ok: false, reason: "invalid_signature" };
  }

  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex");
  const prisma = getPrisma();

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { providerEventId: verified.providerEventId },
  });
  if (existing?.processedAt) {
    return { ok: true, result: existing.processingResult ?? "duplicate_ignored" };
  }

  let eventRow = existing;
  if (!eventRow) {
    try {
      eventRow = await prisma.paymentWebhookEvent.create({
        data: {
          provider: adapter.name,
          providerEventId: verified.providerEventId,
          eventType: verified.type,
          signatureValid: true,
          payloadHash,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await prisma.paymentWebhookEvent.findUnique({
          where: { providerEventId: verified.providerEventId },
        });
        if (raced?.processedAt) {
          return { ok: true, result: raced.processingResult ?? "duplicate_ignored" };
        }
        eventRow = raced;
      } else {
        throw error;
      }
    }
  }
  if (!eventRow) {
    return { ok: true, result: "duplicate_ignored" };
  }

  if (verified.type === "ignored") {
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: { processedAt: new Date(), processingResult: "ignored_event" },
    });
    return { ok: true, result: "ignored_event" };
  }

  const result = await prisma.$transaction(async (tx) => {
    if (verified.type === "payment.captured") {
      return confirmPayment(tx, verified);
    }
    if (verified.type === "payment.failed") {
      return failPayment(tx, verified);
    }
    if (verified.type === "refund.processed") {
      return completeRefund(tx, verified);
    }
    return "ignored_event";
  });

  if (!RETRYABLE_RESULTS.has(result)) {
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: { processedAt: new Date(), processingResult: result },
    });
  } else {
    await prisma.paymentWebhookEvent.update({
      where: { id: eventRow.id },
      data: { processingResult: result },
    });
  }
  return { ok: true, result };
}

async function confirmPayment(tx: Prisma.TransactionClient, event: VerifiedPaymentEvent) {
  const attempt = await tx.paymentAttempt.findFirst({
    where: { providerOrderId: event.providerOrderId },
    include: { booking: true },
    orderBy: { createdAt: "desc" },
  });
  if (!attempt) return "order_not_found";
  if (event.amountPaise != null && event.amountPaise !== attempt.amountPaise) {
    return "amount_mismatch";
  }
  if (attempt.status === "succeeded" && attempt.booking.status === "confirmed") {
    return "already_confirmed";
  }

  await tx.paymentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "succeeded",
      providerPaymentId: event.providerPaymentId ?? attempt.providerPaymentId,
    },
  });
  if (attempt.booking.status !== "confirmed") {
    await tx.booking.update({
      where: { id: attempt.bookingId },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
        holdExpiresAt: null,
      },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: attempt.bookingId,
        fromStatus: attempt.booking.status,
        toStatus: "confirmed",
        actorType: "webhook",
        reason: "Verified payment webhook.",
      },
    });
  }
  await issueBookingReceipts(tx, attempt.bookingId);
  return "payment_captured";
}

async function failPayment(tx: Prisma.TransactionClient, event: VerifiedPaymentEvent) {
  const attempt = await tx.paymentAttempt.findFirst({
    where: { providerOrderId: event.providerOrderId },
    include: { booking: true },
    orderBy: { createdAt: "desc" },
  });
  if (!attempt) return "order_not_found";
  if (attempt.status === "succeeded") return "ignored_after_success";

  await tx.paymentAttempt.update({
    where: { id: attempt.id },
    data: { status: "failed", failureCode: "provider_failed" },
  });
  if (attempt.booking.status === "pending_payment" || attempt.booking.status === "payment_processing") {
    await tx.booking.update({
      where: { id: attempt.bookingId },
      data: { status: "payment_failed", holdExpiresAt: null },
    });
    await tx.reservationHold.updateMany({
      where: { bookingId: attempt.bookingId, releasedAt: null },
      data: { releasedAt: new Date() },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: attempt.bookingId,
        fromStatus: attempt.booking.status,
        toStatus: "payment_failed",
        actorType: "webhook",
        reason: "Verified payment failure webhook.",
      },
    });
  }
  return "payment_failed";
}

async function completeRefund(tx: Prisma.TransactionClient, event: VerifiedPaymentEvent) {
  const refund = event.providerRefundId
    ? await tx.refund.findFirst({ where: { providerRefundId: event.providerRefundId } })
    : await tx.refund.findFirst({
        where: {
          paymentAttempt: { providerOrderId: event.providerOrderId },
          status: { in: ["pending_provider", "processing"] },
        },
        orderBy: { createdAt: "desc" },
      });
  if (!refund) return "refund_not_found";
  if (refund.status === "completed") return "already_refunded";

  await tx.refund.update({
    where: { id: refund.id },
    data: { status: "completed", providerRefundId: event.providerRefundId ?? refund.providerRefundId },
  });
  await tx.refundStatusHistory.create({
    data: {
      refundId: refund.id,
      fromStatus: refund.status,
      toStatus: "completed",
      actorType: "webhook",
      reason: "Verified refund webhook.",
    },
  });
  await tx.booking.update({
    where: { id: refund.bookingId },
    data: { status: "refunded" },
  });
  await tx.bookingStatusHistory.create({
    data: {
      bookingId: refund.bookingId,
      fromStatus: "refund_pending",
      toStatus: "refunded",
      actorType: "webhook",
      reason: "Refund completed by provider.",
    },
  });
  return "refund_processed";
}
