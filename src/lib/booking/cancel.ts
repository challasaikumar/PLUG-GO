import { BookingError } from "./service";
import { getPrisma } from "@/lib/db/prisma";
import { percentOffPaise, toIntPaise } from "@/lib/tariff/money";

export async function cancelDriverBooking(input: {
  driverId: string;
  publicRef: string;
  reason: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { publicRef: input.publicRef, driverId: input.driverId },
    include: { policy: true, paymentAttempts: { orderBy: { createdAt: "desc" } } },
  });
  if (!booking) throw new BookingError(404, "not_found", "That booking was not found.");
  if (booking.status !== "confirmed" && booking.status !== "pending_payment" && booking.status !== "payment_processing") {
    throw new BookingError(409, "conflict", "This booking cannot be cancelled in its current state.");
  }

  const snapshot = snapshotFromBooking(booking.policySnapshot, booking.policy);
  if (booking.status === "confirmed") {
    if (!snapshot.cancellationAllowed) {
      throw new BookingError(409, "conflict", "Cancellation is not permitted under the booking policy.");
    }
    const cutoffMs = (snapshot.cancellationCutoffMinutes ?? 0) * 60 * 1000;
    if (now.getTime() > booking.windowStart.getTime() - cutoffMs) {
      throw new BookingError(409, "conflict", "The cancellation window has closed.");
    }
  }

  const paid = booking.paymentAttempts.find((row) => row.status === "succeeded");
  const shouldRefund = Boolean(paid && snapshot.refundOnCancel && booking.status === "confirmed");
  const refundAmount = shouldRefund
    ? toIntPaise(percentOffPaise(BigInt(paid!.amountPaise), BigInt(snapshot.refundPercentBps)))
    : 0;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: shouldRefund ? "refund_pending" : "cancelled",
        cancelledAt: now,
        cancelReason: input.reason.slice(0, 500),
        holdExpiresAt: null,
      },
    });
    await tx.reservationHold.updateMany({
      where: { bookingId: booking.id, releasedAt: null },
      data: { releasedAt: now },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: shouldRefund ? "refund_pending" : "cancelled",
        actorType: "driver",
        actorId: input.driverId,
        reason: input.reason.slice(0, 500),
      },
    });
    if (shouldRefund && paid && refundAmount > 0) {
      await tx.refund.create({
        data: {
          bookingId: booking.id,
          paymentAttemptId: paid.id,
          driverId: input.driverId,
          amountPaise: refundAmount,
          status: "pending_review",
          reason: input.reason.slice(0, 500),
          requestedByType: "driver",
          requestedById: input.driverId,
          history: {
            create: {
              fromStatus: null,
              toStatus: "pending_review",
              actorType: "driver",
              actorId: input.driverId,
              reason: "Driver cancellation with policy refund. Staff finance must send it to the provider.",
            },
          },
        },
      });
    } else if (booking.status === "pending_payment" || booking.status === "payment_processing") {
      await tx.paymentAttempt.updateMany({
        where: { bookingId: booking.id, status: { in: ["created", "processing"] } },
        data: { status: "cancelled" },
      });
    }
  });

  return prisma.booking.findFirstOrThrow({
    where: { id: booking.id },
    include: { refunds: true },
  });
}

function snapshotFromBooking(
  raw: unknown,
  fallback: {
    cancellationAllowed: boolean;
    cancellationCutoffMinutes: number | null;
    refundOnCancel: boolean;
    refundPercentBps: number;
  },
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const row = raw as Record<string, unknown>;
  return {
    cancellationAllowed:
      typeof row.cancellationAllowed === "boolean" ? row.cancellationAllowed : fallback.cancellationAllowed,
    cancellationCutoffMinutes:
      typeof row.cancellationCutoffMinutes === "number"
        ? row.cancellationCutoffMinutes
        : fallback.cancellationCutoffMinutes,
    refundOnCancel: typeof row.refundOnCancel === "boolean" ? row.refundOnCancel : fallback.refundOnCancel,
    refundPercentBps:
      typeof row.refundPercentBps === "number" ? row.refundPercentBps : fallback.refundPercentBps,
  };
}
