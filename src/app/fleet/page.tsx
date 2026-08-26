import { EmptyState } from "@/components/ui/EmptyState";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { getFleetPortal } from "@/lib/ops/fleet";

export const dynamic = "force-dynamic";

export default async function FleetHomePage() {
  const actor = requireStaffRole(ROLE_MATRIX.readFleetPortal);
  const portal = await getFleetPortal(actor);

  return (
    <div>
      <h1 className="type-h1">Fleet activity</h1>
      <DataFreshness label={`Generated ${portal.generatedAt}`} />
      <p className="type-small">{portal.privacy}</p>
      <p className="type-small">{portal.deferred}</p>
      {portal.fleets.length === 0 ? (
        <EmptyState title="No fleet membership" body={portal.note ?? "Ask Plug and Go to assign this actor to a fleet organisation."} />
      ) : (
        portal.fleets.map((fleet) => (
          <section key={fleet.id} className="ops-list-card" style={{ marginTop: 16 }}>
            <h2 className="type-h2">{fleet.name}</h2>
            <p className="type-small">
              Cost centres: {fleet.costCentres.map((row) => `${row.code} ${row.name}`).join(", ") || "none"}
            </p>
            <p className="type-small">
              Vehicles: {fleet.vehicles.map((row) => row.label).join(", ") || "none"}
            </p>
            <p className="type-small">
              Approved driver refs: {fleet.drivers.map((row) => row.label).join(", ") || "none"}
            </p>
            <p className="type-small">
              Sessions: {fleet.chargingByStatus.map((row) => `${row.status} ${row.count}`).join(" · ") || "none"}
            </p>
            <p className="type-small">Bookings: {fleet.bookingCount}</p>
            <p className="type-small">
              Invoice/receipt references:{" "}
              {fleet.invoiceReferences.map((row) => `${row.number} (${row.kind})`).join(", ") || "none"}
            </p>
            <p className="type-caption">Support path: drivers use /support. Fleet admins contact Plug and Go operations.</p>
          </section>
        ))
      )}
    </div>
  );
}
