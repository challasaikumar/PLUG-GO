"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { loginHref } from "@/lib/auth/return-path";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { validateFutureDateTimeLocal } from "@/lib/fields";
import { formatInrFromPaise } from "@/lib/tariff/format";
import { FieldRequired } from "@/components/ui/FieldRequired";
import type { getStationBookingOffer } from "@/lib/booking/offer";

export type StationBookingOffer = Awaited<ReturnType<typeof getStationBookingOffer>>;

type CheckoutPayload = {
  mode: "hosted_mock" | "razorpay_checkout";
  provider: "mock" | "razorpay";
  orderId: string;
  amountPaise: number;
  currency: "INR";
  keyId?: string;
};

export function StationBookingPanel({
  stationSlug,
  stationPath,
  offer,
}: {
  stationSlug: string;
  stationPath: string;
  offer: StationBookingOffer;
}) {
  if (!offer.show) return null;

  if (offer.needsSignIn) {
    return (
      <section className="page-section" aria-labelledby="booking-heading">
        <h2 id="booking-heading" className="type-h2">
          Reserve a connector
        </h2>
        <Alert variant="info" title="Sign in to book">
          Website booking is enabled for eligible connectors at this station. Sign in to review the fee, cancellation
          rules, and create a short-lived payment hold. This does not start a charging session.
        </Alert>
        <p style={{ marginTop: 16 }}>
          <Button href={loginHref(stationPath)}>Sign in to book</Button>
        </p>
      </section>
    );
  }

  return <AuthenticatedBookingForm stationSlug={stationSlug} offer={offer} />;
}

