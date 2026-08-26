import Link from "next/link";
import { notFound } from "next/navigation";
import { IncidentActions } from "@/components/ops/IncidentActions";
import { TechnicianWorkPanel } from "@/components/ops/TechnicianWorkPanel";
import { SeverityBadge } from "@/components/ops/SeverityBadge";
import { ROLE_MATRIX, requireStaffRole, roleAllows } from "@/lib/auth/staff";
import { getIncident } from "@/lib/ops/incidents";
import { OpsError } from "@/lib/ops/roles";

export const dynamic = "force-dynamic";

export default async function OpsIncidentDetailPage({
  params,
}: {
  params: Promise<{ "incident-id": string }>;
}) {
  const actor = requireStaffRole(ROLE_MATRIX.readOps);
  const { "incident-id": incidentId } = await params;
  let incident;
  try {
    incident = await getIncident(actor, incidentId);
  } catch (error) {
    if (error instanceof OpsError && error.status === 404) notFound();
    throw error;
  }
  const work = incident.workOrders[0];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <p className="type-caption">
        <Link className="png-link" href="/ops/incidents">
          Incidents
        </Link>
      </p>
      <h1 className="type-h1">{incident.title}</h1>
      <SeverityBadge severity={incident.severity} />
      <p className="type-small">
        {incident.status.replaceAll("_", " ")} · {incident.station.name} · customer status:{" "}
        {incident.customerVisibleStatus ?? "none"}
      </p>
      <p className="type-body">{incident.summary}</p>
      <IncidentActions
        incidentId={incident.id}
        canAssign={roleAllows(actor, ROLE_MATRIX.assignTechnician)}
        canVerify={roleAllows(actor, ROLE_MATRIX.verifyIncident)}
        canWrite={roleAllows(actor, ROLE_MATRIX.writeIncidents)}
      />
      {work && (actor.role === "technician" || actor.role === "super_admin") ? (
        <TechnicianWorkPanel
          workOrderId={work.id}
          status={work.status}
          checklist={work.checklist}
          evidenceCount={work.evidence.length}
        />
      ) : null}
      <h2 className="type-h2">Timeline</h2>
      <ol style={{ paddingLeft: 20 }}>
        {incident.events.map((event) => (
          <li key={event.id} className="type-small">
            {event.createdAt.toISOString()} · {event.kind.replaceAll("_", " ")}
            {event.toStatus ? ` → ${event.toStatus}` : ""} · {event.customerVisible ? "customer-visible" : "internal"}
            {event.body ? ` — ${event.body}` : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
