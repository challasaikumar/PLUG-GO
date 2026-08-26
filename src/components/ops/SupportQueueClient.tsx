"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { SUPPORT_TEMPLATES } from "@/lib/ops/support-templates";

export function SupportQueueClient({
  tickets,
}: {
  tickets: Array<{
    id: string;
    publicReference: string;
    category: string;
    status: string;
    station: { name: string } | null;
    description: string;
  }>;
}) {
  const [body, setBody] = useState<string>(SUPPORT_TEMPLATES[0]?.body ?? "");
  const [templateId, setTemplateId] = useState<string>(SUPPORT_TEMPLATES[0]?.id ?? "");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, payload: object) {
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Not completed.");
      return;
    }
    setMessage("Saved.");
  }

  if (tickets.length === 0) {
    return (
      <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
        No tickets in this filter. The public /support form is separate from this queue.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {tickets.map((ticket) => (
        <article key={ticket.id} className="ops-list-card">
          <p className="type-caption font-mono">{ticket.publicReference}</p>
          <h2 className="type-h3" style={{ margin: "4px 0" }}>
            {ticket.category.replaceAll("_", " ")} · {ticket.status}
          </h2>
          <p className="type-small">{ticket.station?.name ?? "No station"}</p>
          <p className="type-small">{ticket.description}</p>
          <label className="field-label" htmlFor={`tpl-${ticket.id}`}>
            Canned template (edit before sending)
          </label>
          <select
            id={`tpl-${ticket.id}`}
            className="field-control"
            value={templateId}
            onChange={(event) => {
              const next = SUPPORT_TEMPLATES.find((row) => row.id === event.target.value);
              setTemplateId(event.target.value);
              if (next) setBody(next.body);
            }}
          >
            {SUPPORT_TEMPLATES.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
          <textarea className="field-control" rows={4} value={body} onChange={(event) => setBody(event.target.value)} />
          <div className="ops-actions">
            <Button size="sm" onClick={() => void post(`/api/ops/support/${ticket.id}/note`, { body, customerVisible: true, templateId })}>
              Customer-visible reply
            </Button>
            <Button size="sm" variant="outline" onClick={() => void post(`/api/ops/support/${ticket.id}/note`, { body, customerVisible: false, templateId })}>
              Internal note
            </Button>
          </div>
          <TextInput label="Assign to actor id" name={`asg-${ticket.id}`} value={assignee} onChange={(event) => setAssignee(event.target.value)} />
          <Button size="sm" variant="secondary" onClick={() => void post(`/api/ops/support/${ticket.id}/assign`, { assigneeActorId: assignee })}>
            Assign
          </Button>
        </article>
      ))}
      {error ? <Alert variant="error" title="Not completed">{error}</Alert> : null}
      {message ? <Alert variant="success" title="Updated">{message}</Alert> : null}
    </div>
  );
}
