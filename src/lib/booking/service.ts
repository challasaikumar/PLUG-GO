import { createHash } from "node:crypto";
import type { BookingPolicy, Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { gstPaise, toIntPaise } from "@/lib/tariff/money";
import {
  paymentConfigured,
  bookingHoldSeconds,
  bookingRefPrefix,
  paymentAdapterStatus,
  publicCheckoutKey,
} from "@/lib/payments/config";
import { getPaymentAdapter } from "@/lib/payments/adapter";
import { featureEnabledSync } from "@/lib/release/flags";
import { signMockWebhook } from "@/lib/payments/mock";
import { processVerifiedPaymentEvent } from "@/lib/payments/webhook";
import {
  CAPACITY_OCCUPYING_STATUSES,
  UNPAID_HOLD_STATUSES,
  connectorEligible,
  connectorSafeToBook,
  policyIsCurrentlyEffective,
  windowsOverlap,
} from "./eligibility";

export class BookingError extends Error {
  readonly status: number;
  readonly code: "validation_error" | "not_found" | "conflict" | "not_configured" | "forbidden" | "unauthenticated";

  constructor(
    status: number,
    code: "validation_error" | "not_found" | "conflict" | "not_configured" | "forbidden" | "unauthenticated",
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
    this.status = status;
    this.code = code;
  }
}

export function quotePolicyFee(policy: Pick<BookingPolicy, "bookingFeePaise" | "gstRateBps">) {
  const fee = BigInt(policy.bookingFeePaise);
  const gst = gstPaise(fee, BigInt(policy.gstRateBps));
  return {
    feePaise: toIntPaise(fee),
    gstPaise: toIntPaise(gst),
    totalPaise: toIntPaise(fee + gst),
    currency: "INR" as const,
  };
}

export function policySnapshot(policy: BookingPolicy) {
  return {
    policyId: policy.id,
    version: policy.version,
    bookingEnabled: policy.bookingEnabled,
    arrivalWindowMinutes: policy.arrivalWindowMinutes,
    reservationDurationMinutes: policy.reservationDurationMinutes,
    capacityLimit: policy.capacityLimit,
    bookingFeePaise: policy.bookingFeePaise,
    gstRateBps: policy.gstRateBps,
    cancellationAllowed: policy.cancellationAllowed,
    cancellationCutoffMinutes: policy.cancellationCutoffMinutes,
    refundOnCancel: policy.refundOnCancel,
    refundPercentBps: policy.refundPercentBps,
    cancellationPolicyText: policy.cancellationPolicyText,
    noShowPolicyText: policy.noShowPolicyText,
    refundPolicyText: policy.refundPolicyText,
    supportContactText: policy.supportContactText,
    effectiveFrom: policy.effectiveFrom.toISOString(),
    effectiveTo: policy.effectiveTo?.toISOString() ?? null,
  };
}

export async function expireUnpaidHolds(now = new Date(), prisma = getPrisma()) {
  const expired = await prisma.booking.findMany({
    where: {
      status: { in: UNPAID_HOLD_STATUSES },
      holdExpiresAt: { lte: now },
    },
    select: { id: true, status: true },
  });
  for (const row of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: row.id },
        data: { status: "expired", holdExpiresAt: null },
      });
      await tx.reservationHold.updateMany({
        where: { bookingId: row.id, releasedAt: null },
        data: { releasedAt: now },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: row.id,
          fromStatus: row.status,
          toStatus: "expired",
          actorType: "system",
          reason: "Unpaid reservation hold expired.",
        },
      });
      await tx.paymentAttempt.updateMany({
        where: { bookingId: row.id, status: { in: ["created", "processing"] } },
        data: { status: "expired" },
      });
    });
  }
  return expired.length;
}

export async function getEffectivePolicy(stationId: string, now = new Date()) {
  const prisma = getPrisma();
  const policies = await prisma.bookingPolicy.findMany({
    where: { stationId, approvalStatus: "approved", bookingEnabled: true },
    orderBy: { effectiveFrom: "desc" },
  });
  return policies.find((policy) => policyIsCurrentlyEffective(policy, now)) ?? null;
}

