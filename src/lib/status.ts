/**
 * Public status display rules from docs/station-data-schema.md.
 * Never map stale or unknown to available.
 */

export const PUBLIC_STATUSES = [
  "available",
  "in_use",
  "faulted",
  "offline",
  "unknown",
  "stale",
] as const;

export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export type StatusTone = "available" | "limited" | "faulted" | "offline";

export function statusLabel(status: PublicStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "in_use":
      return "In use";
    case "faulted":
      return "Faulted";
    case "offline":
      return "Offline";
    case "unknown":
      return "Unknown";
    case "stale":
      return "Stale";
  }
}

export function statusTone(status: PublicStatus): StatusTone {
  switch (status) {
    case "available":
      return "available";
    case "in_use":
      return "limited";
    case "faulted":
      return "faulted";
    case "offline":
    case "unknown":
    case "stale":
      return "offline";
  }
}

/** True only for a fresh available event — never stale/unknown. */
export function isPubliclyAvailable(status: PublicStatus): boolean {
  return status === "available";
}

export function availabilityFreshnessMinutes(): number | null {
  const raw = process.env.AVAILABILITY_FRESHNESS_MINUTES?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export type RecordedOperationalStatus =
  | "available"
  | "in_use"
  | "faulted"
  | "offline"
  | "unknown";

export type PublicStatusComputation = {
  publicStatus: PublicStatus;
  recordedStatus: RecordedOperationalStatus | null;
  statusUpdatedAt: string | null;
  freshnessMinutes: number | null;
  freshnessPolicy: "configured" | "unavailable";
  reason: string;
};

export function computePublicStatus(input: {
  recordedStatus: RecordedOperationalStatus | null;
  statusUpdatedAt: Date | string | null;
  now?: Date;
  overrideExpiresAt?: Date | string | null;
  freshnessMinutes?: number | null;
}): PublicStatusComputation {
  const now = input.now ?? new Date();
  const freshnessMinutes =
    input.freshnessMinutes === undefined
      ? availabilityFreshnessMinutes()
      : input.freshnessMinutes;
  const updatedAt = input.statusUpdatedAt ? new Date(input.statusUpdatedAt) : null;
  const overrideExpires = input.overrideExpiresAt
    ? new Date(input.overrideExpiresAt)
    : null;

  if (overrideExpires && overrideExpires.getTime() <= now.getTime()) {
    return {
      publicStatus: "unknown",
      recordedStatus: input.recordedStatus,
      statusUpdatedAt: updatedAt?.toISOString() ?? null,
      freshnessMinutes,
      freshnessPolicy: freshnessMinutes ? "configured" : "unavailable",
      reason: "Status override has expired. Availability is unknown until a new event is recorded.",
    };
  }

  if (!input.recordedStatus || !updatedAt) {
    return {
      publicStatus: "unknown",
      recordedStatus: input.recordedStatus,
      statusUpdatedAt: updatedAt?.toISOString() ?? null,
      freshnessMinutes,
      freshnessPolicy: freshnessMinutes ? "configured" : "unavailable",
      reason: "No usable availability event.",
    };
  }

  if (freshnessMinutes === null) {
    if (input.recordedStatus === "available") {
      return {
        publicStatus: "unknown",
        recordedStatus: input.recordedStatus,
        statusUpdatedAt: updatedAt.toISOString(),
        freshnessMinutes: null,
        freshnessPolicy: "unavailable",
        reason:
          "A freshness threshold is not configured, so Available is not shown. Unknown is used instead.",
      };
    }
    return {
      publicStatus: "stale",
      recordedStatus: input.recordedStatus,
      statusUpdatedAt: updatedAt.toISOString(),
      freshnessMinutes: null,
      freshnessPolicy: "unavailable",
      reason:
        "A freshness threshold is not configured. Operational states are shown as Stale, never Available.",
    };
  }

  const ageMs = now.getTime() - updatedAt.getTime();
  if (ageMs > freshnessMinutes * 60_000) {
    return {
      publicStatus: "stale",
      recordedStatus: input.recordedStatus,
      statusUpdatedAt: updatedAt.toISOString(),
      freshnessMinutes,
      freshnessPolicy: "configured",
      reason: "The last event is older than the freshness threshold.",
    };
  }

  return {
    publicStatus: input.recordedStatus,
    recordedStatus: input.recordedStatus,
    statusUpdatedAt: updatedAt.toISOString(),
    freshnessMinutes,
    freshnessPolicy: "configured",
    reason: "Latest event is within the freshness threshold.",
  };
}

export function formatRelativeMinutes(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime();
  if (!Number.isFinite(diffMs)) return "at an unknown time";
  if (diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 48) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function freshnessCopy(input: {
  status: PublicStatus;
  statusUpdatedAt: string | null;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  if (!input.statusUpdatedAt) {
    return input.status === "unknown" || input.status === "stale"
      ? "Live status unavailable"
      : "Status time not recorded";
  }
  const updated = new Date(input.statusUpdatedAt);
  if (Number.isNaN(updated.getTime())) {
    return "Live status unavailable";
  }
  const relative = formatRelativeMinutes(updated, now);
  if (input.status === "unknown") {
    return `Live status unavailable · last event ${relative}`;
  }
  return `Status last updated ${relative}`;
}

export function statusGuidance(status: PublicStatus): string | null {
  switch (status) {
    case "offline":
    case "stale":
      return "This charger may be offline — check nearby options";
    case "unknown":
      return "Live status unavailable";
    case "faulted":
      return "This charger is reported faulted — do not use it and check nearby options";
    default:
      return null;
  }
}
