import Link from "next/link";
import { notFound } from "next/navigation";
import { CommandRequestForm } from "@/components/ops/CommandRequestForm";
import { StationOverrideForm } from "@/components/ops/StationOverrideForm";
import { Alert } from "@/components/ui/Alert";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { ROLE_MATRIX, requireStaffRole, roleAllows } from "@/lib/auth/staff";
import { OpsError } from "@/lib/ops/roles";
import { getOpsStation } from "@/lib/ops/stations";

export const dynamic = "force-dynamic";

export default async function OpsStationDetailPage({
  params,
}: {
  params: Promise<{ "station-id": string }>;
}) {
  const actor = requireStaffRole(ROLE_MATRIX.readOpsStations);
  const { "station-id": stationId } = await params;
  let data;
  try {
    data = await getOpsStation(actor, stationId);
  } catch (error) {
    if (error instanceof OpsError && error.status === 404) notFound();
    throw error;
  }
  const canOverride = roleAllows(actor, ROLE_MATRIX.statusOverride);
  const canCommand = roleAllows(actor, ROLE_MATRIX.requestCommand);
  const session = Array.isArray(data.sessions) ? data.sessions[0] : undefined;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <p className="type-caption">
        <Link className="png-link" href="/ops/stations">
          Stations
        </Link>
      </p>
      <h1 className="type-h1">{data.station.name}</h1>
      <DataFreshness label={`Operational record · ${data.station.city}, ${data.station.state}`} />
      <p className="type-small">
        {data.station.addressLine1}
        {data.station.landmark ? ` · ${data.station.landmark}` : ""} · access {data.station.accessType} ·{" "}
        {data.station.accessHoursSummary}
      </p>
      <p className="type-small">
        Arrival: {data.station.arrivalInstructions ?? "Not recorded"} · Emergency:{" "}
        {data.station.emergencyInstructions ?? "Not recorded"} · Host {data.station.host.hostDisplayName} (
        {data.station.host.contractStatus})
      </p>
      <p>
        <Link className="png-link" href={data.station.publicPath}>
          Customer-facing station page
        </Link>
      </p>
      <h2 className="type-h2">Connectors</h2>
      {data.connectors.length === 0 ? (
        <Alert variant="info" title="No connectors">
          Hardware has not been recorded for this station.
        </Alert>
      ) : (
        data.connectors.map((connector) => (
          <article key={connector.id} className="ops-list-card">
            <p className="font-mono type-caption">{connector.publicRef}</p>
            <AvailabilityChip status={connector.computed.publicStatus} />
            <p className="type-small">
              Recorded {connector.recordedStatus ?? "none"} · updated {connector.statusUpdatedAt ?? "never"} · override{" "}
              {connector.overrideExpiresAt ?? "none"}
            </p>
            {canOverride ? <StationOverrideForm connectorId={connector.id} /> : null}
          </article>
        ))
      )}
      <h2 className="type-h2">Charge points</h2>
      {data.chargePoints.length === 0 ? (
        <Alert variant="info" title="No charge points">
          Heartbeat and meter times appear after Phase 9 commissioning.
        </Alert>
      ) : (
        data.chargePoints.map((cp) => (
          <article key={cp.id} className="ops-list-card">
            <p className="type-small">
              {cp.vendor ?? "Vendor unknown"} {cp.model ?? ""} · {cp.commissioningState} · {cp.connectionStatus}
            </p>
            <p className="type-caption">
              Last heartbeat {cp.lastHeartbeatAt ?? "never"} · last meter {cp.lastMeterAt ?? "never"} · last boot{" "}
              {cp.lastBootAt ?? "never"} · fault {cp.lastFaultCode ?? "none"} ({cp.lastFaultAt ?? "n/a"})
            </p>
            {cp.identity ? <p className="font-mono type-caption">Identity {cp.identity}</p> : <p className="type-caption">Device identity hidden for this role.</p>}
            <p className="type-caption">
              Capabilities: {cp.capabilities.map((row) => `${row.code}:${row.enabled ? "on" : "off"}`).join(" · ") || "none"}
            </p>
          </article>
        ))
      )}
      {canCommand ? (
        <CommandRequestForm
          stationId={data.station.id}
          connectorId={data.connectors[0]?.id}
          sessionPublicRef={session && "publicRef" in session ? String(session.publicRef) : undefined}
        />
      ) : null}
      <h2 className="type-h2">Tariff history</h2>
      {data.tariffs.length === 0 ? (
        <p className="type-small">No tariff versions.</p>
      ) : (
        <ul>
          {data.tariffs.map((row) => (
            <li key={row.id} className="type-small">
              {row.approvalStatus} · {row.energyPaisePerKwh} paise/kWh · {row.effectiveFrom} → {row.effectiveTo ?? "open"}
            </li>
          ))}
        </ul>
      )}
      <h2 className="type-h2">Incidents and support</h2>
      {data.incidents.length === 0 ? (
        <p className="type-small">No incidents.</p>
      ) : (
        data.incidents.map((incident) => (
          <p key={incident.id} className="type-small">
            <Link className="png-link" href={`/ops/incidents/${incident.id}`}>
              {incident.title}
            </Link>{" "}
            · {incident.status} · {incident.severity}
          </p>
        ))
      )}
      <h2 className="type-h2">Audit</h2>
      {data.audit.length === 0 ? (
        <p className="type-small">No audit rows in scope.</p>
      ) : (
        data.audit.map((row) => (
          <p key={row.id} className="type-caption">
            {row.createdAt} · {row.action} · {row.actorId}
          </p>
        ))
      )}
    </div>
  );
}
