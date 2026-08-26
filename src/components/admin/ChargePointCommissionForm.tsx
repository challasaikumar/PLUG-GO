"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

type Connector = { id: string; publicRef: string; connectorIndex: number };
type Evse = { id: string; evseLabel: string; connectors: Connector[] };

export function ChargePointCommissionForm({
  stationId,
  evses,
}: {
  stationId: string;
  evses: Evse[];
}) {
  const [result, setResult] = useState<{
    ok: boolean;
    error?: string;
    errors?: Record<string, string>;
    oneTimePassword?: string;
    notice?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const connectors = evses.flatMap((evse) =>
    evse.connectors.map((connector) => ({
      ...connector,
      label: `${evse.evseLabel} · ${connector.publicRef}`,
    })),
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const connectorId = String(form.get("connectorId") ?? "");
    const ocppConnectorId = String(form.get("ocppConnectorId") ?? "1");
    setLoading(true);
    const response = await fetch("/api/admin/charge-points", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        stationId,
        identity: String(form.get("identity") ?? ""),
        protocolVersion: "ocpp_1_6",
        vendor: String(form.get("vendor") ?? ""),
        model: String(form.get("model") ?? ""),
        serialNumber: String(form.get("serialNumber") ?? ""),
        firmwareVersion: String(form.get("firmwareVersion") ?? ""),
        commissioningState: String(form.get("commissioningState") ?? "test"),
        securityProfile: "basic_auth",
        connectorMappings: connectorId
          ? [{ connectorId, ocppConnectorId: Number.parseInt(ocppConnectorId, 10) }]
          : [],
      }),
    });
    const data = (await response.json()) as typeof result;
    setResult(data);
    setLoading(false);
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="enquiry-form" style={{ maxWidth: 560 }}>
      <h2 className="type-h2">Charge point (OCPP 1.6)</h2>
      <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
        Staff-only. Do not publish identities, serials, WSS URLs, or passwords. OCPP 2.0.1/2.1 stay stubs until a
        verified charger requires them. Production commissioning is blocked here.
      </p>
      {result && !result.ok ? (
        <Alert variant="error" title="Not saved">
          {result.error}
        </Alert>
      ) : null}
      {result?.ok && result.oneTimePassword ? (
        <Alert variant="warning" title="One-time charger password">
          {result.notice} Password: <span className="font-mono">{result.oneTimePassword}</span>
        </Alert>
      ) : null}
      <TextInput name="identity" label="Charge point identity" required />
      <TextInput name="vendor" label="Vendor (from inventory)" />
      <TextInput name="model" label="Model" />
      <TextInput name="serialNumber" label="Serial number (staff only)" />
      <TextInput name="firmwareVersion" label="Firmware" />
      <label className="field-label" htmlFor="cp-state">
        Commissioning state
      </label>
      <div className="field-control">
        <select id="cp-state" name="commissioningState" defaultValue="test">
          <option value="draft">Draft</option>
          <option value="test">Test</option>
          <option value="pilot">Pilot</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <label className="field-label" htmlFor="cp-connector">
        Mapped connector
      </label>
      <div className="field-control">
        <select id="cp-connector" name="connectorId">
          <option value="">None yet</option>
          {connectors.map((connector) => (
            <option key={connector.id} value={connector.id}>
              {connector.label}
            </option>
          ))}
        </select>
      </div>
      <TextInput name="ocppConnectorId" label="OCPP connector id" defaultValue="1" />
      <Button type="submit" size="sm" loading={loading}>
        Create test/pilot charge point
      </Button>
    </form>
  );
}
