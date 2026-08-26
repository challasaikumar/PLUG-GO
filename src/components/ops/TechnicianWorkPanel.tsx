"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

type ChecklistItem = { code: string; label: string; outcome: string | null };

export function TechnicianWorkPanel({
  workOrderId,
  status,
  checklist,
  evidenceCount,
}: {
  workOrderId: string;
  status: string;
  checklist: ChecklistItem[];
  evidenceCount: number;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
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

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="ops-actions">
        {status === "queued" || status === "paused" ? (
          <Button onClick={() => void post(`/api/ops/work-orders/${workOrderId}/transition`, { toStatus: "in_progress" })}>
            Start work
          </Button>
        ) : null}
        {status === "in_progress" ? (
          <Button variant="outline" onClick={() => void post(`/api/ops/work-orders/${workOrderId}/transition`, { toStatus: "paused" })}>
            Pause
          </Button>
        ) : null}
        {status === "in_progress" ? (
          <Button onClick={() => void post(`/api/ops/work-orders/${workOrderId}/transition`, { toStatus: "completed" })}>
            Complete
          </Button>
        ) : null}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {checklist.map((item) => (
          <li key={item.code} className="ops-list-card">
            <p className="type-small" style={{ margin: "0 0 8px" }}>
              {item.label}
              {item.outcome ? ` — ${item.outcome.replaceAll("_", " ")}` : " — not recorded"}
            </p>
            <div className="ops-actions">
              {(["pass", "fail", "not_applicable"] as const).map((outcome) => (
                <Button
                  key={outcome}
                  size="sm"
                  variant={item.outcome === outcome ? "primary" : "outline"}
                  onClick={() => void post(`/api/ops/work-orders/${workOrderId}/checklist`, { code: item.code, outcome })}
                >
                  {outcome.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="type-caption">Evidence on file: {evidenceCount}. Use an approved storage URL — do not paste secrets.</p>
      <TextInput label="Evidence URL (https)" name="url" value={url} onChange={(event) => setUrl(event.target.value)} />
      <TextInput label="Alt text" name="alt" value={alt} onChange={(event) => setAlt(event.target.value)} />
      <Button size="sm" variant="secondary" onClick={() => void post(`/api/ops/work-orders/${workOrderId}/evidence`, { storageUrl: url, altText: alt })}>
        Attach evidence reference
      </Button>
      {error ? <Alert variant="error" title="Not completed">{error}</Alert> : null}
      {message ? <Alert variant="success" title="Updated">{message}</Alert> : null}
    </div>
  );
}
