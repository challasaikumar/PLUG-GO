import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { RouteContentForm } from "@/components/admin/ContentForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

export default async function NewRoutePage() {
  const actor = requireStaffRole(ROLE_MATRIX.writeEditorial);
  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin/content/routes">
          Route guides
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        New route guide
      </h1>
      <AdminIdentity actor={actor} />
      <RouteContentForm />
    </div>
  );
}
