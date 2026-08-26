import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { InsightContentForm } from "@/components/admin/ContentForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getAdminInsight, listAdminAuthors } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function EditInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = requireStaffRole(ROLE_MATRIX.writeEditorial);
  const { id } = await params;
  const [article, authors] = await Promise.all([getAdminInsight(id), listAdminAuthors()]);
  if (!article) notFound();

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin/content/insights">
          Insights
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        {article.title}
      </h1>
      <AdminIdentity actor={actor} />
      {article.internalNotes ? (
        <p className="type-small" style={{ color: "var(--color-text-tertiary)" }}>
          Internal notes: {article.internalNotes}
        </p>
      ) : null}
      <InsightContentForm
        article={JSON.parse(JSON.stringify(article))}
        authors={JSON.parse(JSON.stringify(authors))}
      />
    </div>
  );
}
