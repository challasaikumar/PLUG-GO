import type { StaffActor } from "@/lib/auth/staff";
import { Alert } from "@/components/ui/Alert";

export function OpsDenied({ title, body }: { title: string; body: string }) {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <h1 className="type-h1" style={{ margin: "0 0 16px" }}>
        Operations
      </h1>
      <Alert variant="error" title={title}>
        {body}
      </Alert>
    </div>
  );
}

export function OpsIdentity({ actor }: { actor: StaffActor }) {
  return (
    <p className="type-caption" style={{ margin: "0 0 16px", color: "var(--color-text-tertiary)" }}>
      Signed in as <span className="font-mono">{actor.id}</span> · {actor.role.replaceAll("_", " ")} ·{" "}
      {actor.source === "dev_env" ? "development adapter" : actor.source}
    </p>
  );
}
