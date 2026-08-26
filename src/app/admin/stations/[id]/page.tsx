import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { StationWorkbench } from "@/components/admin/AdminForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listStationAudit } from "@/lib/catalogue/hardware-service";
import { getAdminStation } from "@/lib/catalogue/station-service";

export const dynamic = "force-dynamic";

export default async function AdminStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = requireStaffRole(ROLE_MATRIX.readCatalogue);
  const { id } = await params;
  const station = await getAdminStation(id);
  if (!station) notFound();
  const audit = (await listStationAudit(id)) ?? [];

  const plainStation = JSON.parse(JSON.stringify(station));
  const plainAudit = JSON.parse(JSON.stringify(audit));

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin">
          All stations
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        {station.name}
      </h1>
      <AdminIdentity actor={actor} />
      <p className="font-mono type-small" style={{ marginBottom: 24 }}>
        {station.slug}
      </p>
      <StationWorkbench station={plainStation} audit={plainAudit} />
    </div>
  );
}
