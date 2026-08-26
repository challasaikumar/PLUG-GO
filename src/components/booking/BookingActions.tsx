"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import {
  BOOKING_SUPPORT_CATEGORIES,
  bookingSupportLabel,
  type BookingSupportCategory,
} from "@/lib/booking/support";
import { FIELD_LIMITS, validateMinText } from "@/lib/fields";
import { FieldRequired } from "@/components/ui/FieldRequired";

export function BookingActions({
  publicRef,
  canCancel,
  waitingForWebhook,
}: {
  publicRef: string;
  canCancel: boolean;
  waitingForWebhook: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [category, setCategory] = useState<BookingSupportCategory>("general_issue");
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cancel() {
    const issue = validateMinText(reason, 8, "Enter a cancellation reason.");
    if (issue) {
      setReasonError(issue);
      return;
    }
    setReasonError(undefined);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(publicRef)}/cancel`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "This booking could not be cancelled.");
        return;
      }
      track(ANALYTICS_EVENTS.booking_cancelled);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function openSupport(event: React.FormEvent) {
    event.preventDefault();
    const issue = validateMinText(description, 12, "Describe what happened.");
    if (issue) {
      setDescriptionError(issue);
      return;
    }
    setDescriptionError(undefined);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(publicRef)}/support`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        ticket?: { publicReference: string };
      };
      if (!response.ok || !data.ok || !data.ticket) {
        setError(data.error ?? "The support request could not be sent.");
        return;
      }
      track(ANALYTICS_EVENTS.support_opened, { category });
      setTicketRef(data.ticket.publicReference);
      setDescription("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 24, marginTop: 24 }}>
      {waitingForWebhook ? (
        <Alert variant="warning" title="Waiting for payment confirmation">
          Returning from checkout does not confirm payment. Refresh this page after the provider webhook is verified.
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" title="Not completed">
          {error}
        </Alert>
      ) : null}
      {canCancel ? (
        <div className="paper-card" style={{ padding: 20 }}>
          <h2 className="type-h3">Cancel this reservation</h2>
          <p className="type-small">
            Cancellation follows the snapshot policy on this booking. A refund request is not a completed refund.
          </p>
          <label className="field-label" htmlFor="cancel-reason">
            Reason
            <FieldRequired />
          </label>
          <div className={`field-control${reasonError ? " field-control--error" : ""}`}>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError(undefined);
              }}
              onBlur={() => setReasonError(validateMinText(reason, 8, "Enter a cancellation reason."))}
              required
              minLength={8}
              maxLength={FIELD_LIMITS.messageMax}
              aria-invalid={reasonError ? true : undefined}
            />
          </div>
          {reasonError ? (
            <p className="field-error" role="alert">
              {reasonError}
            </p>
          ) : null}
          <Button type="button" variant="outline" loading={loading} onClick={() => void cancel()}>
            Cancel booking
          </Button>
        </div>
      ) : null}
      <form className="paper-card enquiry-form" style={{ padding: 20 }} onSubmit={(event) => void openSupport(event)}>
        <h2 className="type-h3">Get support</h2>
        <p className="type-small">
          This ticket includes the booking reference, station, connector, and payment state. It does not include
          provider secrets or card details.
        </p>
        {ticketRef ? (
          <Alert variant="success" title="Support request received">
            Reference {ticketRef}. We have not promised a response time.
          </Alert>
        ) : null}
        <label className="field-label" htmlFor="support-category">
          Category
        </label>
        <div className="field-control">
          <select
            id="support-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as BookingSupportCategory)}
          >
            {BOOKING_SUPPORT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {bookingSupportLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <label className="field-label" htmlFor="support-description">
          What happened
          <FieldRequired />
        </label>
        <div className={`field-control${descriptionError ? " field-control--error" : ""}`}>
          <textarea
            id="support-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              if (descriptionError) setDescriptionError(undefined);
            }}
            onBlur={() => setDescriptionError(validateMinText(description, 12, "Describe what happened."))}
            required
            minLength={12}
            maxLength={FIELD_LIMITS.messageMax}
            aria-invalid={descriptionError ? true : undefined}
          />
        </div>
        {descriptionError ? (
          <p className="field-error" role="alert">
            {descriptionError}
          </p>
        ) : null}
        <Button type="submit" variant="secondary" loading={loading}>
          Send support request
        </Button>
      </form>
    </div>
  );
}
