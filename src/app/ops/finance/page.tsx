import { FinanceOpsDesk } from "@/components/ops/FinanceOpsDesk";
import { ROLE_MATRIX, requireStaffRole, roleAllows } from "@/lib/auth/staff";
import { listFinanceExceptions } from "@/lib/ops/finance";

export const dynamic = "force-dynamic";

export default async function OpsFinancePage() {
  const actor = requireStaffRole(ROLE_MATRIX.readFinanceOps);
  const exceptions = await listFinanceExceptions(actor);

  return (
    <div>
      <h1 className="type-h1">Finance</h1>
      <p className="type-caption">Generated {exceptions.generatedAt}</p>
      <FinanceOpsDesk
        canRefund={roleAllows(actor, ROLE_MATRIX.initiateRefund)}
        exceptions={exceptions}
      />
    </div>
  );
}
