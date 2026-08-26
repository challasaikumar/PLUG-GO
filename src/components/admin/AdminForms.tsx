"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChargePointCommissionForm } from "@/components/admin/ChargePointCommissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

type ApiResult = { ok: boolean; error?: string; errors?: Record<string, string> };

async function api(path: string, method: string, body?: unknown): Promise<ApiResult & Record<string, unknown>> {
  const response = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as ApiResult & Record<string, unknown>;
  return data;
}

function ErrorBox({ result }: { result: ApiResult | null }) {
  if (!result || result.ok) return null;
  return (
    <Alert variant="error" title="Not saved">
      {result.error}
      {result.errors ? (
        <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
          {Object.entries(result.errors).map(([key, message]) => (
            <li key={key}>
              {key}: {message}
            </li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}

export function CreateStationForm({
  organisations,
  hosts,
}: {
  organisations: Array<{ id: string; brandName: string; isDemo: boolean }>;
  hosts: Array<{ id: string; hostDisplayName: string; organisationId: string; isDemo: boolean }>;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const payload = {
      organisationId: String(form.get("organisationId") ?? ""),
      hostId: String(form.get("hostId") ?? ""),
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      pincode: String(form.get("pincode") ?? ""),
      addressLine1: String(form.get("addressLine1") ?? ""),
      landmark: String(form.get("landmark") ?? ""),
      arrivalInstructions: String(form.get("arrivalInstructions") ?? ""),
      latitude: String(form.get("latitude") ?? ""),
      longitude: String(form.get("longitude") ?? ""),
      accessHoursSummary: String(form.get("accessHoursSummary") ?? ""),
      accessType: String(form.get("accessType") ?? "unknown"),
      dataSource: "operator_admin",
    };
    const data = await api("/api/admin/stations", "POST", payload);
    setResult(data);
    setLoading(false);
    if (data.ok && data.station && typeof data.station === "object" && "id" in data.station) {
      router.push(`/admin/stations/${(data.station as { id: string }).id}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="enquiry-form" style={{ maxWidth: 560 }}>
      <ErrorBox result={result} />
      <label className="field-label" htmlFor="organisationId">
        Organisation
      </label>
      <div className="field-control">
        <select id="organisationId" name="organisationId" required>
          <option value="">Select</option>
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.brandName}
              {org.isDemo ? " (demo — cannot publish)" : ""}
            </option>
          ))}
        </select>
      </div>
      <label className="field-label" htmlFor="hostId">
        Host
      </label>
      <div className="field-control">
        <select id="hostId" name="hostId" required>
          <option value="">Select</option>
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.hostDisplayName}
              {host.isDemo ? " (demo)" : ""}
            </option>
          ))}
        </select>
      </div>
      <TextInput label="Station name" name="name" required />
      <TextInput label="Slug (optional)" name="slug" help="Public-safe URL key. Leave blank to generate." />
      <TextInput label="City" name="city" required />
      <TextInput label="State / UT" name="state" required />
      <TextInput label="Pincode" name="pincode" required />
      <TextInput label="Address line 1" name="addressLine1" required />
      <TextInput label="Landmark" name="landmark" />
      <TextInput label="Latitude" name="latitude" required />
      <TextInput label="Longitude" name="longitude" required />
      <TextInput label="Hours summary" name="accessHoursSummary" required />
      <TextInput label="Arrival instructions" name="arrivalInstructions" />
      <Button type="submit" loading={loading} disabled={loading}>
        Create draft station
      </Button>
    </form>
  );
}

type StationDetail = {
  id: string;
  name: string;
  slug: string;
  publicationStatus: string;
  isDemo: boolean;
  city: string;
  state: string;
  pincode: string;
  addressLine1: string;
  landmark: string | null;
  arrivalInstructions: string | null;
  accessHoursSummary: string;
  latitude: string | number;
  longitude: string | number;
  organisationId: string;
  hostId: string;
  lastVerifiedAt: string | null;
  evses: Array<{
    id: string;
    evseLabel: string;
    maxPowerWatts: number;
    powerType: string;
    connectors: Array<{
      id: string;
      publicRef: string;
      connectorIndex: number;
      connectorType: string;
      maxPowerWatts: number;
      currentStatus: { recordedStatus: string; statusUpdatedAt: string } | null;
    }>;
  }>;
  tariffs: Array<{
    id: string;
    approvalStatus: string;
    energyPaisePerKwh: number;
    gstRateBps: number;
    effectiveFrom: string;
  }>;
};

export function StationWorkbench({
  station,
  audit,
}: {
  station: StationDetail;
  audit: Array<{ id: string; action: string; actorRole: string; createdAt: string; afterSummary: unknown }>;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const refresh = () => router.refresh();

  async function post(path: string, body?: unknown) {
    const data = await api(path, "POST", body);
    setResult(data);
    if (data.ok) refresh();
  }

  async function patch(path: string, body: unknown) {
    const data = await api(path, "PATCH", body);
    setResult(data);
    if (data.ok) refresh();
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <ErrorBox result={result} />

      <section>
        <h2 className="type-h2">Facts</h2>
        <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
          Status: <strong>{station.publicationStatus}</strong>
          {station.isDemo ? " · DEMO (cannot be published)" : ""} · last verified{" "}
          {station.lastVerifiedAt ? new Date(station.lastVerifiedAt).toISOString() : "never"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
          <Button size="sm" onClick={() => post(`/api/admin/stations/${station.id}/verify`, { scope: "facts" })}>
            Record verification
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => post(`/api/admin/stations/${station.id}/publish`)}
            disabled={station.isDemo}
          >
            Publish
          </Button>
          <Button size="sm" variant="outline" onClick={() => post(`/api/admin/stations/${station.id}/archive`)}>
            Archive
          </Button>
          <Button href={`/admin/stations/${station.id}/booking`} size="sm" variant="outline">
            Booking policy
          </Button>
        </div>
        <form
          className="enquiry-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void patch(`/api/admin/stations/${station.id}`, {
              organisationId: station.organisationId,
              hostId: station.hostId,
              name: String(form.get("name")),
              slug: station.slug,
              city: String(form.get("city")),
              state: String(form.get("state")),
              pincode: String(form.get("pincode")),
              addressLine1: String(form.get("addressLine1")),
              landmark: String(form.get("landmark")),
              arrivalInstructions: String(form.get("arrivalInstructions")),
              latitude: String(form.get("latitude")),
              longitude: String(form.get("longitude")),
              accessHoursSummary: String(form.get("accessHoursSummary")),
              accessType: "unknown",
              dataSource: "operator_admin",
            });
          }}
        >
          <TextInput label="Name" name="name" defaultValue={station.name} />
          <TextInput label="City" name="city" defaultValue={station.city} />
          <TextInput label="State" name="state" defaultValue={station.state} />
          <TextInput label="Pincode" name="pincode" defaultValue={station.pincode} />
          <TextInput label="Address" name="addressLine1" defaultValue={station.addressLine1} />
          <TextInput label="Landmark" name="landmark" defaultValue={station.landmark ?? ""} />
          <TextInput label="Latitude" name="latitude" defaultValue={String(station.latitude)} />
          <TextInput label="Longitude" name="longitude" defaultValue={String(station.longitude)} />
          <TextInput label="Hours summary" name="accessHoursSummary" defaultValue={station.accessHoursSummary} />
          <TextInput
            label="Arrival instructions"
            name="arrivalInstructions"
            defaultValue={station.arrivalInstructions ?? ""}
          />
          <Button type="submit">Save facts</Button>
        </form>
      </section>

      <section>
        <h2 className="type-h2">EVSE and connectors</h2>
        {station.evses.length === 0 ? (
          <p className="type-small">No EVSE recorded yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>EVSE</th>
                  <th>Connector</th>
                  <th>Type</th>
                  <th>kW</th>
                  <th>Recorded status</th>
                </tr>
              </thead>
              <tbody>
                {station.evses.flatMap((evse) =>
                  evse.connectors.length
                    ? evse.connectors.map((connector) => (
                        <tr key={connector.id}>
                          <td>{evse.evseLabel}</td>
                          <td className="font-mono">{connector.connectorIndex}</td>
                          <td>{connector.connectorType}</td>
                          <td>{connector.maxPowerWatts / 1000}</td>
                          <td>{connector.currentStatus?.recordedStatus ?? "unknown"}</td>
                        </tr>
                      ))
                    : [
                        <tr key={evse.id}>
                          <td>{evse.evseLabel}</td>
                          <td colSpan={4}>No connector on this EVSE</td>
                        </tr>,
                      ],
                )}
              </tbody>
            </table>
          </div>
        )}
        <form
          className="enquiry-form"
          style={{ marginTop: 16 }}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void post(`/api/admin/stations/${station.id}/evses`, {
              evseLabel: String(form.get("evseLabel")),
              maxPowerWatts: Number(form.get("maxPowerWatts")),
              powerType: String(form.get("powerType")),
              installationStatus: "installed",
              dataSource: "operator_admin",
            });
          }}
        >
          <h3 className="type-h3">Add EVSE</h3>
          <TextInput label="Label" name="evseLabel" placeholder="Charger A" />
          <TextInput label="Max power (watts)" name="maxPowerWatts" type="number" defaultValue="60000" />
          <label className="field-label" htmlFor="powerType">
            Power type
          </label>
          <div className="field-control">
            <select id="powerType" name="powerType" defaultValue="dc">
              <option value="dc">DC</option>
              <option value="ac">AC</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <Button type="submit" size="sm">
            Add EVSE
          </Button>
        </form>
        {station.evses.map((evse) => (
          <form
            key={evse.id}
            className="enquiry-form"
            style={{ marginTop: 16 }}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void post(`/api/admin/evses/${evse.id}/connectors`, {
                connectorIndex: Number(form.get("connectorIndex")),
                connectorType: String(form.get("connectorType")),
                maxPowerWatts: Number(form.get("maxPowerWatts")),
                installationStatus: "installed",
                dataSource: "operator_admin",
              });
            }}
          >
            <h3 className="type-h3">Add connector to {evse.evseLabel}</h3>
            <TextInput label="Index" name="connectorIndex" type="number" defaultValue="1" />
            <label className="field-label" htmlFor={`type-${evse.id}`}>
              Connector type
            </label>
            <div className="field-control">
              <select id={`type-${evse.id}`} name="connectorType" defaultValue="ccs2">
                <option value="ccs2">CCS2</option>
                <option value="type2_ac">Type 2 AC</option>
                <option value="bharat_dc_001">Bharat DC-001</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <TextInput label="Max power (watts)" name="maxPowerWatts" type="number" defaultValue={String(evse.maxPowerWatts)} />
            <Button type="submit" size="sm">
              Add connector
            </Button>
          </form>
        ))}
        <form
          className="enquiry-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void post("/api/admin/status-overrides", {
              connectorId: String(form.get("connectorId")),
              recordedStatus: String(form.get("recordedStatus")),
              reason: String(form.get("reason")),
              expiresAt: String(form.get("expiresAt")),
              source: "operator_override",
            });
          }}
        >
          <h3 className="type-h3">Status override</h3>
          <p className="field-help">Requires a reason and expiry. Manual imports cannot be recorded as Available.</p>
          <label className="field-label" htmlFor="connectorId">
            Connector
          </label>
          <div className="field-control">
            <select id="connectorId" name="connectorId" required>
              <option value="">Select</option>
              {station.evses.flatMap((evse) =>
                evse.connectors.map((connector) => (
                  <option key={connector.id} value={connector.id}>
                    {evse.evseLabel} · {connector.connectorType} #{connector.connectorIndex}
                  </option>
                )),
              )}
            </select>
          </div>
          <label className="field-label" htmlFor="recordedStatus">
            Recorded status
          </label>
          <div className="field-control">
            <select id="recordedStatus" name="recordedStatus" defaultValue="unknown">
              <option value="unknown">Unknown</option>
              <option value="offline">Offline</option>
              <option value="faulted">Faulted</option>
              <option value="in_use">In use</option>
              <option value="available">Available</option>
            </select>
          </div>
          <TextInput label="Reason" name="reason" required />
          <TextInput label="Expires at (ISO)" name="expiresAt" placeholder="2026-08-25T18:00:00.000Z" required />
          <Button type="submit" size="sm" variant="outline">
            Record override
          </Button>
        </form>
      </section>

      <section>
        <h2 className="type-h2">Tariffs</h2>
        {station.tariffs.length === 0 ? (
          <p className="type-small">No tariff versions yet. Price will stay unpublished.</p>
        ) : (
          <ul className="type-small">
            {station.tariffs.map((tariff) => (
              <li key={tariff.id} style={{ marginBottom: 8 }}>
                <span className="font-mono">{tariff.id.slice(0, 8)}</span> · {tariff.approvalStatus} ·{" "}
                {tariff.energyPaisePerKwh} paise/kWh · GST {(tariff.gstRateBps / 100).toFixed(2)}% · from{" "}
                {new Date(tariff.effectiveFrom).toISOString()}
                {tariff.approvalStatus === "draft" ? (
                  <>
                    {" "}
                    <Button size="sm" variant="secondary" onClick={() => post(`/api/admin/tariffs/${tariff.id}/approve`)}>
                      Approve
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <form
          className="enquiry-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void post(`/api/admin/stations/${station.id}/tariffs`, {
              energyPaisePerKwh: Number(form.get("energyPaisePerKwh")),
              servicePaisePerKwh: Number(form.get("servicePaisePerKwh")),
              parkingPaiseFlat: Number(form.get("parkingPaiseFlat") || 0),
              parkingPaisePerMin: 0,
              idlePaisePerMin: Number(form.get("idlePaisePerMin") || 0),
              idleGraceMinutes: Number(form.get("idleGraceMinutes") || 0),
              reservationPaise: 0,
              gstRateBps: Number(form.get("gstRateBps")),
              discountKind: "none",
              discountValue: 0,
              effectiveFrom: String(form.get("effectiveFrom")),
              timeBand: "all_hours",
            });
          }}
        >
          <h3 className="type-h3">Create tariff draft</h3>
          <TextInput label="Energy paise / kWh" name="energyPaisePerKwh" type="number" defaultValue="1200" />
          <TextInput label="Service paise / kWh" name="servicePaisePerKwh" type="number" defaultValue="100" />
          <TextInput label="Parking paise (flat)" name="parkingPaiseFlat" type="number" defaultValue="0" />
          <TextInput label="Idle paise / minute" name="idlePaisePerMin" type="number" defaultValue="0" />
          <TextInput label="Idle grace minutes" name="idleGraceMinutes" type="number" defaultValue="0" />
          <TextInput label="GST basis points (1800 = 18%)" name="gstRateBps" type="number" defaultValue="1800" />
          <TextInput label="Effective from (ISO)" name="effectiveFrom" defaultValue={new Date().toISOString()} />
          <Button type="submit" size="sm">
            Save draft
          </Button>
        </form>
      </section>

      <section>
        <ChargePointCommissionForm
          stationId={station.id}
          evses={station.evses.map((evse) => ({
            id: evse.id,
            evseLabel: evse.evseLabel,
            connectors: evse.connectors.map((connector) => ({
              id: connector.id,
              publicRef: connector.publicRef,
              connectorIndex: connector.connectorIndex,
            })),
          }))}
        />
      </section>

      <section>
        <h2 className="type-h2">Audit</h2>
        {audit.length === 0 ? (
          <p className="type-small">No audit events yet.</p>
        ) : (
          <ol className="type-small" style={{ paddingLeft: 18 }}>
            {audit.map((event) => (
              <li key={event.id} style={{ marginBottom: 8 }}>
                {new Date(event.createdAt).toISOString()} · {event.actorRole} · {event.action}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
