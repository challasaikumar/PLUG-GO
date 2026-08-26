import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { CityContentForm } from "@/components/admin/ContentForms";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getAdminCity } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = requireStaffRole(ROLE_MATRIX.writeEditorial);
  const { id } = await params;
  const city = await getAdminCity(id);
  if (!city) notFound();
  const plain = JSON.parse(JSON.stringify(city));

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin/content/cities">
          City pages
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        {city.cityName}
      </h1>
      <AdminIdentity actor={actor} />
      {city.internalNotes ? (
        <p className="type-small" style={{ color: "var(--color-text-tertiary)" }}>
          Internal notes: {city.internalNotes}
        </p>
      ) : null}
      <CityContentForm city={plain} />
    </div>
  );
}
