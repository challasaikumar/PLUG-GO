import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { AuthorForm } from "@/components/admin/ContentForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listAdminAuthors } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  const actor = requireStaffRole(ROLE_MATRIX.readCatalogue);
  const authors = await listAdminAuthors();

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin">
          Catalogue
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        Authors and reviewers
      </h1>
      <AdminIdentity actor={actor} />
      <AuthorForm />
      <ul style={{ marginTop: 32, paddingLeft: 20 }}>
        {authors.map((author) => (
          <li key={author.id}>
            {author.displayName}
            {author.roleTitle ? ` · ${author.roleTitle}` : ""}
            {author.isDemo ? " · demo" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
