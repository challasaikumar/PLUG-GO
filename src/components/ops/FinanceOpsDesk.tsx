"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { formatInrFromPaise } from "@/lib/tariff/format";

type FinanceBooking = {
  publicRef: string;
  referenceCode: string;
  status: string;
  totalPaise: number;
  station: { name: string; city: string };
  connector: { publicRef: string };
  payments: Array<{ status: string; amountPaise: number }>;
  refunds: Array<{ id: string; amountPaise: number; status: string; reason: string }>;
};

export function FinanceOpsDesk({
  canRefund,
  exceptions,
}: {
  canRefund: boolean;
  exceptions: {
    refunds: Array<{ id: string; bookingRef: string; amountPaise: number; status: string }>;
    failedPayments: Array<{ id: string; bookingRef: string; status: string }>;
    receipts: Array<{ number: string; bookingRef: string; totalPaise: number }>;
  };
}) {
  const [ref, setRef] = useState("");
  const [booking, setBooking] = useState<FinanceBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amountPaise, setAmountPaise] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load(publicRef: string) {
    setError(null);
    const response = await fetch(`/api/ops/finance/bookings?ref=${encodeURIComponent(publicRef)}`);
    const data = (await response.json()) as { ok?: boolean; error?: string; booking?: FinanceBooking };
    if (!response.ok || !data.ok || !data.booking) {
      setBooking(null);
      setError(data.error ?? "That booking was not found.");
      return;
    }
    setBooking(data.booking);
    setAmountPaise(String(data.booking.totalPaise));
  }

  async function refund() {
    if (!booking) return;
    const response = await fetch("/api/ops/finance/refunds", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        publicRef: booking.publicRef,
        amountPaise: Number.parseInt(amountPaise, 10),
        reason,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "The refund was not started.");
      return;
    }
    await load(booking.publicRef);
  }

  async function exportKind(kind: string) {
    setError(null);
    const response = await fetch("/api/ops/exports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; job?: { publicRef: string; status: string } };
    if (!response.ok || !data.ok || !data.job) {
      setError(data.error ?? "Export was not queued.");
      return;
    }
    setMessage(`Export ${data.job.publicRef} is ${data.job.status}.`);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <Alert variant="info" title="Phase 8 payments only">
        This desk does not add a payment provider. Refunds reuse the existing finance services. Station operators and
        technicians do not get this route.
      </Alert>
      <div className="ops-mobile-cards">
        {exceptions.refunds.length === 0 ? (
          <p className="type-small">No refund exceptions in scope.</p>
        ) : (
          exceptions.refunds.map((row) => (
            <article key={row.id} className="ops-list-card">
              <p className="font-mono type-caption">{row.bookingRef}</p>
              <p className="type-small">
                {row.status} · {row.amountPaise} paise
              </p>
            </article>
          ))
        )}
      </div>
      <div className="ops-desktop-table admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Refund status</th>
              <th>Paise</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.refunds.length === 0 ? (
              <tr>
                <td colSpan={3}>No refund exceptions in scope.</td>
              </tr>
            ) : (
              exceptions.refunds.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.bookingRef}</td>
                  <td>{row.status}</td>
                  <td>{row.amountPaise}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="ops-actions">
        <Button size="sm" variant="outline" onClick={() => void exportKind("finance_refunds")}>
          Queue refund export
        </Button>
        <Button size="sm" variant="outline" onClick={() => void exportKind("compliance_station")}>
          Queue compliance structure
        </Button>
      </div>
      {message ? <Alert variant="info" title="Export job">{message}</Alert> : null}
      <form
        className="enquiry-form"
        onSubmit={(event) => {
          event.preventDefault();
          void load(ref);
        }}
      >
        <TextInput label="Booking public reference" name="ref" value={ref} onChange={(event) => setRef(event.target.value)} />
        <Button type="submit">Look up</Button>
      </form>
      {error ? (
        <Alert variant="error" title="Not completed">
          {error}
        </Alert>
      ) : null}
      {booking ? (
        <article className="ops-list-card">
          <p className="font-mono type-caption">{booking.publicRef}</p>
          <p className="type-small">
            {booking.station.name}, {booking.station.city} · {booking.status} · {formatInrFromPaise(booking.totalPaise)}
          </p>
          {canRefund ? (
            <>
              <TextInput label="Amount (paise)" name="amount" value={amountPaise} onChange={(event) => setAmountPaise(event.target.value)} />
              <TextInput label="Reason" name="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
              <Button size="sm" onClick={() => void refund()}>
                Initiate refund
              </Button>
            </>
          ) : (
            <p className="type-small">Look-up only for this role.</p>
          )}
        </article>
      ) : null}
    </div>
  );
}
