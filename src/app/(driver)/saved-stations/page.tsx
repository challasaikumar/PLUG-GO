import Link from "next/link";
import { listSavedStations } from "@/lib/account/saved-stations";
import { requireDriverPage } from "@/lib/auth/driver";
import { pageMeta } from "@/lib/metadata";
import { RemoveSavedStationButton } from "@/components/account/RemoveSavedStationButton";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { DataFreshness } from "@/components/ui/DataFreshness";
import type { PublicStatus } from "@/lib/status";

export const metadata = pageMeta({
  title: "Saved stations",
  description: "Stations saved to your Plug and Go account.",
  path: "/saved-stations",
  index: false,
});

function isPublicStatus(value: string): value is PublicStatus {
  return ["available", "in_use", "faulted", "offline", "unknown", "stale"].includes(value);
}

export default async function SavedStationsPage() {
  const driver = await requireDriverPage("/saved-stations");
  const stations = await listSavedStations(driver.id);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Saved stations
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        These are stations you chose to keep. Live status is loaded when this page is online and is never treated as
        fresh while offline.
      </p>
      {stations.length === 0 ? (
        <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
          No saved stations yet. Open a published station and use Save station.{" "}
          <Link className="png-link" href="/find-charger">
            Find a charger
          </Link>
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {stations.map((station) => (
            <li key={station.savedId} className="paper-card" style={{ padding: 20 }}>
              <h2 className="type-h3" style={{ margin: "0 0 4px" }}>
                {station.href ? (
                  <Link className="png-link" href={station.href}>
                    {station.name}
                  </Link>
                ) : (
                  station.name
                )}
              </h2>
              <p className="type-small" style={{ margin: "0 0 8px", color: "var(--color-text-secondary)" }}>
                {station.locationLabel}
              </p>
              {station.published ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {isPublicStatus(station.status) ? <AvailabilityChip status={station.status} /> : null}
                  {station.freshnessLabel && isPublicStatus(station.status) ? (
                    <DataFreshness label={station.freshnessLabel} status={station.status} />
                  ) : null}
                </div>
              ) : (
                <p className="type-small" style={{ margin: 0, color: "var(--color-warning-fg)" }}>
                  {station.unpublishedReason}
                </p>
              )}
              <p className="type-small" style={{ margin: "8px 0 16px" }}>
                {station.connectorSummary}
              </p>
              <RemoveSavedStationButton savedId={station.savedId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
