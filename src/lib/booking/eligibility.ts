import type { BookingPolicy, BookingStatus, Connector, Station } from "@prisma/client";
import { computePublicStatus } from "@/lib/status";
import { publicStationWhere } from "@/lib/catalogue/station-service";

export const CAPACITY_OCCUPYING_STATUSES: BookingStatus[] = [
  "pending_payment",
  "payment_processing",
  "confirmed",
  "refund_pending",
  "support_review",
];

export const UNPAID_HOLD_STATUSES: BookingStatus[] = ["pending_payment", "payment_processing"];

export type BookingBlockReason =
  | "station_unpublished"
  | "policy_missing"
  | "policy_not_approved"
  | "policy_not_effective"
  | "booking_disabled"
  | "connector_not_eligible"
  | "connector_unsafe"
  | "capacity_unavailable"
  | "payment_unconfigured"
  | "cancellation_policy_missing"
  | "refund_policy_missing"
  | "unauthenticated";

export type EffectivePolicy = BookingPolicy & {
  station: Pick<Station, "id" | "slug" | "name" | "publicationStatus" | "isDemo" | "city" | "state">;
};

export function policyIsCurrentlyEffective(policy: BookingPolicy, now = new Date()): boolean {
  if (policy.approvalStatus !== "approved") return false;
  if (!policy.bookingEnabled) return false;
  if (policy.effectiveFrom > now) return false;
  if (policy.effectiveTo && policy.effectiveTo <= now) return false;
  if (policy.eligibleConnectorIds.length === 0) return false;
  if (policy.capacityLimit < 1) return false;
  if (policy.reservationDurationMinutes < 1) return false;
  if (!policy.cancellationPolicyText.trim()) return false;
  if (!policy.refundPolicyText.trim()) return false;
  if (!policy.noShowPolicyText.trim()) return false;
  if (!policy.supportContactText.trim()) return false;
  if (policy.gstRateBps < 0) return false;
  return true;
}

export function connectorEligible(policy: BookingPolicy, connectorId: string): boolean {
  return policy.eligibleConnectorIds.includes(connectorId);
}

export function connectorSafeToBook(input: {
  installationStatus: string;
  recordedStatus: Parameters<typeof computePublicStatus>[0]["recordedStatus"];
  statusUpdatedAt: Date | string | null;
  overrideExpiresAt?: Date | string | null;
}): boolean {
  if (input.installationStatus !== "installed") return false;
  const computed = computePublicStatus({
    recordedStatus: input.recordedStatus,
    statusUpdatedAt: input.statusUpdatedAt,
    overrideExpiresAt: input.overrideExpiresAt ?? null,
  });
  if (computed.publicStatus === "stale" || computed.publicStatus === "unknown") return false;
  if (computed.publicStatus === "faulted" || computed.publicStatus === "offline") return false;
  return computed.publicStatus === "available" || computed.publicStatus === "in_use";
}

export function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function evaluateStationBookingGate(input: {
  station: Pick<Station, "publicationStatus" | "isDemo"> | null;
  policy: BookingPolicy | null;
  paymentReady: boolean;
  authenticated: boolean;
  bookingFeatureEnabled?: boolean;
  now?: Date;
}): { offer: true } | { offer: false; reason: BookingBlockReason } {
  const now = input.now ?? new Date();
  if (input.bookingFeatureEnabled === false) return { offer: false, reason: "booking_disabled" };
  if (!input.station || input.station.publicationStatus !== "published" || input.station.isDemo) {
    return { offer: false, reason: "station_unpublished" };
  }
  if (!input.paymentReady) return { offer: false, reason: "payment_unconfigured" };
  if (!input.policy) return { offer: false, reason: "policy_missing" };
  if (input.policy.approvalStatus !== "approved") return { offer: false, reason: "policy_not_approved" };
  if (!input.policy.bookingEnabled) return { offer: false, reason: "booking_disabled" };
  if (!policyIsCurrentlyEffective(input.policy, now)) {
    if (input.policy.effectiveTo && input.policy.effectiveTo <= now) {
      return { offer: false, reason: "policy_not_effective" };
    }
    if (!input.policy.cancellationPolicyText.trim() || !input.policy.refundPolicyText.trim()) {
      return { offer: false, reason: "cancellation_policy_missing" };
    }
    return { offer: false, reason: "policy_not_effective" };
  }
  if (!input.authenticated) return { offer: false, reason: "unauthenticated" };
  return { offer: true };
}

export function publishedStationWhere() {
  return publicStationWhere;
}

export type PublicConnectorOffer = {
  connectorId: string;
  publicRef: string;
  connectorType: string;
  maxKw: number;
  publicStatus: string;
  capacityRemaining: number;
};

export type ConnectorStatusRow = Pick<
  Connector,
  "id" | "publicRef" | "connectorType" | "maxPowerWatts" | "installationStatus"
> & {
  currentStatus: {
    recordedStatus: Parameters<typeof computePublicStatus>[0]["recordedStatus"];
    statusUpdatedAt: Date;
    overrideExpiresAt: Date | null;
  } | null;
};
