import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { getStaffBookingByPublicRef } from "@/lib/booking/queries";
import { getPrisma } from "@/lib/db/prisma";
import { staffInitiateRefund, staffSendPendingRefund } from "@/lib/payments/refunds";
import { OpsError } from "./roles";
import { resolveOpsScope } from "./scope";

export async function listFinanceExceptions(actor: StaffActor) {
  if (!roleAllows(actor, ROLE_MATRIX.readFinanceOps)) {
    throw new OpsError(403, "staff_forbidden", "Finance workspace is limited to authorised finance roles.");
  }
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  const stationFilter = scope.stationIds === "all" ? undefined : { stationId: { in: scope.stationIds } };
  const [refunds, failedPayments, receipts] = await Promise.all([
    prisma.refund.findMany({
      where: {
        status: { in: ["requested", "pending_review", "pending_provider", "failed"] },
        booking: stationFilter,
      },
      include: {
        booking: { select: { publicRef: true, referenceCode: true, stationId: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.paymentAttempt.findMany({
      where: {
        status: { in: ["failed", "cancelled"] },
        booking: stationFilter,
      },
      include: { booking: { select: { publicRef: true, stationId: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.financialDocument.findMany({
      where: {
        kind: "booking_receipt",
        booking: stationFilter,
      },
      include: { booking: { select: { publicRef: true, stationId: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    refunds: refunds.map((row) => ({
      id: row.id,
      amountPaise: row.amountPaise,
      status: row.status,
      reason: row.reason,
      bookingRef: row.booking.publicRef,
      createdAt: row.createdAt.toISOString(),
    })),
    failedPayments: failedPayments.map((row) => ({
      id: row.id,
      status: row.status,
      amountPaise: row.amountPaise,
      bookingRef: row.booking.publicRef,
      createdAt: row.createdAt.toISOString(),
    })),
    receipts: receipts.map((row) => ({
      number: row.number,
      status: row.status,
      totalPaise: row.totalPaise,
      bookingRef: row.booking.publicRef,
      note: "Charging session invoices remain not issuable until a metered session exists.",
    })),
  };
}

export async function lookupFinanceBooking(actor: StaffActor, publicRef: string) {
  if (!roleAllows(actor, ROLE_MATRIX.readFinanceOps)) {
    throw new OpsError(403, "staff_forbidden", "Finance workspace is limited to authorised finance roles.");
  }
  const booking = await getStaffBookingByPublicRef(publicRef);
  if (!booking) throw new OpsError(404, "not_found", "That booking was not found.");
  const scope = await resolveOpsScope(actor);
  if (scope.stationIds !== "all" && !scope.stationIds.includes(booking.stationId)) {
    throw new OpsError(403, "staff_forbidden", "That booking is outside this finance scope.");
  }
  return booking;
}

export async function opsInitiateRefund(
  actor: StaffActor,
  input: { bookingPublicRef: string; amountPaise: number; reason: string; requestId?: string },
) {
  if (!roleAllows(actor, ROLE_MATRIX.initiateRefund)) {
    throw new OpsError(403, "staff_forbidden", "Only finance can initiate refunds.");
  }
  await lookupFinanceBooking(actor, input.bookingPublicRef);
  return staffInitiateRefund({
    actor,
    bookingPublicRef: input.bookingPublicRef,
    amountPaise: input.amountPaise,
    reason: input.reason,
    requestId: input.requestId,
  });
}

export async function opsSendRefund(actor: StaffActor, refundId: string, requestId?: string) {
  if (!roleAllows(actor, ROLE_MATRIX.initiateRefund)) {
    throw new OpsError(403, "staff_forbidden", "Only finance can send refunds to the provider.");
  }
  const prisma = getPrisma();
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { booking: true },
  });
  if (!refund) throw new OpsError(404, "not_found", "That refund was not found.");
  const scope = await resolveOpsScope(actor);
  if (scope.stationIds !== "all" && !scope.stationIds.includes(refund.booking.stationId)) {
    throw new OpsError(403, "staff_forbidden", "That refund is outside this finance scope.");
  }
  return staffSendPendingRefund({ actor, refundId, requestId });
}