function AuthenticatedBookingForm({
  stationSlug,
  offer,
}: {
  stationSlug: string;
  offer: Extract<StationBookingOffer, { show: true; needsSignIn: false }>;
}) {
  const router = useRouter();
  const eligible = offer.connectors.filter((row) => row.safe && row.capacityRemaining > 0);
  const [connectorId, setConnectorId] = useState(eligible[0]?.connectorId ?? "");
  const [windowStart, setWindowStart] = useState(() => {
    const start = new Date(Date.now() + 15 * 60 * 1000);
    start.setSeconds(0, 0);
    return new Date(start.getTime() - start.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ connectorId?: string; windowStart?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: { connectorId?: string; windowStart?: string } = {};
    if (!connectorId) nextErrors.connectorId = "Select an eligible connector.";
    const startIssue = validateFutureDateTimeLocal(windowStart);
    if (startIssue) nextErrors.windowStart = startIssue;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError("Please correct the highlighted fields.");
      return;
    }
    setFieldErrors({});
    setError(null);
    track(ANALYTICS_EVENTS.booking_started, { station_slug: stationSlug });
    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/bookings", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          stationSlug,
          connectorId,
          windowStart: new Date(windowStart).toISOString(),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        booking?: { publicRef: string };
        checkout?: CheckoutPayload | null;
      };
      if (!response.ok || !data.ok || !data.booking) {
        setError(data.error ?? "This booking could not be started.");
        return;
      }
      track(ANALYTICS_EVENTS.booking_hold_created, { station_slug: stationSlug });
      track(ANALYTICS_EVENTS.payment_started, { station_slug: stationSlug });
      if (data.checkout?.mode === "hosted_mock") {
        router.push(`/payments/mock-checkout?ref=${encodeURIComponent(data.booking.publicRef)}`);
        return;
      }
      if (data.checkout?.mode === "razorpay_checkout" && data.checkout.keyId) {
        await openRazorpay(data.checkout, data.booking.publicRef);
        router.push(`/payments/return?ref=${encodeURIComponent(data.booking.publicRef)}`);
        return;
      }
      router.push(`/bookings/${data.booking.publicRef}`);
    } catch {
      setError("The booking request could not be sent. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (eligible.length === 0) {
    return (
      <section className="page-section" aria-labelledby="booking-heading">
        <h2 id="booking-heading" className="type-h2">
          Reserve a connector
        </h2>
        <Alert variant="warning" title="No reservable connector right now">
          Booking is enabled, but no eligible connector currently has safe status and remaining capacity. This website
          will not accept a reservation.
        </Alert>
      </section>
    );
  }

  return (
    <section className="page-section" aria-labelledby="booking-heading">
      <h2 id="booking-heading" className="type-h2">
        Reserve a connector
      </h2>
      <Alert variant="info" title="Reservation, not a charging session">
        A confirmed booking holds a policy window. It does not start charging, keep the connector physically free beyond
        that policy, or create a final energy invoice.
      </Alert>
      <form onSubmit={onSubmit} className="enquiry-form" style={{ marginTop: 16 }}>
        {error ? (
          <Alert variant="error" title="Booking not started">
            {error}
          </Alert>
        ) : null}
        <label className="field-label" htmlFor="booking-connector">
          Eligible connector
          <FieldRequired />
        </label>
        <div className={`field-control${fieldErrors.connectorId ? " field-control--error" : ""}`}>
          <select
            id="booking-connector"
            required
            value={connectorId}
            aria-invalid={fieldErrors.connectorId ? true : undefined}
            onChange={(event) => {
              setConnectorId(event.target.value);
              setFieldErrors((current) => ({ ...current, connectorId: undefined }));
            }}
          >
            {eligible.map((connector) => (
              <option key={connector.connectorId} value={connector.connectorId}>
                {connectorTypeLabel(connector.connectorType)} · {connector.maxKw} kW · {connector.capacityRemaining}{" "}
                slot(s)
              </option>
            ))}
          </select>
        </div>
        {fieldErrors.connectorId ? (
          <p className="field-error" role="alert">
            {fieldErrors.connectorId}
          </p>
        ) : null}
        <label className="field-label" htmlFor="booking-start">
          Reservation start
          <FieldRequired />
        </label>
        <div className={`field-control${fieldErrors.windowStart ? " field-control--error" : ""}`}>
          <input
            id="booking-start"
            type="datetime-local"
            required
            value={windowStart}
            aria-invalid={fieldErrors.windowStart ? true : undefined}
            onChange={(event) => {
              setWindowStart(event.target.value);
              setFieldErrors((current) => ({ ...current, windowStart: undefined }));
            }}
            onBlur={() => {
              const issue = validateFutureDateTimeLocal(windowStart);
              setFieldErrors((current) => ({ ...current, windowStart: issue }));
            }}
          />
        </div>
        {fieldErrors.windowStart ? (
          <p className="field-error" role="alert">
            {fieldErrors.windowStart}
          </p>
        ) : null}
        <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
          Duration {offer.reservationDurationMinutes} minutes. Arrive within {offer.arrivalWindowMinutes} minutes of
          the start. Policy version {offer.policySummary.version}.
        </p>
        <dl className="type-body">
          <div>
            <dt>Reservation fee</dt>
            <dd className="font-mono">{formatInrFromPaise(offer.quote.feePaise)}</dd>
          </div>
          <div>
            <dt>GST</dt>
            <dd className="font-mono">{formatInrFromPaise(offer.quote.gstPaise)}</dd>
          </div>
          <div>
            <dt>Total due now</dt>
            <dd className="font-mono">{formatInrFromPaise(offer.quote.totalPaise)}</dd>
          </div>
        </dl>
        <p className="type-small">{offer.policySummary.cancellationPolicyText}</p>
        <p className="type-small">{offer.policySummary.refundPolicyText}</p>
        <p className="type-small">{offer.policySummary.noShowPolicyText}</p>
        <p className="type-small">{offer.policySummary.supportContactText}</p>
        <Button type="submit" loading={loading}>
          Continue to payment
        </Button>
      </form>
    </section>
  );
}

async function openRazorpay(checkout: CheckoutPayload, publicRef: string) {
  await loadRazorpayScript();
  await new Promise<void>((resolve) => {
    const RazorpayCtor = (
      window as unknown as {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void };
      }
    ).Razorpay;
    const instance = new RazorpayCtor({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      order_id: checkout.orderId,
      name: "Plug and Go",
      description: "Reservation fee",
      handler() {
        resolve();
      },
      modal: {
        ondismiss() {
          resolve();
        },
      },
    });
    void publicRef;
    instance.open();
  });
}

function loadRazorpayScript() {
  if (document.querySelector("script[data-png-razorpay]")) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.pngRazorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Checkout script failed to load."));
    document.head.appendChild(script);
  });
}
