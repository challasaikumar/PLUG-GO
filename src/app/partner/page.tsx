import { EmptyState } from "@/components/ui/EmptyState";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { getHostPortal } from "@/lib/ops/partner";

export const dynamic = "force-dynamic";

export default async function PartnerHomePage() {
  const actor = requireStaffRole(ROLE_MATRIX.readHostPortal);
  const portal = await getHostPortal(actor);

  return (
    <div>
      <h1 className="type-h1">Your locations</h1>
      <DataFreshness label={`Generated ${portal.generatedAt}`} />
      <p className="type-small">{portal.privacy}</p>
      <p className="type-small">{portal.revenueNote}</p>
      {portal.hosts.length === 0 ? (
        <EmptyState title="No host membership" body={portal.note ?? "Ask Plug and Go to assign this actor to a host."} />
      ) : (
        portal.hosts.map((host) => (
          <section key={host.id} style={{ marginTop: 24 }}>
            <h2 className="type-h2">{host.hostDisplayName}</h2>
            <p className="type-caption">Contract {host.contractStatus}</p>
            {host.stations.length === 0 ? (
              <EmptyState title="No stations" body="This host has no catalogue stations yet." />
            ) : (
              host.stations.map((station) => (
                <article key={station.id} className="ops-list-card">
                  <h3 className="type-h3">{station.name}</h3>
                  <p className="type-small">
                    {station.city} · {station.availableCount}/{station.connectorCount} available (freshness still
                    applies) · {station.openIncidents} open incidents · {station.confirmedBookingCount} confirmed
                    bookings
                  </p>
                  <p className="type-caption">
                    Documents and site contacts: use the host contract contact. Need help? Public /support is for
                    drivers; hosts should contact Plug and Go operations.
                  </p>
                </article>
              ))
            )}
          </section>
        ))
      )}
    </div>
  );
}