async function occupyingCount(
  tx: Prisma.TransactionClient,
  connectorId: string,
  windowStart: Date,
  windowEnd: Date,
  exceptBookingId?: string,
) {
  const rows = await tx.booking.findMany({
    where: {
      connectorId,
      status: { in: CAPACITY_OCCUPYING_STATUSES },
      id: exceptBookingId ? { not: exceptBookingId } : undefined,
    },
    select: { id: true, windowStart: true, windowEnd: true },
  });
  return rows.filter((row) => windowsOverlap(windowStart, windowEnd, row.windowStart, row.windowEnd)).length;
}

function newReferenceCode() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${bookingRefPrefix()}-${day}-${rand}`;
}

export async function createBookingHold(input: {
  driverId: string;
  stationSlug: string;
  connectorId: string;
  windowStart: Date;
  idempotencyKey: string;
  requestId?: string;
  now?: Date;
}) {
  if (!featureEnabledSync("booking") || !featureEnabledSync("paymentCheckout") || !paymentConfigured()) {
    throw new BookingError(
      503,
      "not_configured",
      "Booking cannot be accepted because booking or payment checkout is not enabled, or payment is not configured.",
    );
  }
  const now = input.now ?? new Date();
  await expireUnpaidHolds(now);
  const prisma = getPrisma();

  const existingAttempt = await prisma.paymentAttempt.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { booking: true },
  });
  if (existingAttempt) {
    if (existingAttempt.driverId !== input.driverId) {
      throw new BookingError(409, "conflict", "That idempotency key was already used.");
    }
    return {
      booking: existingAttempt.booking,
      checkout: checkoutFromAttempt(existingAttempt),
      attemptId: existingAttempt.id,
      reused: true as const,
    };
  }

  const station = await prisma.station.findFirst({
    where: { slug: input.stationSlug, publicationStatus: "published", isDemo: false },
    include: {
      connectors: { include: { currentStatus: true } },
    },
  });
  if (!station) throw new BookingError(404, "not_found", "That station is not available to book.");
  const policy = await getEffectivePolicy(station.id, now);
  if (!policy) {
    throw new BookingError(409, "conflict", "Booking is not enabled for this station.");
  }
  if (!policy.cancellationPolicyText.trim() || !policy.refundPolicyText.trim()) {
    throw new BookingError(409, "conflict", "Booking cannot be accepted because cancellation or refund policy is missing.");
  }
  const connector = station.connectors.find((row) => row.id === input.connectorId);
  if (!connector || !connectorEligible(policy, connector.id)) {
    throw new BookingError(409, "conflict", "That connector cannot be reserved.");
  }
  if (
    !connectorSafeToBook({
      installationStatus: connector.installationStatus,
      recordedStatus: connector.currentStatus?.recordedStatus ?? null,
      statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
      overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
    })
  ) {
    throw new BookingError(409, "conflict", "Live status is not safe enough to take a booking for this connector.");
  }

  if (!(input.windowStart instanceof Date) || Number.isNaN(input.windowStart.getTime())) {
    throw new BookingError(400, "validation_error", "Choose a valid reservation start time.");
  }
  if (input.windowStart.getTime() < now.getTime() - 30_000) {
    throw new BookingError(400, "validation_error", "The reservation window must start in the future.");
  }
  const windowEnd = new Date(input.windowStart.getTime() + policy.reservationDurationMinutes * 60 * 1000);
  const quote = quotePolicyFee(policy);
  const adapterStatus = paymentAdapterStatus();
  if (quote.totalPaise === 0 && adapterStatus.ok && adapterStatus.provider === "razorpay") {
    throw new BookingError(
      409,
      "conflict",
      "This payment provider cannot process a zero-amount booking. A booking fee must be configured.",
    );
  }

  const holdUntil = new Date(now.getTime() + bookingHoldSeconds() * 1000);

  const created = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Connector" WHERE id = ${connector.id} FOR UPDATE`;
    const used = await occupyingCount(tx, connector.id, input.windowStart, windowEnd);
    if (used >= policy.capacityLimit) {
      throw new BookingError(409, "conflict", "No reservation capacity is left for that window.");
    }

    const booking = await tx.booking.create({
      data: {
        referenceCode: newReferenceCode(),
        driverId: input.driverId,
        stationId: station.id,
        connectorId: connector.id,
        policyId: policy.id,
        policyVersion: policy.version,
        status: "pending_payment",
        windowStart: input.windowStart,
        windowEnd,
        holdExpiresAt: holdUntil,
        feePaise: quote.feePaise,
        gstPaise: quote.gstPaise,
        totalPaise: quote.totalPaise,
        policySnapshot: policySnapshot(policy) as Prisma.InputJsonValue,
        tariffSnapshot: {
          note: "Tariff snapshot is informational. This booking does not bill energy. A charging invoice waits for a future OCPP session.",
        } as Prisma.InputJsonValue,
      },
    });
    await tx.reservationHold.create({
      data: {
        bookingId: booking.id,
        connectorId: connector.id,
        windowStart: input.windowStart,
        windowEnd,
        expiresAt: holdUntil,
      },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: "pending_payment",
        actorType: "driver",
        actorId: input.driverId,
        reason: "Reservation hold created.",
      },
    });
    return booking;
  });

  let adapter;
  try {
    adapter = getPaymentAdapter();
  } catch {
    await failHold(created.id, "Payment adapter became unavailable.");
    throw new BookingError(503, "not_configured", "Booking cannot be accepted because payment is not configured.");
  }

  let order;
  try {
    order = await adapter.createOrder({
      amountPaise: quote.totalPaise,
      currency: "INR",
      receipt: created.referenceCode,
      notes: { bookingRef: created.publicRef },
    });
  } catch {
    await failHold(created.id, "The payment provider could not create an order.");
    throw new BookingError(502, "not_configured", "The payment provider could not start checkout. The hold was released.");
  }

  const attempt = await prisma.paymentAttempt.create({
    data: {
      bookingId: created.id,
      driverId: input.driverId,
      amountPaise: quote.totalPaise,
      provider: adapter.name,
      providerOrderId: order.providerOrderId,
      checkoutMode: order.checkout.mode,
      idempotencyKey: input.idempotencyKey,
      status: "created",
    },
  });

  if (quote.totalPaise === 0 && adapter.name === "mock") {
    const body = JSON.stringify({
      eventId: `zero_${attempt.id}`,
      type: "payment.captured",
      orderId: order.providerOrderId,
      paymentId: `mock_pay_zero_${attempt.id.slice(0, 10)}`,
      amountPaise: 0,
    });
    await processVerifiedPaymentEvent({
      provider: "mock",
      rawBody: body,
      headers: new Headers({ "x-png-mock-signature": signMockWebhook(body) }),
    });
  }

  return {
    booking: await prisma.booking.findUniqueOrThrow({ where: { id: created.id } }),
    checkout: order.checkout,
    attemptId: attempt.id,
    reused: false as const,
  };
}

