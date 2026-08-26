import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { isFeatureEnabled } from "@/lib/release/overrides";
import { publicStatusView, readyHealth } from "@/lib/release/health";
import { pageMeta } from "@/lib/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (!(await isFeatureEnabled("publicStatusPage"))) {
    return pageMeta({
      title: "Status",
      description: "Service status is not published on this environment.",
      path: "/status",
      index: false,
    });
  }
  return pageMeta({
    title: "Service status",
    description: "Plug and Go component status. This page does not include secrets or customer data.",
    path: "/status",
    index: false,
  });
}

export default async function PublicStatusPage() {
  if (!(await isFeatureEnabled("publicStatusPage"))) notFound();
  const report = await readyHealth();
  const view = publicStatusView(report);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Service status
      </h1>
      <p className="type-body-lg" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        High-level health only. Charger availability still belongs on station pages. This page is not a control panel.
      </p>
      <Alert variant={view.ok ? "success" : "warning"} title={view.ok ? "Systems responding" : "Degraded or unavailable"}>
        Last check {view.time}. Environment label is operational, not a marketing claim.
      </Alert>
      <ul className="status-list" style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 12 }}>
        {view.components.map((component) => (
          <li key={component.name} className="paper-card" style={{ padding: 16 }}>
            <p className="type-h3" style={{ margin: "0 0 4px", textTransform: "capitalize" }}>
              {component.name.replaceAll("_", " ")}
            </p>
            <p className="type-small" style={{ margin: 0 }}>
              Status: {component.state}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
