import Link from "next/link";
import { notFound } from "next/navigation";
import { TechnicianWorkPanel } from "@/components/ops/TechnicianWorkPanel";
import { SeverityBadge } from "@/components/ops/SeverityBadge";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { OpsError } from "@/lib/ops/roles";
import { getIncidentForTechnician } from "@/lib/ops/technician";

export const dynamic = "force-dynamic";

export default async function TechnicianIncidentPage({
  params,
}: {
  params: Promise<{ "incident-id": string }>;
}) {
  const actor = requireStaffRole(ROLE_MATRIX.technicianField);
  const { "incident-id": incidentId } = await params;
  let incident;
  try {
    incident = await getIncidentForTechnician(actor, incidentId);
  } catch (error) {
    if (error instanceof OpsError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
  const work = incident.workOrders.find((row) => row.assignedActorId === actor.id) ?? incident.workOrders[0];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Link className="png-link" href="/technician">
        Assigned work
      </Link>
      <h1 className="type-h1">{incident.title}</h1>
      <SeverityBadge severity={incident.severity} />
      <p className="type-small">
        {incident.station.name} · {incident.station.addressLine1}
        {incident.station.landmark ? ` · ${incident.station.landmark}` : ""}
      </p>
      <p className="type-small">Arrival: {incident.station.arrivalInstructions ?? "Not recorded"}</p>
      <p className="type-small">Safety: {incident.station.emergencyInstructions ?? "Not recorded"}</p>
      <p className="type-caption">
        Connector {incident.connector?.publicRef ?? "n/a"} · {incident.connector?.connectorType ?? ""}
      </p>
      {work ? (
        <TechnicianWorkPanel
          workOrderId={work.id}
          status={work.status}
          checklist={work.checklist}
          evidenceCount={work.evidence.length}
        />
      ) : (
        <p className="type-small">No work order yet. Ask operations to assign you.</p>
      )}
    </div>
  );
}
