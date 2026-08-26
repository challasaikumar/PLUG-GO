import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { AdminDenied } from "@/components/admin/AdminChrome";
import { isAdminEnabled, resolveStaffActor } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff workbench",
  description: "Protected Plug and Go catalogue administration. Not a public page.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    return (
      <AdminDenied
        title="Database is not configured"
        body="Set DATABASE_URL on the server. Admin cannot run without the catalogue database."
      />
    );
  }
  if (!isAdminEnabled()) {
    return (
      <AdminDenied
        title="Admin is disabled"
        body="ADMIN_ENABLED is not true. The staff workbench stays off by default, including production."
      />
    );
  }
  const actor = resolveStaffActor();
  if (!actor) {
    return (
      <AdminDenied
        title="Staff identity required"
        body="Production denies the development adapter. In local development set STAFF_DEV_ROLE and STAFF_DEV_ACTOR_ID. Do not put those values in the client or use a secret URL as access control."
      />
    );
  }

  return (
    <div>
      <div className="container-png" style={{ paddingTop: 16 }}>
        <Alert variant="warning" title="Internal catalogue workbench">
          This area is noindex and is not linked from the public site. It is not a driver finder, payment tool, or
          charger control panel.
        </Alert>
      </div>
      {children}
    </div>
  );
}
