const GLYPH: Record<string, string> = {
  critical: "●●●",
  high: "●●",
  medium: "●",
  low: "○",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`severity-badge severity-badge--${severity}`}>
      <span aria-hidden>{GLYPH[severity] ?? "○"}</span>
      {severity}
    </span>
  );
}
