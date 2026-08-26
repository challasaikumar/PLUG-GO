import { statusLabel, statusTone, type PublicStatus } from "@/lib/status";
import { cn } from "@/lib/cn";
import {
  IconCheckCircle,
  IconClock,
  IconMinusCircle,
  IconQuestionCircle,
  IconStale,
  IconWarningDiamond,
} from "./icons";

type AvailabilityChipProps = {
  status: PublicStatus;
  className?: string;
};

function StatusGlyph({ status }: { status: PublicStatus }) {
  switch (status) {
    case "available":
      return <IconCheckCircle width={16} height={16} />;
    case "in_use":
      return <IconClock width={16} height={16} />;
    case "faulted":
      return <IconWarningDiamond width={16} height={16} />;
    case "offline":
      return <IconMinusCircle width={16} height={16} />;
    case "unknown":
      return <IconQuestionCircle width={16} height={16} />;
    case "stale":
      return <IconStale width={16} height={16} />;
  }
}

export function AvailabilityChip({ status, className }: AvailabilityChipProps) {
  const tone = statusTone(status);
  const label = statusLabel(status);

  return (
    <span
      className={cn("status-chip", `status-chip--${tone}`, className)}
      role="status"
    >
      <StatusGlyph status={status} />
      {label}
    </span>
  );
}
