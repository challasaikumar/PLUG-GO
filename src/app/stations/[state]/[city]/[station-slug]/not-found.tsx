import { EmptyState } from "@/components/ui/EmptyState";

export default function StationNotFound() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px" }}>
      <EmptyState
        title="This station is not published"
        body="The address may be wrong, or the station is still a draft. Unpublished, archived, and demo records are not shown here."
        action={{ href: "/find-charger", label: "Find a charger" }}
        secondaryAction={{ href: "/support", label: "Get support" }}
      />
    </div>
  );
}
