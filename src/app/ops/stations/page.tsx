import Link from "next/link";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { listOpsStations } from "@/lib/ops/stations";
import { computePublicStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ city?: string; q?: string; host?: string }> };

export default async function OpsStationsPage({ searchParams }: PageProps) {
  const actor = requireStaffRole(ROLE_MATRIX.readOpsStations);
  const params = await searchParams;
  const stations = await listOpsStations(actor, params);

  return (
    <div>
      <h1 className="type-h1">Stations</h1>
      <form className="ops-filters" method="get" style={{ margin: "0 0 24px" }}>
        <label className="field-label" htmlFor="q">
          Search
          <input className="field-control" id="q" name="q" defaultValue={params.q} />
        </label>
        <label className="field-label" htmlFor="city">
          City
          <input className="field-control" id="city" name="city" defaultValue={params.city} />
        </label>
        <button className="png-btn png-btn--primary png-btn--sm" type="submit">
          Filter
        </button>
      </form>
      {stations.length === 0 ? (
        <EmptyState title="No operational stations in scope" body="This list is scoped to your assignments. It is not the public finder." />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {stations.map((station) => {
            const statuses = station.connectors.map((connector) =>
              computePublicStatus({
                recordedStatus: connector.currentStatus?.recordedStatus ?? null,
                statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
                overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
              }).publicStatus,
            );
            return (
              <li key={station.id} className="ops-list-card">
                <Link className="png-link" href={`/ops/stations/${station.id}`}>
                  {station.name}
                </Link>
                <p className="type-small">
                  {station.city} · {station.host.hostDisplayName} · {station._count.incidents} incidents
                </p>
                <div className="ops-actions">
                  {statuses.slice(0, 4).map((status, index) => (
                    <AvailabilityChip key={`${station.id}-${index}`} status={status} />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
