"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export function CommandRequestForm({
  stationId,
  connectorId,
  sessionPublicRef,
}: {
  stationId: string;
  connectorId?: string;
  sessionPublicRef?: string;
}) {
  const [station, setStation] = useState(stationId);
  const [action, setAction] = useState("remote_stop");
  const [reason, setReason] = useState("");
  const [sessionRef, setSessionRef] = useState(sessionPublicRef ?? "");
  const [mfa, setMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const response = await fetch("/api/ops/commands", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        stationId: station,
        connectorId,
        sessionPublicRef: sessionRef,
        reason,
        mfaAssertion: mfa,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; approval?: { id: string; status: string; riskNote: string } };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "The command was not requested.");
      return;
    }
    setMessage(`Recorded ${data.approval?.status}. ${data.approval?.riskNote ?? ""} Pending approval or break-glass. No OCPP was sent from this browser.`);
  }

  return (
    <form
      className="enquiry-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="type-h3" style={{ margin: 0 }}>
        Request remote command
      </p>
      <p className="type-small" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
        There is no generic “control charger” action. Reset and configuration are recorded as denied in this phase.
        Dispatch uses the Phase 9 command service only after approval or time-limited break-glass.
      </p>
      <TextInput label="Station id" name="stationId" value={station} onChange={(event) => setStation(event.target.value)} />
      <label className="field-label" htmlFor="cmd-action">
        Action
      </label>
      <select id="cmd-action" className="field-control" value={action} onChange={(event) => setAction(event.target.value)}>
        <option value="remote_stop">Remote stop (session)</option>
        <option value="remote_start">Remote start (not dispatched from ops)</option>
        <option value="reset">Reset (not implemented)</option>
        <option value="change_configuration">Change configuration (not implemented)</option>
      </select>
      <TextInput label="Session public reference" name="sessionPublicRef" value={sessionRef} onChange={(event) => setSessionRef(event.target.value)} />
      <TextInput label="Reason" name="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      <label className="type-small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={mfa} onChange={(event) => setMfa(event.target.checked)} />
        MFA assertion — this workstation is MFA-protected (production still requires an identity provider)
      </label>
      <Button type="submit" size="sm" variant="secondary">
        Request (does not send OCPP)
      </Button>
      {error ? <Alert variant="error" title="Not requested">{error}</Alert> : null}
      {message ? <Alert variant="info" title="Recorded">{message}</Alert> : null}
    </form>
  );
}

export function CommandApproveBar({ approvalId, canApprove, canBreakGlass }: { approvalId: string; canApprove: boolean; canBreakGlass: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, body?: object) {
    setError(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Not completed.");
      return;
    }
    setMessage("Recorded. If staff remote commands are disabled, nothing was dispatched.");
  }

  return (
    <div className="ops-actions">
      {canApprove ? (
        <Button size="sm" onClick={() => void post(`/api/ops/commands/${approvalId}/approve`)}>
          Approve
        </Button>
      ) : null}
      {canBreakGlass ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={() =>
            void post(`/api/ops/commands/${approvalId}/break-glass`, {
              expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            })
          }
        >
          Break-glass (10 min)
        </Button>
      ) : null}
      {canApprove ? (
        <Button size="sm" variant="outline" onClick={() => void post(`/api/ops/commands/${approvalId}/reject`)}>
          Reject
        </Button>
      ) : null}
      {error ? <Alert variant="error" title="Not completed">{error}</Alert> : null}
      {message ? <Alert variant="info" title="Updated">{message}</Alert> : null}
    </div>
  );
}
