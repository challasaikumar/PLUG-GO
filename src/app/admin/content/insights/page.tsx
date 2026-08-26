import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listAdminInsights } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  const actor = requireStaffRole(ROLE_MATRIX.readCatalogue);
  const articles = await listAdminInsights();

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin">
          Catalogue
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        Insights
      </h1>
      <AdminIdentity actor={actor} />
      <p className="type-body" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
        Draft templates stay unpublished. Demo rows cannot be published.
      </p>
      <Button href="/admin/content/insights/new" size="sm">
        Create article
      </Button>
      {articles.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <EmptyState title="No articles" body="Write a reviewed piece. Do not publish placeholders." />
        </div>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 24 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Demo</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link className="png-link" href={`/admin/content/insights/${article.id}`}>
                      {article.title}
                    </Link>
                  </td>
                  <td className="font-mono">{article.slug}</td>
                  <td>{article.publicationStatus}</td>
                  <td>{article.isDemo ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
