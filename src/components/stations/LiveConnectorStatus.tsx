"use client";

import { useEffect, useRef, useState } from "react";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { freshnessCopy, type PublicStatus } from "@/lib/status";

type ConnectorLive = {
  connectorId: string;
  publicRef?: string;
  publicStatus: PublicStatus;
  statusUpdatedAt: string | null;
};

export function useStationLiveConnectors(
  stationSlug: string,
  initial: ConnectorLive[],
  enabled: boolean,
): ConnectorLive[] {
  const [overrides, setOverrides] = useState<Record<string, Pick<ConnectorLive, "publicStatus" | "statusUpdatedAt">>>(
    {},
  );
  const initialRef = useRef(initial);
  useEffect(() => {
    initialRef.current = initial;
  });

  useEffect(() => {
    if (!enabled) return;
    let closed = false;
    const seen = new Set<string>();
    const source = new EventSource(
      `/api/realtime/sse?scope=public&stationSlug=${encodeURIComponent(stationSlug)}`,
    );
    source.addEventListener("connector_status", (event) => {
      if (event.lastEventId && seen.has(event.lastEventId)) return;
      if (event.lastEventId) seen.add(event.lastEventId);
      try {
        const payload = JSON.parse(event.data) as {
          connectorPublicRef: string;
          publicStatus: PublicStatus;
          statusUpdatedAt: string;
        };
        const match = initialRef.current.find((row) => row.publicRef === payload.connectorPublicRef);
        if (!match) return;
        setOverrides((current) => ({
          ...current,
          [match.connectorId]: {
            publicStatus: payload.publicStatus,
            statusUpdatedAt: payload.statusUpdatedAt,
          },
        }));
      } catch {
        // Ignore stale frames.
      }
    });
    source.onerror = () => {
      if (closed) return;
      source.close();
    };
    return () => {
      closed = true;
      source.close();
    };
  }, [enabled, stationSlug]);

  return initial.map((connector) => ({
    ...connector,
    ...overrides[connector.connectorId],
  }));
}

export function LiveConnectorStatus({
  status,
  statusUpdatedAt,
}: {
  status: PublicStatus;
  statusUpdatedAt: string | null;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <AvailabilityChip status={status} />
      <DataFreshness
        label={freshnessCopy({ status, statusUpdatedAt })}
        status={status}
      />
    </div>
  );
}
