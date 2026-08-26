import Link from "next/link";
import { requireDriverPage } from "@/lib/auth/driver";
import { driverPaymentView, listDriverPayments } from "@/lib/booking/queries";
import { formatInrFromPaise } from "@/lib/tariff/format";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Payments",
  description: "Your Plug and Go reservation payments.",
  path: "/payments",
  index: false,
});

export default async function PaymentsPage() {
  const driver = await requireDriverPage("/payments");
  const rows = await listDriverPayments(driver.id);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Payments
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        Reservation-fee payment attempts only. Browser checkout return is not proof of success. Provider identifiers are
        not shown here.
      </p>
      {rows.length === 0 ? (
        <p className="type-body">No payment attempts yet.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {rows.map((row) => {
            const view = driverPaymentView(row);
            return (
              <li key={`${row.booking.publicRef}-${view.createdAt}`} className="paper-card" style={{ padding: 20 }}>
                <p className="type-caption">{row.booking.referenceCode}</p>
                <p className="type-h3" style={{ margin: "4px 0" }}>
                  {row.booking.station.name}
                </p>
                <p className="type-small">
                  {view.status.replaceAll("_", " ")} · {formatInrFromPaise(view.amountPaise)}
                </p>
                <Link className="png-link type-small" href={`/bookings/${row.booking.publicRef}`}>
                  Open booking
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
