"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldRequired } from "@/components/ui/FieldRequired";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { sessionStatusCopy } from "@/lib/ocpp/sessions";
import { freshnessCopy, type PublicStatus } from "@/lib/status";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { FIELD_LIMITS, validateMinText } from "@/lib/fields";

type SessionView = {
  publicRef: string;
  status: string;
  stationName: string;
  stationSlug: string;
  stationCity: string;
  connectorPublicRef: string;
  connectorType: string;
  maxKw: number;
  lastUpdatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastEvidenceAt: string | null;
  energyKwh: string | null;
  meterUnit: string | null;
  failReason: string | null;
  supportReference: string | null;
};

function reconnectDelay(attempt: number): number {
  return Math.min(15_000, 500 * 2 ** attempt);
}

export function SessionClient({ initial }: { initial: SessionView }) {
  const router = useRouter();
  const [session, setSession] = useState(initial);
  const [streamState, setStreamState] = useState<"live" | "reconnect" | "offline">("live");
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState("");
  const [detailsError, setDetailsError] = useState<string | undefined>();
  const copy = sessionStatusCopy(session.status as Parameters<typeof sessionStatusCopy>[0]);

  useEffect(() => {
    let closed = false;
    let attempt = 0;
    let source: EventSource | null = null;
    let timer: number | null = null;
    const seen = new Set<string>();

    const connect = () => {
      if (closed) return;
      source = new EventSource(
        `/api/realtime/sse?scope=session&sessionId=${encodeURIComponent(initial.publicRef)}`,
      );
      source.addEventListener("hello", () => {
        setStreamState("live");
        attempt = 0;
      });
      source.addEventListener("session", (event) => {
        if (seen.has(event.lastEventId)) return;
        if (event.lastEventId) seen.add(event.lastEventId);
        try {
          const payload = JSON.parse(event.data) as {
            status: string;
            lastUpdatedAt: string;
            energyMilliWh: string | null;
            startedAt: string | null;
            endedAt: string | null;
          };
          setSession((current) => ({
            ...current,
            status: payload.status,
            lastUpdatedAt: payload.lastUpdatedAt,
            startedAt: payload.startedAt,
            endedAt: payload.endedAt,
            energyKwh:
              payload.status === "charging" || payload.status === "completed" || payload.status === "stopping"
                ? current.energyKwh
                : null,
          }));
          router.refresh();
        } catch {
          // Ignore malformed frames.
        }
      });
      source.onerror = () => {
        setStreamState("reconnect");
        source?.close();
        const delay = reconnectDelay(attempt);
        attempt += 1;
        if (attempt > 8) {
          setStreamState("offline");
          return;
        }
        timer = window.setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      closed = true;
      source?.close();
      if (timer) window.clearTimeout(timer);
    };
  }, [initial.publicRef, router]);

  async function stop() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(session.publicRef)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ action: "stop" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Stop could not be sent.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function support(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateMinText(details, 8, "Describe what happened.");
    if (issue) {
      setDetailsError(issue);
      return;
    }
    setDetailsError(undefined);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(session.publicRef)}/support`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details: details.trim() }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; publicReference?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Support request failed.");
        return;
      }
      setTicket(data.publicReference ?? session.supportReference);
      setDetails("");
    } finally {
      setLoading(false);
    }
  }

  const canStop = session.status === "charging";
  const statusForChip: PublicStatus =
    session.status === "charging"
      ? "in_use"
      : session.status === "failed" || session.status === "timed_out"
        ? "offline"
        : session.status === "completed"
          ? "available"
          : "unknown";

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {streamState === "reconnect" ? (
        <Alert variant="warning" title="Reconnecting to session updates">
          A browser reconnect is not a charger reconnect. Status below is the last verified evidence.
        </Alert>
      ) : null}
      {streamState === "offline" ? (
        <Alert variant="warning" title="Live updates paused">
          Refresh this page. Offline here means the website stream, not necessarily the charger.
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" title="Not completed">
          {error}
        </Alert>
      ) : null}
      <div className="paper-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AvailabilityChip status={statusForChip} />
          <DataFreshness
            label={freshnessCopy({ status: statusForChip, statusUpdatedAt: session.lastUpdatedAt })}
            status={statusForChip}
          />
        </div>
        <h2 className="type-h2" style={{ marginTop: 12 }}>
          {copy.title}
        </h2>
        <p className="type-body">{copy.body}</p>
        <dl className="type-body" style={{ marginTop: 16 }}>
          <div>
            <dt>Station</dt>
            <dd>
              {session.stationName}, {session.stationCity}
            </dd>
          </div>
          <div>
            <dt>Connector</dt>
            <dd>
              {connectorTypeLabel(session.connectorType)} · {session.maxKw} kW · {session.connectorPublicRef}
            </dd>
          </div>
          <div>
            <dt>Start / end</dt>
            <dd>
              {session.startedAt ? new Date(session.startedAt).toLocaleString("en-IN") : "Not evidenced yet"}
              {" – "}
              {session.endedAt ? new Date(session.endedAt).toLocaleString("en-IN") : "—"}
            </dd>
          </div>
          <div>
            <dt>Energy</dt>
            <dd>
              {session.energyKwh
                ? `${session.energyKwh} kWh${session.meterUnit ? ` (from ${session.meterUnit})` : ""}`
                : "Shown only after verified meter or transaction evidence."}
            </dd>
          </div>
          <div>
            <dt>Support reference</dt>
            <dd className="font-mono">{session.supportReference ?? "—"}</dd>
          </div>
        </dl>
        {canStop ? (
          <Button type="button" variant="outline" loading={loading} onClick={() => void stop()}>
            Stop charging
          </Button>
        ) : null}
      </div>
      <form className="paper-card enquiry-form" style={{ padding: 20 }} onSubmit={(event) => void support(event)}>
        <h2 className="type-h3">Need help</h2>
        <p className="type-small">
          Include what you see on the charger. Do not send passwords, certificates, or card details.
        </p>
        {ticket ? (
          <Alert variant="success" title="Support request received">
            Reference {ticket}.
          </Alert>
        ) : null}
        <label className="field-label" htmlFor="session-help">
          What happened
          <FieldRequired />
        </label>
        <div className={`field-control${detailsError ? " field-control--error" : ""}`}>
          <textarea
            id="session-help"
            name="details"
            required
            minLength={8}
            maxLength={FIELD_LIMITS.messageMax}
            value={details}
            aria-invalid={detailsError ? true : undefined}
            onChange={(event) => {
              setDetails(event.target.value);
              if (detailsError) setDetailsError(undefined);
            }}
            onBlur={() => setDetailsError(validateMinText(details, 8, "Describe what happened."))}
          />
        </div>
        {detailsError ? (
          <p className="field-error" role="alert">
            {detailsError}
          </p>
        ) : null}
        <Button type="submit" variant="secondary" loading={loading}>
          Send support request
        </Button>
      </form>
    </div>
  );
}
