import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeverityBadge } from "@/components/ops/SeverityBadge";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { listTechnicianQueue } from "@/lib/ops/technician";

export const dynamic = "force-dynamic";

export default async function TechnicianHomePage() {
  const actor = requireStaffRole(ROLE_MATRIX.technicianField);
  const queue = await listTechnicianQueue(actor);

  return (
    <div>
      <h1 className="type-h1">Assigned work</h1>
      {queue.length === 0 ? (
        <EmptyState
          title="No assigned work orders"
          body="You only see stations you are assigned to. Checklist items can be tapped pass / fail / N/A — long notes are optional."
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {queue.map((row) => (
            <li key={row.id} className="ops-list-card">
              <SeverityBadge severity={row.incident.severity} />
              <p>
                <Link className="png-link" href={`/technician/incidents/${row.incident.id}`}>
                  {row.incident.title}
                </Link>
              </p>
              <p className="type-small">
                {row.station.name} · {row.station.city} · {row.status.replaceAll("_", " ")}
              </p>
              <p className="type-caption">{row.station.addressLine1}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
