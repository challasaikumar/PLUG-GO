import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listAdminStations } from "@/lib/catalogue/station-service";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const actor = requireStaffRole(ROLE_MATRIX.readCatalogue);
  const stations = await listAdminStations({});

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <h1 className="type-h1" style={{ margin: "24px 0 8px" }}>
        Station catalogue
      </h1>
      <AdminIdentity actor={actor} />
      <p className="type-body" style={{ margin: "0 0 24px", maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
        Draft, pending approval, published, and archived records. Demo seed rows stay Draft and never appear on public
        APIs.
      </p>
      <nav aria-label="Editorial" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <Link className="png-link" href="/admin/content/cities">
          City pages
        </Link>
        <Link className="png-link" href="/admin/content/insights">
          Insights
        </Link>
        <Link className="png-link" href="/admin/content/routes">
          Route guides
        </Link>
        <Link className="png-link" href="/admin/content/authors">
          Authors
        </Link>
        <Link className="png-link" href="/admin/finance">
          Finance desk
        </Link>
        <Link className="png-link" href="/ops">
          Operations
        </Link>
      </nav>
      <Button href="/admin/stations/new" size="sm">
        Create station
      </Button>
      {stations.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <EmptyState
            title="No station records"
            body="Create an organisation and host first if needed, then add a draft station. Do not invent live inventory."
          />
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 24 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>State</th>
                <th>Status</th>
                <th>Demo</th>
                <th>Connectors</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id}>
                  <td>
                    <Link className="png-link" href={`/admin/stations/${station.id}`}>
                      {station.name}
                    </Link>
                  </td>
                  <td>{station.city}</td>
                  <td>{station.state}</td>
                  <td>{station.publicationStatus}</td>
                  <td>{station.isDemo ? "Yes" : "No"}</td>
                  <td>{station._count.connectors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
