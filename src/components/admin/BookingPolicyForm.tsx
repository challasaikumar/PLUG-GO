"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

type Draft = {
  id: string;
  bookingEnabled: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  eligibleConnectorIds: string[];
  arrivalWindowMinutes: number;
  reservationDurationMinutes: number;
  capacityLimit: number;
  bookingFeePaise: number;
  gstRateBps: number;
  cancellationAllowed: boolean;
  cancellationCutoffMinutes: number | null;
  refundOnCancel: boolean;
  refundPercentBps: number;
  cancellationPolicyText: string;
  noShowPolicyText: string;
  refundPolicyText: string;
  supportContactText: string;
  approvalStatus: string;
};

export function BookingPolicyForm({
  stationId,
  connectors,
  draft,
  canApprove,
}: {
  stationId: string;
  connectors: Array<{ id: string; label: string }>;
  draft: Draft | null;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(draft?.eligibleConnectorIds ?? []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    const payload = {
      bookingEnabled: form.get("bookingEnabled") === "on",
      effectiveFrom: String(form.get("effectiveFrom") ?? ""),
      effectiveTo: String(form.get("effectiveTo") ?? "") || null,
      eligibleConnectorIds: selected,
      arrivalWindowMinutes: Number(form.get("arrivalWindowMinutes")),
      reservationDurationMinutes: Number(form.get("reservationDurationMinutes")),
      capacityLimit: Number(form.get("capacityLimit")),
      bookingFeePaise: Number(form.get("bookingFeePaise")),
      gstRateBps: Number(form.get("gstRateBps")),
      cancellationAllowed: form.get("cancellationAllowed") === "on",
      cancellationCutoffMinutes: form.get("cancellationCutoffMinutes")
        ? Number(form.get("cancellationCutoffMinutes"))
        : null,
      refundOnCancel: form.get("refundOnCancel") === "on",
      refundPercentBps: Number(form.get("refundPercentBps") || 0),
      cancellationPolicyText: String(form.get("cancellationPolicyText") ?? ""),
      noShowPolicyText: String(form.get("noShowPolicyText") ?? ""),
      refundPolicyText: String(form.get("refundPolicyText") ?? ""),
      supportContactText: String(form.get("supportContactText") ?? ""),
    };
    const response = await fetch(`/api/admin/stations/${stationId}/booking-policies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; policy?: { id: string } };
    setLoading(false);
    if (!response.ok || !data.ok) {
      setError(data.error ?? "The policy was not saved.");
      return;
    }
    router.refresh();
  }

  async function approve() {
    if (!draft) return;
    setLoading(true);
    const response = await fetch(`/api/admin/booking-policies/${draft.id}/approve`, { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setLoading(false);
    if (!response.ok || !data.ok) {
      setError(data.error ?? "This policy could not be approved.");
      return;
    }
    router.refresh();
  }

  return (
    <form className="enquiry-form" onSubmit={(event) => void onSubmit(event)}>
      {error ? (
        <Alert variant="error" title="Not saved">
          {error}
        </Alert>
      ) : null}
      <label className="field-label">
        <input type="checkbox" name="bookingEnabled" defaultChecked={draft?.bookingEnabled ?? false} /> Booking enabled
      </label>
      <fieldset>
        <legend className="field-label">Eligible connectors</legend>
        {connectors.map((connector) => (
          <label key={connector.id} className="type-small" style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selected.includes(connector.id)}
              onChange={(event) => {
                setSelected((current) =>
                  event.target.checked ? [...current, connector.id] : current.filter((id) => id !== connector.id),
                );
              }}
            />{" "}
            {connector.label}
          </label>
        ))}
      </fieldset>
      <TextInput
        label="Effective from (ISO)"
        name="effectiveFrom"
        defaultValue={draft?.effectiveFrom ?? new Date().toISOString()}
        required
      />
      <TextInput label="Effective to (ISO, optional)" name="effectiveTo" defaultValue={draft?.effectiveTo ?? ""} />
      <TextInput
        label="Arrival window (minutes)"
        name="arrivalWindowMinutes"
        type="number"
        defaultValue={draft?.arrivalWindowMinutes ?? 15}
      />
      <TextInput
        label="Reservation duration (minutes)"
        name="reservationDurationMinutes"
        type="number"
        defaultValue={draft?.reservationDurationMinutes ?? 30}
      />
      <TextInput label="Capacity limit" name="capacityLimit" type="number" defaultValue={draft?.capacityLimit ?? 1} />
      <TextInput
        label="Booking fee (paise)"
        name="bookingFeePaise"
        type="number"
        defaultValue={draft?.bookingFeePaise ?? 0}
      />
      <TextInput label="GST basis points" name="gstRateBps" type="number" defaultValue={draft?.gstRateBps ?? 1800} />
      <label className="field-label">
        <input type="checkbox" name="cancellationAllowed" defaultChecked={draft?.cancellationAllowed ?? false} />{" "}
        Cancellation allowed
      </label>
      <TextInput
        label="Cancellation cutoff (minutes before start)"
        name="cancellationCutoffMinutes"
        type="number"
        defaultValue={draft?.cancellationCutoffMinutes ?? 30}
      />
      <label className="field-label">
        <input type="checkbox" name="refundOnCancel" defaultChecked={draft?.refundOnCancel ?? false} /> Refund on cancel
      </label>
      <TextInput
        label="Refund percent (basis points, 10000 = 100%)"
        name="refundPercentBps"
        type="number"
        defaultValue={draft?.refundPercentBps ?? 0}
      />
      <label className="field-label" htmlFor="cancellationPolicyText">
        Cancellation policy
      </label>
      <div className="field-control">
        <textarea
          id="cancellationPolicyText"
          name="cancellationPolicyText"
          required
          defaultValue={draft?.cancellationPolicyText ?? ""}
        />
      </div>
      <label className="field-label" htmlFor="noShowPolicyText">
        No-show policy
      </label>
      <div className="field-control">
        <textarea id="noShowPolicyText" name="noShowPolicyText" required defaultValue={draft?.noShowPolicyText ?? ""} />
      </div>
      <label className="field-label" htmlFor="refundPolicyText">
        Refund policy
      </label>
      <div className="field-control">
        <textarea id="refundPolicyText" name="refundPolicyText" required defaultValue={draft?.refundPolicyText ?? ""} />
      </div>
      <label className="field-label" htmlFor="supportContactText">
        Support contact
      </label>
      <div className="field-control">
        <textarea
          id="supportContactText"
          name="supportContactText"
          required
          defaultValue={draft?.supportContactText ?? ""}
        />
      </div>
      <Button type="submit" loading={loading}>
        Save draft
      </Button>
      {canApprove && draft?.approvalStatus === "draft" ? (
        <Button type="button" variant="secondary" loading={loading} onClick={() => void approve()}>
          Approve policy
        </Button>
      ) : null}
    </form>
  );
}
