"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";

export function MockCheckoutForm() {
  const search = useSearchParams();
  const router = useRouter();
  const publicRef = search.get("ref") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function complete(outcome: "captured" | "failed") {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/payments/mock/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicRef, outcome }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; status?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Mock checkout could not finish.");
        return;
      }
      if (outcome === "captured") {
        track(ANALYTICS_EVENTS.payment_succeeded);
        track(ANALYTICS_EVENTS.booking_confirmed);
      } else {
        track(ANALYTICS_EVENTS.payment_failed);
      }
      router.push(`/payments/return?ref=${encodeURIComponent(publicRef)}`);
    } finally {
      setLoading(false);
    }
  }

  if (!publicRef) {
    return <Alert variant="error" title="Missing booking">This mock checkout link is incomplete.</Alert>;
  }

  return (
    <div className="paper-card" style={{ padding: 24, display: "grid", gap: 16 }}>
      {error ? (
        <Alert variant="error" title="Not completed">
          {error}
        </Alert>
      ) : null}
      <p className="type-small">
        Development mock only. Success still goes through the same signed webhook processor as production. This page
        never runs when NODE_ENV is production.
      </p>
      <Button type="button" loading={loading} onClick={() => void complete("captured")}>
        Simulate successful payment
      </Button>
      <Button type="button" variant="outline" loading={loading} onClick={() => void complete("failed")}>
        Simulate failed payment
      </Button>
    </div>
  );
}
