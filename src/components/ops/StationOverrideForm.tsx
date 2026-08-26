"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export function StationOverrideForm({ connectorId }: { connectorId: string }) {
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("offline");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const response = await fetch("/api/ops/stations/override", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connectorId,
        recordedStatus: status,
        reason,
        expiresAt,
        source: "operator_override",
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Override was not saved.");
      return;
    }
    setMessage("Override recorded with expiry and audit.");
  }

  return (
    <form
      className="enquiry-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="type-small" style={{ margin: 0 }}>
        Status override for connector <span className="font-mono">{connectorId.slice(0, 8)}</span>
      </p>
      <label className="field-label" htmlFor={`status-${connectorId}`}>
        Recorded status
      </label>
      <select id={`status-${connectorId}`} className="field-control" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="offline">Offline</option>
        <option value="faulted">Faulted</option>
        <option value="in_use">In use</option>
        <option value="unknown">Unknown</option>
        <option value="available">Available (freshness still applies)</option>
      </select>
      <TextInput label="Reason (min 8 characters)" name={`reason-${connectorId}`} value={reason} onChange={(event) => setReason(event.target.value)} />
      <TextInput
        label="Expiry (ISO timestamp)"
        name={`expires-${connectorId}`}
        value={expiresAt}
        onChange={(event) => setExpiresAt(event.target.value)}
        help="Override expires and is audited. It is not a charger command."
      />
      <Button type="submit" size="sm">
        Record override
      </Button>
      {error ? <Alert variant="error" title="Not saved">{error}</Alert> : null}
      {message ? <Alert variant="success" title="Saved">{message}</Alert> : null}
    </form>
  );
}
