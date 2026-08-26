import Link from "next/link";
import { requireDriverPage } from "@/lib/auth/driver";
import { driverBookingView, listDriverBookings, statusCopy } from "@/lib/booking/queries";
import { formatInrFromPaise } from "@/lib/tariff/format";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Bookings",
  description: "Your Plug and Go connector reservations.",
  path: "/bookings",
  index: false,
});

export default async function BookingsPage() {
  const driver = await requireDriverPage("/bookings");
  const bookings = (await listDriverBookings(driver.id)).map(driverBookingView);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Bookings
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        Reservations created on this website. A confirmed booking is not a charging session and does not bill energy.
      </p>
      {bookings.length === 0 ? (
        <p className="type-body">You have no bookings yet. Website booking appears only on stations that can honour it.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {bookings.map((booking) => {
            const copy = statusCopy(booking.status);
            return (
              <li key={booking.publicRef} className="paper-card" style={{ padding: 20 }}>
                <p className="type-caption">{booking.referenceCode}</p>
                <p className="type-h3" style={{ margin: "4px 0" }}>
                  {booking.station.name}
                </p>
                <p className="type-small">
                  {copy.title}. {formatInrFromPaise(booking.totalPaise)}.
                </p>
                <Link className="png-link type-small" href={`/bookings/${booking.publicRef}`}>
                  View booking
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
