"use client";

import { LiveConnectorStatus, useStationLiveConnectors } from "@/components/stations/LiveConnectorStatus";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import type { PublicStatus } from "@/lib/status";

type Connector = {
  connectorId: string;
  publicRef: string;
  evseLabel: string;
  connectorIndex: number;
  connectorType: string;
  maxKw: number;
  publicStatus: PublicStatus;
  statusUpdatedAt: string | null;
  vehicleCompatibilityNotes: string | null;
};

export function StationConnectorLiveList({
  stationSlug,
  connectors,
  liveEnabled,
}: {
  stationSlug: string;
  connectors: Connector[];
  liveEnabled: boolean;
}) {
  const live = useStationLiveConnectors(
    stationSlug,
    connectors.map((connector) => ({
      connectorId: connector.connectorId,
      publicRef: connector.publicRef,
      publicStatus: connector.publicStatus,
      statusUpdatedAt: connector.statusUpdatedAt,
    })),
    liveEnabled,
  );

  return (
    <div className="station-connector-list">
      {connectors.map((connector) => {
        const current = live.find((row) => row.connectorId === connector.connectorId) ?? connector;
        return (
          <article key={connector.connectorId} className="paper-card" style={{ padding: 16 }}>
            <p className="type-caption" style={{ margin: "0 0 8px" }}>
              {connector.evseLabel} · connector {connector.connectorIndex}
            </p>
            <h3 className="type-h3" style={{ margin: "0 0 8px" }}>
              {connectorTypeLabel(connector.connectorType)} · {connector.maxKw} kW
            </h3>
            <LiveConnectorStatus status={current.publicStatus} statusUpdatedAt={current.statusUpdatedAt} />
            {connector.vehicleCompatibilityNotes ? (
              <p className="type-small" style={{ margin: "12px 0 0", color: "var(--color-text-secondary)" }}>
                {connector.vehicleCompatibilityNotes}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
