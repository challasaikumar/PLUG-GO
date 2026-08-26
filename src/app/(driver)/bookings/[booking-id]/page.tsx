import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { BookingActions } from "@/components/booking/BookingActions";
import { requireDriverPage } from "@/lib/auth/driver";
import { driverBookingView, getDriverBooking, statusCopy } from "@/lib/booking/queries";
import { BookingError } from "@/lib/booking/service";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { formatInrFromPaise } from "@/lib/tariff/format";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ "booking-id": string }> };

export const metadata = pageMeta({
  title: "Booking",
  description: "Your Plug and Go reservation.",
  path: "/bookings",
  index: false,
});

export default async function BookingDetailPage({ params }: PageProps) {
  const driver = await requireDriverPage("/bookings");
  const { "booking-id": publicRef } = await params;
  let booking;
  try {
    booking = driverBookingView(await getDriverBooking(driver.id, publicRef));
  } catch (error) {
    if (error instanceof BookingError && error.status === 404) notFound();
    throw error;
  }
  const copy = statusCopy(booking.status);
  const receipt = booking.documents.find((row) => row.kind === "booking_receipt");
  const invoice = booking.documents.find((row) => row.kind === "charging_invoice_placeholder");
  const canCancel =
    booking.status === "confirmed" ||
    booking.status === "pending_payment" ||
    booking.status === "payment_processing";

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <p className="type-caption">
        <Link className="png-link" href="/bookings">
          All bookings
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        {copy.title}
      </h1>
      <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
        {copy.body}
      </p>
      <dl className="type-body" style={{ marginTop: 24 }}>
        <div>
          <dt>Reference</dt>
          <dd className="font-mono">{booking.referenceCode}</dd>
        </div>
        <div>
          <dt>Station</dt>
          <dd>
            {booking.station.name}, {booking.station.city}
          </dd>
        </div>
        <div>
          <dt>Connector</dt>
          <dd>
            {connectorTypeLabel(booking.connector.connectorType)} · {booking.connector.publicRef}
          </dd>
        </div>
        <div>
          <dt>Window</dt>
          <dd>
            {new Date(booking.windowStart).toLocaleString("en-IN")} –{" "}
            {new Date(booking.windowEnd).toLocaleString("en-IN")}
          </dd>
        </div>
        <div>
          <dt>Policy version</dt>
          <dd>{booking.policyVersion}</dd>
        </div>
        <div>
          <dt>Reservation fee</dt>
          <dd className="font-mono">{formatInrFromPaise(booking.feePaise)}</dd>
        </div>
        <div>
          <dt>GST</dt>
          <dd className="font-mono">{formatInrFromPaise(booking.gstPaise)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="font-mono">{formatInrFromPaise(booking.totalPaise)}</dd>
        </div>
        <div>
          <dt>Payment status</dt>
          <dd>{booking.payment?.status ?? "none"}</dd>
        </div>
      </dl>
      {booking.refunds.map((refund) => (
        <Alert
          key={`${refund.createdAt}-${refund.amountPaise}`}
          variant={refund.status === "completed" ? "success" : "warning"}
          title={refund.status === "completed" ? "Refund completed" : "Refund pending"}
        >
          {formatInrFromPaise(refund.amountPaise)}. Status: {refund.status.replaceAll("_", " ")}.
          {refund.pending ? " This is not a completed refund." : ""}
        </Alert>
      ))}
      {receipt ? (
        <p>
          <Link className="png-link" href={`/invoices/${encodeURIComponent(receipt.number)}`}>
            Booking receipt {receipt.number}
          </Link>
        </p>
      ) : null}
      {invoice ? (
        <Alert variant="info" title="Charging invoice not issued">
          Placeholder {invoice.number}. A final energy invoice waits for approved session settlement, not a remote-command
          response.
        </Alert>
      ) : null}
      {booking.chargingSessions.length > 0 ? (
        <p>
          Linked sessions:{" "}
          {booking.chargingSessions.map((row, index) => (
            <span key={row.publicRef}>
              {index > 0 ? " · " : ""}
              <Link className="png-link" href={`/session/${encodeURIComponent(row.publicRef)}`}>
                {row.status.replaceAll("_", " ")}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
      <p className="type-small">{booking.supportContactText}</p>
      <BookingActions
        publicRef={booking.publicRef}
        canCancel={canCancel}
        waitingForWebhook={booking.waitingForWebhook}
      />
    </div>
  );
}
