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

export function FinanceBookingDesk({ canRefund }: { canRefund: boolean }) {
  const [ref, setRef] = useState("");
  const [booking, setBooking] = useState<FinanceBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amountPaise, setAmountPaise] = useState("");
  const [reason, setReason] = useState("");

  async function load(publicRef: string) {
    setError(null);
    const response = await fetch(`/api/admin/finance/bookings?ref=${encodeURIComponent(publicRef)}`);
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
    const response = await fetch("/api/admin/finance/refunds", {
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
    setError(null);
    await load(booking.publicRef);
  }

  async function sendPending(id: string) {
    const response = await fetch(`/api/admin/finance/refunds/${id}/send`, { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "The provider refund could not be sent.");
      return;
    }
    if (booking) await load(booking.publicRef);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <form className="enquiry-form" onSubmit={(event) => { event.preventDefault(); void load(ref); }}>
        <TextInput label="Booking public reference" name="ref" value={ref} onChange={(event) => setRef(event.target.value)} />
        <Button type="submit">Look up</Button>
      </form>
      {error ? (
        <Alert variant="error" title="Not completed">
          {error}
        </Alert>
      ) : null}
      {booking ? (
        <section className="paper-card" style={{ padding: 20 }}>
          <h2 className="type-h3">{booking.referenceCode}</h2>
          <p className="type-small">
            {booking.station.name}, {booking.station.city} · {booking.status.replaceAll("_", " ")} ·{" "}
            {formatInrFromPaise(booking.totalPaise)}
          </p>
          <p className="type-small">Connector {booking.connector.publicRef}</p>
          <ul className="type-small">
            {booking.refunds.map((row) => (
              <li key={row.id}>
                Refund {formatInrFromPaise(row.amountPaise)} · {row.status.replaceAll("_", " ")}
                {row.status === "pending_review" && canRefund ? (
                  <>
                    {" "}
                    <Button size="sm" variant="outline" onClick={() => void sendPending(row.id)}>
                      Send to provider
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          {canRefund ? (
            <>
          <Alert variant="warning" title="Refunds are not instant">
            Starting a refund does not complete it. Wait for the provider webhook. Station operators cannot use this
            desk.
          </Alert>
          <TextInput
            label="Amount (paise)"
            name="amountPaise"
            value={amountPaise}
            onChange={(event) => setAmountPaise(event.target.value)}
          />
          <label className="field-label" htmlFor="refund-reason">
            Reason
          </label>
          <div className="field-control">
            <textarea id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <Button type="button" onClick={() => void refund()}>
            Initiate refund
          </Button>
            </>
          ) : (
            <Alert variant="info" title="Refunds are finance-only">
              Support can view status. A finance role must send the refund to the provider.
            </Alert>
          )}
        </section>
      ) : null}
    </div>
  );
}
