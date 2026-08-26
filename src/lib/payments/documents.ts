import type { Prisma } from "@prisma/client";
import { invoicePrefix, receiptPrefix } from "./config";

const RECEIPT_NOTE =
  "This is a booking/payment receipt for a reservation fee. It is not a final energy-consumption tax invoice.";
const INVOICE_NOTE =
  "A charging invoice can be issued only after a future OCPP session confirms actual energy use. This placeholder is not payable and is not a GST tax invoice for electricity.";

export async function issueBookingReceipts(tx: Prisma.TransactionClient, bookingId: string) {
  const booking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  const existingReceipt = await tx.financialDocument.findFirst({
    where: { bookingId, kind: "booking_receipt" },
  });
  if (!existingReceipt) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    await tx.financialDocument.create({
      data: {
        bookingId,
        driverId: booking.driverId,
        kind: "booking_receipt",
        status: "issued",
        number: `${receiptPrefix()}-${stamp}-${booking.referenceCode.slice(-6)}`,
        issuedAt: new Date(),
        subtotalPaise: booking.feePaise,
        gstPaise: booking.gstPaise,
        totalPaise: booking.totalPaise,
        breakdown: {
          lines: [
            { code: "reservation", label: "Reservation fee", amountPaise: booking.feePaise },
            { code: "gst", label: "GST", amountPaise: booking.gstPaise },
          ],
          policyVersion: booking.policyVersion,
        },
        note: RECEIPT_NOTE,
      },
    });
  }

  const existingInvoice = await tx.financialDocument.findFirst({
    where: { bookingId, kind: "charging_invoice_placeholder" },
  });
  if (!existingInvoice) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    await tx.financialDocument.create({
      data: {
        bookingId,
        driverId: booking.driverId,
        kind: "charging_invoice_placeholder",
        status: "not_issuable_until_session",
        number: `${invoicePrefix()}-HOLD-${stamp}-${booking.referenceCode.slice(-6)}`,
        issuedAt: null,
        subtotalPaise: 0,
        gstPaise: 0,
        totalPaise: 0,
        breakdown: {
          energyKwh: null,
          sessionId: null,
          reason: "No OCPP charging session exists in this phase.",
        },
        note: INVOICE_NOTE,
      },
    });
  }
}
