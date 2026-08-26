import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { BookingPolicyForm } from "@/components/admin/BookingPolicyForm";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getAdminStation } from "@/lib/catalogue/station-service";
import { listStationPolicies } from "@/lib/booking/policy";
import { connectorTypeLabel } from "@/lib/catalogue/labels";

export const dynamic = "force-dynamic";

export default async function AdminBookingPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = requireStaffRole([...ROLE_MATRIX.writeBookingPolicy, ...ROLE_MATRIX.approveBookingPolicy]);
  const { id } = await params;
  const station = await getAdminStation(id);
  if (!station) notFound();
  const policies = await listStationPolicies(id);
  const connectors = station.evses.flatMap((evse) =>
    evse.connectors.map((connector) => ({
      id: connector.id,
      label: `${evse.evseLabel} · ${connectorTypeLabel(connector.connectorType)} #${connector.connectorIndex}`,
    })),
  );
  const draft = policies.find((row) => row.approvalStatus === "draft") ?? null;
  const canApprove = actor.role === "finance" || actor.role === "super_admin";

  return (
    <div className="container-png" style={{ padding: "32px 0 80px", maxWidth: 760 }}>
      <p className="type-caption">
        <Link className="png-link" href={`/admin/stations/${station.id}`}>
          Back to station
        </Link>
      </p>
      <h1 className="type-h1">Booking policy · {station.name}</h1>
      <AdminIdentity actor={actor} />
      <Alert variant="warning" title="Honour or do not offer">
        Website booking stays off unless this policy is approved, currently effective, names eligible connectors, and
        payment is configured. An empty connector list means nothing can be reserved.
      </Alert>
      <BookingPolicyForm
        stationId={station.id}
        connectors={connectors}
        draft={
          draft
            ? {
                ...draft,
                effectiveFrom: draft.effectiveFrom.toISOString(),
                effectiveTo: draft.effectiveTo?.toISOString() ?? null,
              }
            : null
        }
        canApprove={canApprove}
      />
      <section style={{ marginTop: 32 }}>
        <h2 className="type-h2">Versions</h2>
        {policies.length === 0 ? (
          <p className="type-small">No policies yet.</p>
        ) : (
          <ul className="type-small">
            {policies.map((policy) => (
              <li key={policy.id}>
                v{policy.version} · {policy.approvalStatus} · enabled {String(policy.bookingEnabled)} ·{" "}
                {policy.eligibleConnectorIds.length} connector(s)
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
