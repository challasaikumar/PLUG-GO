import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="container-png" style={{ padding: "48px 0" }} aria-busy="true">
      <p className="type-small">Loading staff workbench</p>
      <div style={{ marginTop: 16, maxWidth: 480 }}>
        <Skeleton width="70%" height={24} />
        <div style={{ height: 16 }} />
        <Skeleton height={160} />
      </div>
    </div>
  );
}
