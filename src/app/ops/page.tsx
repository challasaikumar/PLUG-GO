import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { SeverityBadge } from "@/components/ops/SeverityBadge";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { getNetworkOverview } from "@/lib/ops/overview";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    city?: string;
    station?: string;
    host?: string;
    status?: string;
    severity?: string;
    technician?: string;
    q?: string;
  }>;
};

export default async function OpsOverviewPage({ searchParams }: PageProps) {
  const actor = requireStaffRole(ROLE_MATRIX.readOps);
  const params = await searchParams;
  const overview = await getNetworkOverview(actor, {
    city: params.city,
    stationId: params.station,
    hostId: params.host,
    connectorStatus: params.status,
    severity: params.severity as never,
    technicianId: params.technician,
    q: params.q,
  });
  const incidentTotal = Object.values(overview.incidentsOpenBySeverity).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <h1 className="type-h1">Network health</h1>
      <DataFreshness label={`Generated ${overview.generatedAt}`} />
      <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
        Freshness policy:{" "}
        {overview.freshnessPolicyMinutes
          ? `${overview.freshnessPolicyMinutes} minutes`
          : "unavailable — Available is never inferred"}
        . Counts are from catalogue and CSMS rows, not placeholders.
      </p>
      <form className="ops-filters" method="get" style={{ margin: "16px 0 24px" }}>
        <label className="field-label" htmlFor="q">
          Search station
          <input className="field-control" id="q" name="q" defaultValue={params.q} />
        </label>
        <label className="field-label" htmlFor="city">
          City
          <input className="field-control" id="city" name="city" defaultValue={params.city} />
        </label>
        <label className="field-label" htmlFor="status">
          Connector status
          <select className="field-control" id="status" name="status" defaultValue={params.status}>
            <option value="">Any</option>
            <option value="available">Available</option>
            <option value="in_use">In use</option>
            <option value="faulted">Faulted</option>
            <option value="offline">Offline</option>
            <option value="stale">Stale</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="field-label" htmlFor="severity">
          Incident severity
          <select className="field-control" id="severity" name="severity" defaultValue={params.severity}>
            <option value="">Any</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="field-label" htmlFor="technician">
          Assigned technician id
          <input className="field-control" id="technician" name="technician" defaultValue={params.technician} />
        </label>
        <label className="field-label" htmlFor="host">
          Host id
          <input className="field-control" id="host" name="host" defaultValue={params.host} />
        </label>
        <button className="png-btn png-btn--primary png-btn--sm" type="submit">
          Apply filters
        </button>
      </form>
      <div className="ops-stat-grid">
        <article className="ops-stat-card">
          <p className="type-caption">Stations in scope</p>
          <p className="type-h2" style={{ margin: 0 }}>
            {overview.stationCount}
          </p>
        </article>
        <article className="ops-stat-card">
          <p className="type-caption">Connectors · Available / In use / Faulted</p>
          <p className="type-h2" style={{ margin: 0 }}>
            {overview.connectorHealth.available} / {overview.connectorHealth.inUse} / {overview.connectorHealth.faulted}
          </p>
          <p className="type-caption">
            Offline {overview.connectorHealth.offline} · Stale {overview.connectorHealth.stale} · Unknown{" "}
            {overview.connectorHealth.unknown} · Fresh available {overview.connectorHealth.freshAvailable}
          </p>
        </article>
        <article className="ops-stat-card">
          <p className="type-caption">Open incidents</p>
          <p className="type-h2" style={{ margin: 0 }}>
            {incidentTotal}
          </p>
          <p className="type-caption">
            <SeverityBadge severity="critical" /> {overview.incidentsOpenBySeverity.critical} · high{" "}
            {overview.incidentsOpenBySeverity.high} · medium {overview.incidentsOpenBySeverity.medium} · low{" "}
            {overview.incidentsOpenBySeverity.low}
          </p>
        </article>
        <article className="ops-stat-card">
          <p className="type-caption">Remote commands</p>
          <p className="type-h2" style={{ margin: 0 }}>
            {overview.commands.pending} pending
          </p>
          <p className="type-caption">{overview.commands.failed} failed or timed out</p>
        </article>
      </div>
      {overview.exceptions.supportOpen !== null ? (
        <p className="type-small" style={{ marginTop: 16 }}>
          Open support tickets: {overview.exceptions.supportOpen}
          {overview.exceptions.refundsPending !== null ? ` · Refund exceptions: ${overview.exceptions.refundsPending}` : ""}
          {overview.exceptions.bookingsFailed !== null ? ` · Failed/expired bookings: ${overview.exceptions.bookingsFailed}` : ""}
        </p>
      ) : (
        <p className="type-small" style={{ marginTop: 16 }}>
          Payment, booking, and support exception counts are hidden for this role.
        </p>
      )}
      <h2 className="type-h2" style={{ marginTop: 32 }}>
        Heartbeat / connection issues
      </h2>
      {overview.heartbeatIssues.length === 0 ? (
        <EmptyState
          title="No heartbeat issues in this filter"
          body="Issues appear after charge points are commissioned. An empty list is not simulated health."
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {overview.heartbeatIssues.map((row) => (
            <li key={`${row.chargePointId}-${row.issue}`} className="ops-list-card">
              <Link className="png-link" href={`/ops/stations/${row.stationId}`}>
                {row.stationName}
              </Link>
              <p className="type-small">
                {row.issue.replaceAll("_", " ")} · connection {row.connectionStatus} · last heartbeat{" "}
                {row.lastHeartbeatAt ?? "never"}
              </p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="type-h2" style={{ marginTop: 32 }}>
        Stations
      </h2>
      {overview.stations.length === 0 ? (
        <EmptyState title="No stations in scope" body="Assign a station or check filters. Nothing is invented." />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {overview.stations.map((station) => (
            <li key={station.id} className="ops-list-card">
              <Link className="png-link" href={`/ops/stations/${station.id}`}>
                {station.name}
              </Link>
              <p className="type-small">
                {station.city} · {station.host} · {station.connectorCount} connectors · {station.chargePointCount} charge
                points
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
