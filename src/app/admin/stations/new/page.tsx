import { AdminIdentity } from "@/components/admin/AdminChrome";
import { CreateStationForm } from "@/components/admin/AdminForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function NewStationPage() {
  const actor = requireStaffRole(ROLE_MATRIX.writeStationFacts);
  const prisma = getPrisma();
  const [organisations, hosts] = await Promise.all([
    prisma.organisation.findMany({ orderBy: { brandName: "asc" } }),
    prisma.host.findMany({ orderBy: { hostDisplayName: "asc" } }),
  ]);

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <h1 className="type-h1" style={{ margin: "24px 0 8px" }}>
        Create station draft
      </h1>
      <AdminIdentity actor={actor} />
      <p className="type-body" style={{ margin: "0 0 24px", maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
        New records start as Draft. Public APIs will not return them until an authorized operator publishes a verified,
        non-demo station.
      </p>
      {organisations.length === 0 || hosts.length === 0 ? (
        <p className="type-small">
          Create an organisation and host via POST /api/admin/organisations and /api/admin/hosts, or run the development
          seed (demo host only).
        </p>
      ) : (
        <CreateStationForm organisations={organisations} hosts={hosts} />
      )}
    </div>
  );
}
