import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listAdminCities } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const actor = requireStaffRole(ROLE_MATRIX.readCatalogue);
  const cities = await listAdminCities();

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin">
          Catalogue
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        City landing pages
      </h1>
      <AdminIdentity actor={actor} />
      <p className="type-body" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
        Publish only when unique reviewed guidance exists and the city has at least one published station. Arbitrary URL
        text does not create a public page.
      </p>
      <Button href="/admin/content/cities/new" size="sm">
        Create city page
      </Button>
      {cities.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <EmptyState title="No city pages" body="Do not mass-generate city URLs. Write unique local guidance first." />
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 24 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Demo</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id}>
                  <td>
                    <Link className="png-link" href={`/admin/content/cities/${city.id}`}>
                      {city.cityName}
                    </Link>
                  </td>
                  <td className="font-mono">{city.slug}</td>
                  <td>{city.publicationStatus}</td>
                  <td>{city.isDemo ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
