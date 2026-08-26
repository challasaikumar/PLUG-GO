import Link from "next/link";
import { SignOutButton } from "@/components/account/SignOutButton";
import { getPrisma } from "@/lib/db/prisma";
import { requireDriverPage } from "@/lib/auth/driver";
import { maskE164 } from "@/lib/auth/phone";
import { pageMeta } from "@/lib/metadata";
import { listDriverSessions } from "@/lib/ocpp/queries";

export const metadata = pageMeta({
  title: "Account",
  description: "Your Plug and Go driver account.",
  path: "/account",
  index: false,
});

export default async function AccountPage() {
  const driver = await requireDriverPage("/account");
  const prisma = getPrisma();
  const [vehicleCount, savedCount, sessions] = await Promise.all([
    prisma.driverVehicle.count({ where: { driverId: driver.id } }),
    prisma.savedStation.count({ where: { driverId: driver.id } }),
    listDriverSessions(driver.id),
  ]);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Account
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        Signed in as {maskE164(driver.phoneE164)}. This account stores vehicle preferences, saved stations, reservations,
        and any charging sessions you start here. Energy invoices are not issued from a remote-command response.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
        <li className="paper-card" style={{ padding: 20 }}>
          <p className="type-caption" style={{ margin: "0 0 4px" }}>
            Saved vehicles
          </p>
          <p className="type-h2" style={{ margin: 0 }}>
            {vehicleCount}
          </p>
          <Link className="png-link type-small" href="/vehicles" style={{ display: "inline-block", marginTop: 8 }}>
            Manage vehicles
          </Link>
        </li>
        <li className="paper-card" style={{ padding: 20 }}>
          <p className="type-caption" style={{ margin: "0 0 4px" }}>
            Saved stations
          </p>
          <p className="type-h2" style={{ margin: 0 }}>
            {savedCount}
          </p>
          <Link className="png-link type-small" href="/saved-stations" style={{ display: "inline-block", marginTop: 8 }}>
            View saved stations
          </Link>
        </li>
        <li className="paper-card" style={{ padding: 20 }}>
          <p className="type-caption" style={{ margin: "0 0 4px" }}>
            Reservations
          </p>
          <Link className="png-link type-small" href="/bookings" style={{ display: "inline-block" }}>
            Bookings
          </Link>
          {" · "}
          <Link className="png-link type-small" href="/payments">
            Payments
          </Link>
          {" · "}
          <Link className="png-link type-small" href="/invoices">
            Receipts
          </Link>
        </li>
        <li className="paper-card" style={{ padding: 20 }}>
          <p className="type-caption" style={{ margin: "0 0 4px" }}>
            Charging sessions
          </p>
          {sessions.length === 0 ? (
            <p className="type-small">No charging sessions yet. Pilot remote start is shown only on authorised stations.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
              {sessions.map((session) => (
                <li key={session.publicRef}>
                  <Link className="png-link type-small" href={`/session/${encodeURIComponent(session.publicRef)}`}>
                    {session.station.name} · {session.status.replaceAll("_", " ")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
      <p style={{ margin: "24px 0" }}>
        <Link className="png-link" href="/account/privacy">
          Privacy centre
        </Link>
      </p>
      <SignOutButton />
    </div>
  );
}
