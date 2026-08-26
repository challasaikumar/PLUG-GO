"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export function CreateIncidentForm() {
  const [stationId, setStationId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const response = await fetch("/api/ops/incidents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stationId, title, summary, severity }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Incident was not created.");
      return;
    }
    setMessage("Incident opened.");
  }

  return (
    <form
      className="enquiry-form"
      style={{ margin: "16px 0 24px" }}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <TextInput label="Station id" name="stationId" value={stationId} onChange={(event) => setStationId(event.target.value)} />
      <TextInput label="Title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <TextInput label="Summary" name="summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
      <label className="field-label" htmlFor="severity-new">
        Severity
      </label>
      <select id="severity-new" className="field-control" value={severity} onChange={(event) => setSeverity(event.target.value)}>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <Button type="submit" size="sm">
        Open incident
      </Button>
      {error ? <Alert variant="error" title="Not created">{error}</Alert> : null}
      {message ? <Alert variant="success" title="Created">{message}</Alert> : null}
    </form>
  );
}

export function SuggestIncidentsButton() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div style={{ marginBottom: 16 }}>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          setError(null);
          const response = await fetch("/api/ops/incidents/suggest", { method: "POST" });
          const data = (await response.json()) as { ok?: boolean; error?: string; created?: string[]; skippedOpen?: string[] };
          if (!response.ok || !data.ok) {
            setError(data.error ?? "Suggest failed.");
            return;
          }
          setMessage(`Created ${data.created?.length ?? 0}. Open incidents were not closed on reconnect (${data.skippedOpen?.length ?? 0} already open).`);
        }}
      >
        Suggest from operational signals
      </Button>
      {error ? <Alert variant="error" title="Not completed">{error}</Alert> : null}
      {message ? <Alert variant="info" title="Suggestions">{message}</Alert> : null}
    </div>
  );
}
