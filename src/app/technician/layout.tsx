import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { OpsDenied, OpsIdentity } from "@/components/ops/OpsChrome";
import { TECHNICIAN_PORTAL_ROLES, isAdminEnabled, resolveStaffActor, roleAllows } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/release/overrides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technician",
  description: "Protected Plug and Go technician workspace. Not a public page.",
  robots: { index: false, follow: false },
};

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("opsPortal"))) {
    return <OpsDenied title="Technician portal disabled" body="FLAG_OPS_PORTAL is not enabled." />;
  }
  if (!isDatabaseConfigured()) {
    return <OpsDenied title="Database is not configured" body="Set DATABASE_URL." />;
  }
  if (!isAdminEnabled()) {
    return <OpsDenied title="Technician portal disabled" body="ADMIN_ENABLED is not true." />;
  }
  const actor = resolveStaffActor();
  if (!actor) {
    return (
      <OpsDenied
        title="Staff identity required"
        body="Production stays disabled until an identity provider with MFA is wired."
      />
    );
  }
  if (!roleAllows(actor, TECHNICIAN_PORTAL_ROLES)) {
    return <OpsDenied title="Technician only" body="This workspace is limited to assigned technicians." />;
  }
  return (
    <div className="container-png" style={{ padding: "16px 0 80px", maxWidth: 640 }}>
      <Alert variant="warning" title="Field workspace">
        You only see assigned locations. Finance and unrelated customer records are not shown.
      </Alert>
      <OpsIdentity actor={actor} />
      {children}
    </div>
  );
}
