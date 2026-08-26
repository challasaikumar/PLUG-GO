import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { InsightContentForm } from "@/components/admin/ContentForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listAdminAuthors } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function NewInsightPage() {
  const actor = requireStaffRole(ROLE_MATRIX.writeEditorial);
  const authors = await listAdminAuthors();
  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin/content/insights">
          Insights
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        New insight
      </h1>
      <AdminIdentity actor={actor} />
      <InsightContentForm authors={JSON.parse(JSON.stringify(authors))} />
    </div>
  );
}
