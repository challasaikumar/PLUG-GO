import type { SupportIssueCategory } from "@prisma/client";
import { BookingError } from "./service";
import { getDriverBooking } from "./queries";
import { getPrisma } from "@/lib/db/prisma";
import { writeDriverAudit } from "@/lib/account/audit";

export const BOOKING_SUPPORT_CATEGORIES = [
  "payment_pending",
  "payment_failed",
  "booking_unavailable",
  "cancellation",
  "refund_status",
  "billing_receipt",
  "general_issue",
] as const;

export type BookingSupportCategory = (typeof BOOKING_SUPPORT_CATEGORIES)[number];

export function isBookingSupportCategory(value: string): value is BookingSupportCategory {
  return (BOOKING_SUPPORT_CATEGORIES as readonly string[]).includes(value);
}

export function bookingSupportLabel(category: BookingSupportCategory): string {
  switch (category) {
    case "payment_pending":
      return "Payment pending";
    case "payment_failed":
      return "Payment failed";
    case "booking_unavailable":
      return "Booking unavailable";
    case "cancellation":
      return "Cancellation";
    case "refund_status":
      return "Refund status";
    case "billing_receipt":
      return "Billing / receipt";
    case "general_issue":
      return "General issue";
  }
}

export async function createBookingSupportTicket(input: {
  driverId: string;
  publicRef: string;
  category: string;
  description: string;
  requestId?: string;
}) {
  if (!isBookingSupportCategory(input.category)) {
    throw new BookingError(400, "validation_error", "Choose a support category.");
  }
  const description = input.description.trim();
  if (description.length < 12) {
    throw new BookingError(400, "validation_error", "Describe the issue in a bit more detail.");
  }
  const booking = await getDriverBooking(input.driverId, input.publicRef);
  const latestPayment = booking.paymentAttempts[0];
  const prisma = getPrisma();
  const ticket = await prisma.supportIssue.create({
    data: {
      publicReference: `PNG-T-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
      stationId: booking.stationId,
      connectorId: booking.connectorId,
      driverId: input.driverId,
      bookingId: booking.id,
      category: input.category as SupportIssueCategory,
      channel: "web_form",
      status: "open",
      description: description.slice(0, 4000),
      paymentState: `${booking.status}/${latestPayment?.status ?? "none"}`,
    },
  });
  await writeDriverAudit({
    driverId: input.driverId,
    action: "support.opened",
    targetType: "support_issue",
    targetId: ticket.id,
    summary: { bookingRef: booking.publicRef, category: input.category },
    requestId: input.requestId,
  });
  return {
    publicReference: ticket.publicReference,
    category: ticket.category,
    paymentState: ticket.paymentState,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
  };
}
