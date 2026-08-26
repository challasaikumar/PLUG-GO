"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type FlagRow = {
  key: string;
  envName: string;
  envEnabled: boolean;
  enabled: boolean;
  staffOverride: boolean | null;
  dependencyBlock: string | null;
  envOnly: boolean;
};

export function OpsFlagsForm({ flags }: { flags: FlagRow[] }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(flagKey: string, enabled: boolean) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/ops/flags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flagKey, enabled, reason }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The flag could not be updated.");
      return;
    }
    setMessage(`${flagKey} is now ${enabled ? "allowed by staff override" : "staff-disabled"}. Reload to confirm.`);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {error ? <Alert variant="error" title="Flag change rejected">{error}</Alert> : null}
      {message ? <Alert variant="success" title="Audit recorded">{message}</Alert> : null}
      <label className="field-label" htmlFor="flag-reason">
        Reason (required, audited)
        <textarea
          id="flag-reason"
          className="field-control"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          style={{ display: "block", width: "100%", marginTop: 8, minHeight: 88, padding: 12 }}
        />
      </label>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Env</th>
              <th>Effective</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.key}>
                <td>
                  <code>{flag.key}</code>
                  <div className="type-caption">{flag.envName}</div>
                </td>
                <td>{flag.envEnabled ? "true" : "false"}</td>
                <td>
                  {flag.enabled ? "on" : "off"}
                  {flag.dependencyBlock ? ` (${flag.dependencyBlock})` : ""}
                </td>
                <td>
                  {flag.envOnly ? (
                    "Env only"
                  ) : (
                    <span className="ops-actions">
                      <Button type="button" size="sm" variant="outline" onClick={() => void submit(flag.key, false)}>
                        Disable
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void submit(flag.key, true)}>
                        Clear disable
                      </Button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
