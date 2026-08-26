import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { RouteContentForm } from "@/components/admin/ContentForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getAdminRoute } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = requireStaffRole(ROLE_MATRIX.writeEditorial);
  const { id } = await params;
  const route = await getAdminRoute(id);
  if (!route) notFound();

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin/content/routes">
          Route guides
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        {route.originName} to {route.destinationName}
      </h1>
      <AdminIdentity actor={actor} />
      {route.internalNotes ? (
        <p className="type-small" style={{ color: "var(--color-text-tertiary)" }}>
          Internal notes: {route.internalNotes}
        </p>
      ) : null}
      <RouteContentForm route={JSON.parse(JSON.stringify(route))} />
    </div>
  );
}
