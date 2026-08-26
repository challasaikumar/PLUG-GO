"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export function IncidentActions({
  incidentId,
  canAssign,
  canVerify,
  canWrite,
}: {
  incidentId: string;
  canAssign: boolean;
  canVerify: boolean;
  canWrite: boolean;
}) {
  const [technicianId, setTechnicianId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, body: object) {
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Not completed.");
      return;
    }
    setMessage("Saved.");
  }

  if (!canWrite) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="ops-actions">
        {["acknowledged", "diagnosing", "resolved", "verification_required", "closed"].map((status) => (
          <Button key={status} size="sm" variant="outline" onClick={() => void post(`/api/ops/incidents/${incidentId}/transition`, { toStatus: status })}>
            {status.replaceAll("_", " ")}
          </Button>
        ))}
      </div>
      <TextInput label="Internal note" name="note" value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="ops-actions">
        <Button size="sm" variant="secondary" onClick={() => void post(`/api/ops/incidents/${incidentId}/note`, { body: note, customerVisible: false })}>
          Save internal note
        </Button>
        <Button size="sm" variant="outline" onClick={() => void post(`/api/ops/incidents/${incidentId}/note`, { body: note, customerVisible: true })}>
          Customer-visible note
        </Button>
        <Button size="sm" variant="outline" onClick={() => void post(`/api/ops/incidents/${incidentId}/escalate`, { body: note || "Escalated to vendor." })}>
          Escalate to vendor
        </Button>
        {canVerify ? (
          <Button size="sm" onClick={() => void post(`/api/ops/incidents/${incidentId}/verify`, {})}>
            Verify resolution
          </Button>
        ) : null}
      </div>
      {canAssign ? (
        <div className="ops-actions">
          <TextInput label="Technician actor id" name="tech" value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} />
          <Button size="sm" onClick={() => void post(`/api/ops/incidents/${incidentId}/assign`, { technicianActorId: technicianId })}>
            Assign technician
          </Button>
        </div>
      ) : null}
      {error ? <Alert variant="error" title="Not completed">{error}</Alert> : null}
      {message ? <Alert variant="success" title="Updated">{message}</Alert> : null}
    </div>
  );
}
