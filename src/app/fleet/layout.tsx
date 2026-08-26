import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { OpsDenied, OpsIdentity } from "@/components/ops/OpsChrome";
import { FLEET_PORTAL_ROLES, isAdminEnabled, resolveStaffActor, roleAllows } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/release/overrides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fleet portal",
  description: "Protected Plug and Go fleet portal. Not a public page.",
  robots: { index: false, follow: false },
};

export default async function FleetLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("fleetPortal"))) {
    return <OpsDenied title="Fleet portal disabled" body="FLAG_FLEET_PORTAL is not enabled." />;
  }
  if (!isDatabaseConfigured()) {
    return <OpsDenied title="Database is not configured" body="Set DATABASE_URL." />;
  }
  if (!isAdminEnabled()) {
    return <OpsDenied title="Fleet portal disabled" body="ADMIN_ENABLED is not true." />;
  }
  const actor = resolveStaffActor();
  if (!actor) {
    return (
      <OpsDenied
        title="Fleet identity required"
        body="Production stays disabled until an identity provider with MFA is wired. Fleet login is not the driver OTP account."
      />
    );
  }
  if (!roleAllows(actor, FLEET_PORTAL_ROLES)) {
    return <OpsDenied title="Fleet portal only" body="Staff operations live at /ops. Hosts use /partner." />;
  }
  return (
    <div className="container-png" style={{ padding: "24px 0 80px" }}>
      <Alert variant="warning" title="Fleet portal">
        Your organisation only. Driver invitations, payroll, and full cost allocation are not in this phase.
      </Alert>
      <OpsIdentity actor={actor} />
      {children}
    </div>
  );
}
