import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listAdminRoutes } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function AdminRoutesPage() {
  const actor = requireStaffRole(ROLE_MATRIX.readCatalogue);
  const routes = await listAdminRoutes();

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin">
          Catalogue
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        Route guides
      </h1>
      <AdminIdentity actor={actor} />
      <p className="type-body" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
        Do not auto-generate city combinations. Publish only a researched plan with real published stops.
      </p>
      <Button href="/admin/content/routes/new" size="sm">
        Create route guide
      </Button>
      {routes.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <EmptyState title="No route guides" body="Write a usable charging plan before publishing a route URL." />
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 24 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Demo</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  <td>
                    <Link className="png-link" href={`/admin/content/routes/${route.id}`}>
                      {route.originName} to {route.destinationName}
                    </Link>
                  </td>
                  <td className="font-mono">{route.slug}</td>
                  <td>{route.publicationStatus}</td>
                  <td>{route.isDemo ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
