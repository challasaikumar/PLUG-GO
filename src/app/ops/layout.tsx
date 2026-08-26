import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { OpsDenied, OpsIdentity } from "@/components/ops/OpsChrome";
import { OpsNav } from "@/components/ops/OpsNav";
import { INTERNAL_OPS_ROLES, isAdminEnabled, resolveStaffActor, roleAllows } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/release/overrides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations",
  description: "Protected Plug and Go network operations. Not a public page.",
  robots: { index: false, follow: false },
};

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("opsPortal"))) {
    return (
      <OpsDenied
        title="Operations is disabled"
        body="FLAG_OPS_PORTAL is not enabled. Public website discovery stays separate from network operations."
      />
    );
  }
  if (!isDatabaseConfigured()) {
    return <OpsDenied title="Database is not configured" body="Set DATABASE_URL. Operations portals cannot run without it." />;
  }
  if (!isAdminEnabled()) {
    return (
      <OpsDenied
        title="Operations is disabled"
        body="ADMIN_ENABLED is not true. Public website discovery stays separate from network operations."
      />
    );
  }
  const actor = resolveStaffActor();
  if (!actor) {
    return (
      <OpsDenied
        title="Staff identity required"
        body="Production denies the development adapter until an identity provider with MFA is wired. In local development set STAFF_DEV_ROLE and STAFF_DEV_ACTOR_ID."
      />
    );
  }
  if (!roleAllows(actor, INTERNAL_OPS_ROLES)) {
    return (
      <OpsDenied
        title="Wrong portal"
        body="Host and fleet users use /partner and /fleet. Catalogue editors use /admin. This operations tree is for Plug and Go staff."
      />
    );
  }

  return (
    <div className="container-png" style={{ padding: "24px 0 80px" }}>
      <Alert variant="warning" title="Internal operations">
        This area is noindex, not in the sitemap, and is not a driver finder or public charger control panel. The public
        /support page is separate from /ops/support.
      </Alert>
      <OpsIdentity actor={actor} />
      <OpsNav role={actor.role} />
      {children}
    </div>
  );
}
