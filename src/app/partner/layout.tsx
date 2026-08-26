import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { OpsDenied, OpsIdentity } from "@/components/ops/OpsChrome";
import { HOST_PORTAL_ROLES, isAdminEnabled, resolveStaffActor, roleAllows } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/release/overrides";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host portal",
  description: "Protected Plug and Go host portal. Not a public page.",
  robots: { index: false, follow: false },
};

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  if (!(await isFeatureEnabled("hostPortal"))) {
    return <OpsDenied title="Host portal disabled" body="FLAG_HOST_PORTAL is not enabled." />;
  }
  if (!isDatabaseConfigured()) {
    return <OpsDenied title="Database is not configured" body="Set DATABASE_URL." />;
  }
  if (!isAdminEnabled()) {
    return <OpsDenied title="Host portal disabled" body="ADMIN_ENABLED is not true." />;
  }
  const actor = resolveStaffActor();
  if (!actor) {
    return (
      <OpsDenied
        title="Host identity required"
        body="Production stays disabled until an identity provider with MFA is wired. Host login is not the driver OTP account."
      />
    );
  }
  if (!roleAllows(actor, HOST_PORTAL_ROLES)) {
    return <OpsDenied title="Host portal only" body="Staff operations live at /ops. Fleet users use /fleet." />;
  }
  return (
    <div className="container-png" style={{ padding: "24px 0 80px" }}>
      <Alert variant="warning" title="Host portal">
        Assigned locations only. Individual driver personal data and payment details are not shown.
      </Alert>
      <OpsIdentity actor={actor} />
      {children}
    </div>
  );
}