export async function markPaymentProcessing(driverId: string, publicRef: string) {
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { publicRef, driverId },
  });
  if (!booking) throw new BookingError(404, "not_found", "That booking was not found.");
  if (booking.status === "pending_payment") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "payment_processing" },
    });
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: "pending_payment",
        toStatus: "payment_processing",
        actorType: "driver",
        actorId: driverId,
        reason: "Returned from checkout; waiting for a verified payment webhook.",
      },
    });
    await prisma.paymentAttempt.updateMany({
      where: { bookingId: booking.id, status: "created" },
      data: { status: "processing" },
    });
  }
  return prisma.booking.findFirstOrThrow({ where: { id: booking.id } });
}

export function hashIdempotency(actorId: string, route: string, key: string, body: unknown): string {
  return createHash("sha256").update(`${actorId}:${route}:${key}:${JSON.stringify(body ?? null)}`).digest("hex");
}

function checkoutFromAttempt(attempt: {
  provider: string;
  providerOrderId: string | null;
  checkoutMode: string;
  amountPaise: number;
}) {
  if (!attempt.providerOrderId) return null;
  return {
    mode: attempt.checkoutMode as "hosted_mock" | "razorpay_checkout",
    provider: attempt.provider as "mock" | "razorpay",
    orderId: attempt.providerOrderId,
    amountPaise: attempt.amountPaise,
    currency: "INR" as const,
    keyId: publicCheckoutKey() ?? undefined,
  };
}

async function failHold(bookingId: string, reason: string) {
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return;
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "payment_failed", holdExpiresAt: null },
    });
    await tx.reservationHold.updateMany({
      where: { bookingId, releasedAt: null },
      data: { releasedAt: new Date() },
    });
    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: booking.status,
        toStatus: "payment_failed",
        actorType: "system",
        reason,
      },
    });
  });
}
