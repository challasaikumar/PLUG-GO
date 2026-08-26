import { cn } from "@/lib/cn";
import type { PublicStatus } from "@/lib/status";

type DataFreshnessProps = {
  label: string;
  status?: PublicStatus;
  className?: string;
};

export function DataFreshness({ label, status, className }: DataFreshnessProps) {
  const warning = status === "stale" || status === "unknown";
  return (
    <p
      className={cn("font-mono type-small", className)}
      style={{
        color: warning ? "var(--color-warning-fg)" : "var(--color-text-tertiary)",
        margin: 0,
      }}
    >
      {label}
    </p>
  );
}
