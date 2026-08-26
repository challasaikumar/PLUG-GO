import { StationCardSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-png" style={{ padding: "48px 0" }} aria-busy="true">
      <p className="type-small" style={{ marginBottom: 16 }}>
        Loading stations
      </p>
      <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
        <StationCardSkeleton />
      </div>
    </div>
  );
}
