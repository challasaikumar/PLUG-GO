import Link from "next/link";
import { requireDriverPage } from "@/lib/auth/driver";
import { driverDocumentView, listDriverDocuments } from "@/lib/booking/queries";
import { formatInrFromPaise } from "@/lib/tariff/format";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Invoices and receipts",
  description: "Booking receipts and future charging invoice placeholders.",
  path: "/invoices",
  index: false,
});

export default async function InvoicesPage() {
  const driver = await requireDriverPage("/invoices");
  const rows = await listDriverDocuments(driver.id);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Receipts and invoices
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        Booking receipts are issued after a verified payment. Charging invoices stay placeholders until a future OCPP
        session confirms energy use.
      </p>
      {rows.length === 0 ? (
        <p className="type-body">No receipts yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {rows.map((row) => {
            const view = driverDocumentView(row);
            return (
              <li key={view.number} className="paper-card" style={{ padding: 20 }}>
                <p className="type-caption">
                  {view.kind === "booking_receipt" ? "Booking receipt" : "Charging invoice placeholder"}
                </p>
                <p className="type-h3" style={{ margin: "4px 0" }}>
                  {view.number}
                </p>
                <p className="type-small">
                  {row.booking.station.name} · {formatInrFromPaise(view.totalPaise)} · {view.status.replaceAll("_", " ")}
                </p>
                <Link className="png-link type-small" href={`/invoices/${encodeURIComponent(view.number)}`}>
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
