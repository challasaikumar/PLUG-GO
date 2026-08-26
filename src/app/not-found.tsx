import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px" }}>
      <EmptyState
        title="This page is not published"
        body="The address may be wrong, or the page has not been published. Unpublished stations are not listed here."
        action={{ href: "/", label: "Back to Plug and Go" }}
        secondaryAction={{ href: "/support", label: "Get support" }}
      />
    </div>
  );
}
