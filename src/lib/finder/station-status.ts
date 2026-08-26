import type { PublicStatus } from "@/lib/status";

export const STATION_STATUS_RANK: Record<PublicStatus, number> = {
  available: 0,
  in_use: 1,
  faulted: 2,
  offline: 3,
  stale: 4,
  unknown: 5,
};

type ConnectorStatus = {
  publicStatus: PublicStatus;
  statusUpdatedAt: string | null;
};

export function aggregateStationStatus(connectors: ConnectorStatus[]): {
  publicStatus: PublicStatus;
  statusUpdatedAt: string | null;
} {
  if (connectors.length === 0) {
    return { publicStatus: "unknown", statusUpdatedAt: null };
  }

  let best: PublicStatus = "unknown";
  for (const connector of connectors) {
    if (STATION_STATUS_RANK[connector.publicStatus] < STATION_STATUS_RANK[best]) {
      best = connector.publicStatus;
    }
  }

  const matching = connectors.filter((connector) => connector.publicStatus === best);
  let latest: string | null = null;
  for (const connector of matching) {
    if (!connector.statusUpdatedAt) continue;
    if (!latest || connector.statusUpdatedAt > latest) {
      latest = connector.statusUpdatedAt;
    }
  }

  return { publicStatus: best, statusUpdatedAt: latest };
}
