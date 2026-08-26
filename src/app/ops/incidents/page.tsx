import Link from "next/link";
import { SeverityBadge } from "@/components/ops/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLE_MATRIX, requireStaffRole, roleAllows } from "@/lib/auth/staff";
import { listIncidents } from "@/lib/ops/incidents";
import { CreateIncidentForm, SuggestIncidentsButton } from "@/components/ops/CreateIncidentForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ severity?: string; station?: string; technician?: string; city?: string }>;
};

export default async function OpsIncidentsPage({ searchParams }: PageProps) {
  const actor = requireStaffRole(ROLE_MATRIX.readOps);
  const params = await searchParams;
  const incidents = await listIncidents(actor, {
    severity: params.severity as never,
    stationId: params.station,
    technicianId: params.technician,
    city: params.city,
  });
  const canWrite = roleAllows(actor, ROLE_MATRIX.writeIncidents);

  return (
    <div>
      <h1 className="type-h1">Incidents</h1>
      <p className="type-small">
        Reconnect does not auto-close an incident. Suggest from heartbeat, faults, command failures, meter gaps, and
        repeated support tickets.
      </p>
      {canWrite ? <SuggestIncidentsButton /> : null}
      {canWrite ? <CreateIncidentForm /> : null}
      {incidents.length === 0 ? (
        <EmptyState title="No incidents in this filter" body="An empty queue is not simulated activity." />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {incidents.map((incident) => (
            <li key={incident.id} className="ops-list-card">
              <SeverityBadge severity={incident.severity} />
              <p>
                <Link className="png-link" href={`/ops/incidents/${incident.id}`}>
                  {incident.title}
                </Link>
              </p>
              <p className="type-small">
                {incident.status.replaceAll("_", " ")} · {incident.station.name} · {incident.station.city} · assigned{" "}
                {incident.assignedTechnicianId ?? "none"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
