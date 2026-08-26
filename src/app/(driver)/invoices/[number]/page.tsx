import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/booking/PrintButton";
import { BookingActions } from "@/components/booking/BookingActions";
import { Alert } from "@/components/ui/Alert";
import { requireDriverPage } from "@/lib/auth/driver";
import { driverDocumentView, getDriverDocument } from "@/lib/booking/queries";
import { BookingError } from "@/lib/booking/service";
import { formatInrFromPaise } from "@/lib/tariff/format";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ number: string }> };

export const metadata = pageMeta({
  title: "Receipt",
  description: "A Plug and Go booking receipt or invoice placeholder.",
  path: "/invoices",
  index: false,
});

export default async function InvoiceDetailPage({ params }: PageProps) {
  const driver = await requireDriverPage("/invoices");
  const { number } = await params;
  let document;
  try {
    document = await getDriverDocument(driver.id, decodeURIComponent(number));
  } catch (error) {
    if (error instanceof BookingError && error.status === 404) notFound();
    throw error;
  }
  const view = driverDocumentView(document);
  const isReceipt = view.kind === "booking_receipt";

  return (
    <article className="container-png" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <p className="type-caption no-print">
        <Link className="png-link" href="/invoices">
          All receipts
        </Link>
      </p>
      <h1 className="type-h1">{isReceipt ? "Booking receipt" : "Charging invoice placeholder"}</h1>
      <Alert variant={isReceipt ? "info" : "warning"} title={isReceipt ? "Not a charging invoice" : "Not issuable yet"}>
        {view.note}
      </Alert>
      <dl className="type-body" style={{ marginTop: 24 }}>
        <div>
          <dt>Number</dt>
          <dd className="font-mono">{view.number}</dd>
        </div>
        <div>
          <dt>Booking</dt>
          <dd className="font-mono">{document.booking.referenceCode}</dd>
        </div>
        <div>
          <dt>Station</dt>
          <dd>
            {document.booking.station.name}, {document.booking.station.city}
          </dd>
        </div>
        <div>
          <dt>Connector</dt>
          <dd className="font-mono">{document.booking.connector.publicRef}</dd>
        </div>
        <div>
          <dt>Booking window</dt>
          <dd>
            {new Date(document.booking.windowStart).toLocaleString("en-IN")} –{" "}
            {new Date(document.booking.windowEnd).toLocaleString("en-IN")}
          </dd>
        </div>
        <div>
          <dt>Policy version</dt>
          <dd>{document.booking.policyVersion}</dd>
        </div>
        <div>
          <dt>Subtotal</dt>
          <dd className="font-mono">{formatInrFromPaise(view.subtotalPaise)}</dd>
        </div>
        <div>
          <dt>GST</dt>
          <dd className="font-mono">{formatInrFromPaise(view.gstPaise)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="font-mono">{formatInrFromPaise(view.totalPaise)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{view.status.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Receipt date</dt>
          <dd>{view.issuedAt ? new Date(view.issuedAt).toLocaleString("en-IN") : "Not issued"}</dd>
        </div>
      </dl>
      <p className="no-print" style={{ marginTop: 24 }}>
        <PrintButton />
      </p>
      <p className="no-print">
        <Link className="png-link" href={`/bookings/${document.booking.publicRef}`}>
          Open booking
        </Link>
      </p>
      <div className="no-print">
        <BookingActions publicRef={document.booking.publicRef} canCancel={false} waitingForWebhook={false} />
      </div>
    </article>
  );
}
