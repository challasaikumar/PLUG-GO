import { describe, expect, it } from "vitest";
import {
  connectorEligible,
  connectorSafeToBook,
  evaluateStationBookingGate,
  policyIsCurrentlyEffective,
} from "./eligibility";
import type { BookingPolicy } from "@prisma/client";

function policy(overrides: Partial<BookingPolicy> = {}): BookingPolicy {
  const now = new Date("2026-08-25T10:00:00.000Z");
  return {
    id: "pol_1",
    stationId: "st_1",
    bookingEnabled: true,
    approvalStatus: "approved",
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: null,
    eligibleConnectorIds: ["cn_1"],
    arrivalWindowMinutes: 15,
    reservationDurationMinutes: 30,
    capacityLimit: 1,
    bookingFeePaise: 10000,
    gstRateBps: 1800,
    cancellationAllowed: true,
    cancellationCutoffMinutes: 30,
    refundOnCancel: true,
    refundPercentBps: 10000,
    cancellationPolicyText: "Cancel up to 30 minutes before the window.",
    noShowPolicyText: "No-show forfeits the fee.",
    refundPolicyText: "Refunds follow provider confirmation.",
    supportContactText: "Use in-app support on the booking.",
    version: 1,
    approvedBy: "finance-1",
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("booking eligibility", () => {
  const now = new Date("2026-08-25T10:00:00.000Z");

  it("refuses unpublished stations, missing policy, and unconfigured payment", () => {
    expect(
      evaluateStationBookingGate({
        station: { publicationStatus: "draft", isDemo: false },
        policy: policy(),
        paymentReady: true,
        authenticated: true,
        now,
      }).offer,
    ).toBe(false);
    expect(
      evaluateStationBookingGate({
        station: { publicationStatus: "published", isDemo: false },
        policy: null,
        paymentReady: true,
        authenticated: true,
        now,
      }),
    ).toMatchObject({ offer: false, reason: "policy_missing" });
    expect(
      evaluateStationBookingGate({
        station: { publicationStatus: "published", isDemo: false },
        policy: policy(),
        paymentReady: false,
        authenticated: true,
        now,
      }),
    ).toMatchObject({ offer: false, reason: "payment_unconfigured" });
  });

  it("refuses disabled, expired, and incomplete policies", () => {
    expect(policyIsCurrentlyEffective(policy({ bookingEnabled: false }), now)).toBe(false);
    expect(
      policyIsCurrentlyEffective(policy({ effectiveTo: new Date("2026-08-01T00:00:00.000Z") }), now),
    ).toBe(false);
    expect(policyIsCurrentlyEffective(policy({ eligibleConnectorIds: [] }), now)).toBe(false);
    expect(policyIsCurrentlyEffective(policy({ cancellationPolicyText: "  " }), now)).toBe(false);
    expect(connectorEligible(policy(), "cn_other")).toBe(false);
    expect(connectorEligible(policy(), "cn_1")).toBe(true);
  });

  it("does not treat stale, unknown, faulted, or offline connectors as reservable", () => {
    expect(
      connectorSafeToBook({
        installationStatus: "installed",
        recordedStatus: "available",
        statusUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
        overrideExpiresAt: null,
      }),
    ).toBe(false);
    expect(
      connectorSafeToBook({
        installationStatus: "installed",
        recordedStatus: "faulted",
        statusUpdatedAt: now,
        overrideExpiresAt: null,
      }),
    ).toBe(false);
  });

  it("requires authentication after every other gate passes", () => {
    expect(
      evaluateStationBookingGate({
        station: { publicationStatus: "published", isDemo: false },
        policy: policy(),
        paymentReady: true,
        authenticated: false,
        now,
      }),
    ).toMatchObject({ offer: false, reason: "unauthenticated" });
    expect(
      evaluateStationBookingGate({
        station: { publicationStatus: "published", isDemo: false },
        policy: policy(),
        paymentReady: true,
        authenticated: true,
        now,
      }),
    ).toEqual({ offer: true });
  });
});
