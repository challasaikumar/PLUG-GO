import { Skeleton } from "@/components/ui/Skeleton";

export default function OpsLoading() {
  return (
    <div className="container-png" style={{ padding: "48px 0" }} aria-busy="true">
      <p className="type-small">Loading operations</p>
      <div className="ops-stat-grid" style={{ marginTop: 16 }}>
        <Skeleton height={96} />
        <Skeleton height={96} />
        <Skeleton height={96} />
      </div>
    </div>
  );
}
