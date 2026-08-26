import { EmptyState } from "@/components/ui/EmptyState";

type ReservedPageProps = {
  title: string;
};

export function ReservedPage({ title }: ReservedPageProps) {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px" }}>
      <EmptyState
        title={`${title} is not published yet`}
        body="This route is reserved for a later phase. No live stations, prices, coverage, or charging controls are available here."
        action={{ href: "/", label: "Back to Plug and Go" }}
      />
    </div>
  );
}
