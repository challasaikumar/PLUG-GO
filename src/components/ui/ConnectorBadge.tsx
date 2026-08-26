type ConnectorBadgeProps = {
  type: string;
  maxKw: number;
  installedCount?: number;
  planned?: boolean;
};

export function ConnectorBadge({
  type,
  maxKw,
  installedCount,
  planned,
}: ConnectorBadgeProps) {
  return (
    <span className="connector-badge">
      <span className="type-small" style={{ fontWeight: 500 }}>
        {type}
        {planned ? " · Planned" : ""}
      </span>
      <span className="font-mono type-small">
        {maxKw} kW
        {installedCount != null ? ` · ${installedCount} installed` : null}
      </span>
    </span>
  );
}
