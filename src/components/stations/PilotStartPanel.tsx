"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { connectorTypeLabel } from "@/lib/catalogue/labels";

export type PilotConnector = {
  connectorId: string;
  connectorPublicRef: string;
  evseHint: string;
  connectorType: string;
  maxKw: number;
};

export function PilotStartPanel({
  connectors,
  stationSlug,
}: {
  connectors: PilotConnector[];
  stationSlug: string;
}) {
  const router = useRouter();
  const [connectorId, setConnectorId] = useState(connectors[0]?.connectorId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/sessions/start", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          connectorId,
          reason: `pilot_start:${stationSlug}`,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sessionId?: string;
      };
      if (!response.ok || !data.ok || !data.sessionId) {
        setError(data.error ?? "Remote start is not available.");
        return;
      }
      router.push(`/session/${encodeURIComponent(data.sessionId)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section" aria-labelledby="pilot-charge-heading">
      <h2 id="pilot-charge-heading" className="type-h2">
        Pilot remote start
      </h2>
      <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
        This control is shown only because this station, connector, and signed-in driver are on the Test/Pilot
        allow-list. A charger “Accepted” response is not a completed charge and does not create an energy invoice.
      </p>
      {error ? (
        <Alert variant="error" title="Start not sent">
          {error}
        </Alert>
      ) : null}
      <label className="field-label" htmlFor="pilot-connector">
        Connector
      </label>
      <div className="field-control">
        <select id="pilot-connector" value={connectorId} onChange={(event) => setConnectorId(event.target.value)}>
          {connectors.map((connector) => (
            <option key={connector.connectorId} value={connector.connectorId}>
              {connectorTypeLabel(connector.connectorType)} · {connector.maxKw} kW · {connector.evseHint}
            </option>
          ))}
        </select>
      </div>
      <Button type="button" loading={loading} onClick={() => void start()}>
        Start charging
      </Button>
    </section>
  );
}
