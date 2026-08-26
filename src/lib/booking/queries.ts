import type { BookingStatus, FinancialDocument, PaymentAttempt, Refund } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { BookingError, expireUnpaidHolds } from "./service";

const bookingInclude = {
  station: { select: { name: true, slug: true, city: true, state: true, publicationStatus: true } },
  connector: { select: { publicRef: true, connectorType: true, maxPowerWatts: true } },
  paymentAttempts: { orderBy: { createdAt: "desc" as const } },
  documents: { orderBy: { createdAt: "desc" as const } },
  refunds: { orderBy: { createdAt: "desc" as const } },
  policy: { select: { version: true, supportContactText: true, cancellationAllowed: true } },
  chargingSessions: { select: { publicRef: true, status: true }, orderBy: { createdAt: "desc" as const }, take: 5 },
} as const;

export async function getDriverBooking(driverId: string, publicRef: string) {
  await expireUnpaidHolds();
  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { publicRef, driverId },
    include: bookingInclude,
  });
  if (!booking) throw new BookingError(404, "not_found", "That booking was not found.");
  return booking;
}

export async function listDriverBookings(driverId: string) {
  await expireUnpaidHolds();
  const prisma = getPrisma();
  return prisma.booking.findMany({
    where: { driverId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listDriverPayments(driverId: string) {
  const prisma = getPrisma();
  return prisma.paymentAttempt.findMany({
    where: { driverId },
    include: {
      booking: {
        select: {
          publicRef: true,
          referenceCode: true,
          status: true,
          station: { select: { name: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listDriverDocuments(driverId: string) {
  const prisma = getPrisma();
  return prisma.financialDocument.findMany({
    where: { driverId },
    include: {
      booking: {
        select: {
          publicRef: true,
          referenceCode: true,
          station: { select: { name: true, city: true, state: true } },
          connector: { select: { publicRef: true, connectorType: true } },
          windowStart: true,
          windowEnd: true,
          policyVersion: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getDriverDocument(driverId: string, number: string) {
  const prisma = getPrisma();
  const document = await prisma.financialDocument.findFirst({
    where: { number, driverId },
    include: {
      booking: {
        include: {
          station: { select: { name: true, slug: true, city: true, state: true } },
          connector: { select: { publicRef: true, connectorType: true } },
          paymentAttempts: { where: { status: "succeeded" }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!document) throw new BookingError(404, "not_found", "That document was not found.");
  return document;
}

export async function getStaffBookingByPublicRef(publicRef: string) {
  await expireUnpaidHolds();
  const prisma = getPrisma();
  return prisma.booking.findFirst({
    where: { publicRef },
    include: {
      ...bookingInclude,
      driver: { select: { id: true } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      refunds: { include: { history: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export function driverPaymentView(attempt: PaymentAttempt) {
  return {
    status: attempt.status,
    amountPaise: attempt.amountPaise,
    currency: attempt.currency,
    checkoutMode: attempt.checkoutMode,
    createdAt: attempt.createdAt.toISOString(),
  };
}

export function driverRefundView(refund: Refund) {
  return {
    amountPaise: refund.amountPaise,
    status: refund.status,
    reason: refund.reason,
    createdAt: refund.createdAt.toISOString(),
    pending:
      refund.status !== "completed" && refund.status !== "rejected" && refund.status !== "failed",
  };
}

export function driverDocumentView(document: FinancialDocument) {
  return {
    kind: document.kind,
    status: document.status,
    number: document.number,
    issuedAt: document.issuedAt?.toISOString() ?? null,
    subtotalPaise: document.subtotalPaise,
    gstPaise: document.gstPaise,
    totalPaise: document.totalPaise,
    currency: document.currency,
    breakdown: document.breakdown,
    note: document.note,
  };
}

export function driverBookingView(
  booking: Awaited<ReturnType<typeof getDriverBooking>>,
) {
  const latestPayment = booking.paymentAttempts[0];
  return {
    publicRef: booking.publicRef,
    referenceCode: booking.referenceCode,
    status: booking.status as BookingStatus,
    windowStart: booking.windowStart.toISOString(),
    windowEnd: booking.windowEnd.toISOString(),
    holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
    feePaise: booking.feePaise,
    gstPaise: booking.gstPaise,
    totalPaise: booking.totalPaise,
    currency: booking.currency,
    policyVersion: booking.policyVersion,
    policySnapshot: booking.policySnapshot,
    station: booking.station,
    connector: booking.connector,
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    payment: latestPayment ? driverPaymentView(latestPayment) : null,
    payments: booking.paymentAttempts.map(driverPaymentView),
    refunds: booking.refunds.map(driverRefundView),
    documents: booking.documents.map(driverDocumentView),
    supportContactText: booking.policy.supportContactText,
    cancellationAllowed: booking.policy.cancellationAllowed,
    chargingSessions: booking.chargingSessions.map((row) => ({
      publicRef: row.publicRef,
      status: row.status,
    })),
    waitingForWebhook:
      booking.status === "payment_processing" || booking.status === "pending_payment",
  };
}

export type DriverBookingView = ReturnType<typeof driverBookingView>;

export function statusCopy(status: BookingStatus): { title: string; body: string } {
  switch (status) {
    case "draft":
      return { title: "Draft", body: "This reservation has not been submitted." };
    case "pending_payment":
      return { title: "Pending payment", body: "A short hold is in place until checkout completes. This is not a confirmed booking." };
    case "payment_processing":
      return {
        title: "Payment processing",
        body: "Returned from checkout. Confirmation waits for a verified payment webhook. The browser return is not proof of payment.",
      };
    case "confirmed":
      return {
        title: "Confirmed reservation",
        body: "The booking fee is paid. This is not a charging session and does not keep the connector physically free beyond the reservation policy.",
      };
    case "cancelled":
      return { title: "Cancelled", body: "This reservation was cancelled." };
    case "expired":
      return { title: "Expired", body: "The unpaid hold expired. Capacity was released." };
    case "no_show":
      return { title: "No-show", body: "The reservation was marked no-show under the published policy." };
    case "payment_failed":
      return { title: "Payment failed", body: "The payment did not succeed. This booking is not confirmed." };
    case "refund_pending":
      return {
        title: "Refund pending",
        body: "A refund was requested. It is not complete until the payment provider confirms it.",
      };
    case "refunded":
      return { title: "Refunded", body: "The provider confirmed this refund." };
    case "support_review":
      return { title: "Support review", body: "This booking is with support. It is not a live charging session." };
  }
}
