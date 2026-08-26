import { cn } from "@/lib/cn";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
};

export function Skeleton({
  width = "100%",
  height = 16,
  radius,
  className,
}: SkeletonProps) {
  return (
    <span
      className={cn("skeleton skeleton-pulse", className)}
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius ?? "var(--radius-sm)",
      }}
      aria-hidden
    />
  );
}

export function StationCardSkeleton() {
  return (
    <div className="paper-card" style={{ padding: 16 }} aria-hidden>
      <Skeleton height={120} radius="var(--radius-md)" />
      <div style={{ height: 12 }} />
      <Skeleton width="70%" height={22} />
      <div style={{ height: 8 }} />
      <Skeleton width="40%" height={14} />
      <div style={{ height: 12 }} />
      <Skeleton width={96} height={32} radius="var(--radius-pill)" />
    </div>
  );
}
