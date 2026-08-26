"use client";

import type { DemoStation } from "@/fixtures/demoStations";
import type { PublicStatus } from "@/lib/status";
import { Button } from "./Button";
import { AvailabilityChip } from "./AvailabilityChip";
import { ConnectorBadge } from "./ConnectorBadge";
import { DataFreshness } from "./DataFreshness";

export type StationCardModel = {
  id: string;
  name: string;
  locality: string;
  status: PublicStatus;
  lastUpdatedLabel: string;
  connectors: Array<{ type: string; maxKw: number; installedCount?: number }>;
  priceLabel: string | null;
  accessSummary: string;
  href: string;
  photoLabel?: string | null;
  showPhoto?: boolean;
  distanceLabel?: string | null;
  selected?: boolean;
  primaryLabel?: string;
  compact?: boolean;
  guidance?: string | null;
  selectLabel?: string;
};

export function demoStationToCard(station: DemoStation, href: string): StationCardModel {
  return {
    id: station.id,
    name: station.name,
    locality: station.locality,
    status: station.status,
    lastUpdatedLabel: station.lastUpdatedLabel,
    connectors: station.connectors,
    priceLabel: station.priceLabel,
    accessSummary: station.accessSummary,
    href,
    photoLabel: station.photoLabel,
    showPhoto: true,
  };
}

type StationCardProps = {
  station: StationCardModel | DemoStation;
  selected?: boolean;
  primaryHref?: string;
  primaryLabel?: string;
  compact?: boolean;
  onSelect?: () => void;
  selectLabel?: string;
};

function isDemoStation(station: StationCardModel | DemoStation): station is DemoStation {
  return "photoLabel" in station && !("href" in station);
}

export function StationCard({
  station,
  selected = false,
  primaryHref,
  primaryLabel,
  compact,
  onSelect,
  selectLabel,
}: StationCardProps) {
  const model: StationCardModel = isDemoStation(station)
    ? demoStationToCard(station, primaryHref ?? "#")
    : station;
  const href = primaryHref ?? model.href;
  const label = primaryLabel ?? model.primaryLabel ?? "View station";
  const isSelected = selected || model.selected;
  const isCompact = compact ?? model.compact;
  const showPhoto = !isCompact && model.showPhoto;
  const connectors = model.connectors.slice(0, isCompact ? 2 : 3);

  return (
    <article
      id={`station-card-${model.id}`}
      className={isSelected ? "paper-card paper-card--selected" : "paper-card"}
      style={{ padding: 16, display: "grid", gap: 12 }}
      aria-current={isSelected ? "true" : undefined}
    >
      {onSelect ? (
        <button
          type="button"
          className="png-btn png-btn--outline png-btn--sm"
          onClick={onSelect}
          aria-pressed={isSelected}
        >
          {isSelected ? "Selected" : (selectLabel ?? "Highlight")}
        </button>
      ) : null}
      {showPhoto ? (
        <div
          style={{
            background: "var(--color-surface-inset)",
            borderRadius: "var(--radius-md)",
            minHeight: 120,
            display: "flex",
            alignItems: "center",
            padding: 16,
            color: "var(--color-text-secondary)",
            fontSize: 14,
          }}
        >
          {model.photoLabel ?? "Photo not published"}
        </div>
      ) : null}
      <div>
        <h3 className="type-h3" style={{ margin: "0 0 4px", fontSize: isCompact ? 18 : undefined }}>
          {model.name}
        </h3>
        <p className="type-small" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          {model.locality}
          {model.distanceLabel ? ` · ${model.distanceLabel}` : ""}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <AvailabilityChip status={model.status} />
        <DataFreshness label={model.lastUpdatedLabel} status={model.status} />
      </div>
      {model.guidance ? (
        <p className="type-small" style={{ margin: 0, color: "var(--color-warning-fg)" }}>
          {model.guidance}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {connectors.map((connector) => (
          <ConnectorBadge
            key={`${connector.type}-${connector.maxKw}`}
            type={connector.type}
            maxKw={connector.maxKw}
            installedCount={isCompact ? undefined : connector.installedCount}
          />
        ))}
      </div>
      {model.priceLabel ? (
        <p className="font-mono type-small" style={{ margin: 0 }}>
          {model.priceLabel}
        </p>
      ) : null}
      <p className="type-small" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
        {model.accessSummary}
      </p>
      <Button href={href} variant="primary" block>
        {label}
      </Button>
    </article>
  );
}
