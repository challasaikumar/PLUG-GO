import Link from "next/link";
import { AdminIdentity } from "@/components/admin/AdminChrome";
import { FinanceBookingDesk } from "@/components/admin/FinanceBookingDesk";
import { Alert } from "@/components/ui/Alert";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const actor = requireStaffRole(ROLE_MATRIX.readFinance);

  return (
    <div className="container-png" style={{ padding: "32px 0 80px", maxWidth: 760 }}>
      <p className="type-caption">
        <Link className="png-link" href="/admin">
          Catalogue
        </Link>
      </p>
      <h1 className="type-h1">Finance desk</h1>
      <AdminIdentity actor={actor} />
      <Alert variant="info" title="Role-limited">
        Finance can initiate refunds. Support can look up booking state. Station operators do not get this access
        automatically.
      </Alert>
      <FinanceBookingDesk canRefund={actor.role === "finance" || actor.role === "super_admin"} />
    </div>
  );
}
