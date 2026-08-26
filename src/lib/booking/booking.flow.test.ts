import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { requestDriverOtp, verifyDriverOtp } from "@/lib/auth/otp";
import { createBookingHold, expireUnpaidHolds, markPaymentProcessing, BookingError } from "./service";
import { cancelDriverBooking } from "./cancel";
import { getDriverBooking } from "./queries";
import { processVerifiedPaymentEvent } from "@/lib/payments/webhook";
import { signMockWebhook } from "@/lib/payments/mock";
import { staffSendPendingRefund } from "@/lib/payments/refunds";
import { ROLE_MATRIX, requireStaffRole, StaffAuthError } from "@/lib/auth/staff";

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

const db = process.env.DATABASE_URL?.trim();

function uniquePhone(head: "6" | "7" | "8" | "9"): string {
  const rest = String(100000000 + Math.floor(Math.random() * 899999999)).slice(0, 9);
  return `+91${head}${rest}`;
}

describe.skipIf(!db)("phase 8 booking and payments", () => {
  const prisma = new PrismaClient();
  const suffix = `p8-${Date.now()}`;
  const ids = { org: `p8-org-${suffix}`, host: `p8-host-${suffix}` };
  const phoneA = uniquePhone("8");
  const phoneB = uniquePhone("9");
  const original = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DEV_OTP: process.env.AUTH_DEV_OTP,
    NODE_ENV: process.env.NODE_ENV,
    PAYMENT_DEV_MOCK: process.env.PAYMENT_DEV_MOCK,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
    AVAILABILITY_FRESHNESS_MINUTES: process.env.AVAILABILITY_FRESHNESS_MINUTES,
    ADMIN_ENABLED: process.env.ADMIN_ENABLED,
    STAFF_DEV_ROLE: process.env.STAFF_DEV_ROLE,
    STAFF_DEV_ACTOR_ID: process.env.STAFF_DEV_ACTOR_ID,
  };

  beforeAll(() => {
    setEnv("AUTH_SECRET", "phase8-test-secret-value");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("NODE_ENV", "test");
    setEnv("PAYMENT_DEV_MOCK", "true");
    setEnv("PAYMENT_WEBHOOK_SECRET", "phase8-webhook-secret");
    setEnv("AVAILABILITY_FRESHNESS_MINUTES", "120");
    setEnv("ADMIN_ENABLED", "true");
    setEnv("STAFF_DEV_ROLE", "finance");
    setEnv("STAFF_DEV_ACTOR_ID", "finance-test-1");
  });

  afterAll(async () => {
    setEnv("AUTH_SECRET", original.AUTH_SECRET);
    setEnv("AUTH_DEV_OTP", original.AUTH_DEV_OTP);
    setEnv("NODE_ENV", original.NODE_ENV);
    setEnv("PAYMENT_DEV_MOCK", original.PAYMENT_DEV_MOCK);
    setEnv("PAYMENT_WEBHOOK_SECRET", original.PAYMENT_WEBHOOK_SECRET);
    setEnv("AVAILABILITY_FRESHNESS_MINUTES", original.AVAILABILITY_FRESHNESS_MINUTES);
    setEnv("ADMIN_ENABLED", original.ADMIN_ENABLED);
    setEnv("STAFF_DEV_ROLE", original.STAFF_DEV_ROLE);
    setEnv("STAFF_DEV_ACTOR_ID", original.STAFF_DEV_ACTOR_ID);
    await prisma.refund.deleteMany({ where: { booking: { station: { slug: { startsWith: `p8-${suffix}` } } } } });
    await prisma.financialDocument.deleteMany({
      where: { booking: { station: { slug: { startsWith: `p8-${suffix}` } } } },
    });
    await prisma.supportIssue.deleteMany({
      where: { booking: { station: { slug: { startsWith: `p8-${suffix}` } } } },
    });
    await prisma.booking.deleteMany({ where: { station: { slug: { startsWith: `p8-${suffix}` } } } });
    await prisma.bookingPolicy.deleteMany({ where: { station: { slug: { startsWith: `p8-${suffix}` } } } });
    await prisma.station.deleteMany({ where: { slug: { startsWith: `p8-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: ids.host } });
    await prisma.organisation.deleteMany({ where: { id: ids.org } });
    await prisma.driver.deleteMany({ where: { phoneE164: { in: [phoneA, phoneB] } } });
    await prisma.driverAuthChallenge.deleteMany({ where: { phoneE164: { in: [phoneA, phoneB] } } });
    await prisma.$disconnect();
  });

  async function signIn(phone: string, ip: string) {
    const otp = await requestDriverOtp({ phone, ip });
    const session = await verifyDriverOtp({
      phone,
      challengeId: otp.challengeId,
      code: otp.developmentCode,
    });
    return session.driver;
  }

  it("enforces policy, capacity, webhook confirmation, isolation, and refunds", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: ids.org,
        legalName: "Phase 8 org",
        brandName: "Phase 8",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const host = await prisma.host.create({
      data: {
        id: ids.host,
        organisationId: organisation.id,
        hostLegalName: "Phase 8 host",
        hostDisplayName: "Phase 8 host",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    const station = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: `Phase 8 hub ${suffix}`,
        slug: `p8-${suffix}-hub`,
        city: "Hyderabad",
        state: "Telangana",
        latitude: "17.385000",
        longitude: "78.486700",
        addressLine1: "Banjara Hills",
        pincode: "500034",
        accessHoursSummary: "06:00–23:00",
        accessType: "public",
        publicationStatus: "published",
        operationalLifecycle: "open",
        isDemo: false,
        dataSource: "other",
        lastVerifiedAt: new Date(),
        verifiedBy: "test",
      },
    });
    const evse = await prisma.evse.create({
      data: {
        stationId: station.id,
        evseLabel: "EVSE 1",
        maxPowerWatts: 60000,
        powerType: "dc",
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    const connector = await prisma.connector.create({
      data: {
        evseId: evse.id,
        stationId: station.id,
        connectorIndex: 1,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    await prisma.currentConnectorStatus.create({
      data: {
        connectorId: connector.id,
        recordedStatus: "available",
        source: "operator_override",
        statusUpdatedAt: new Date(),
      },
    });

    const ipBase = 20 + (Date.now() % 200);
    const driverA = await signIn(phoneA, `198.51.100.${ipBase}`);
    const driverB = await signIn(phoneB, `198.51.100.${(ipBase + 1) % 254 || 1}`);
    const windowStart = new Date(Date.now() + 60 * 60 * 1000);

    await expect(
      createBookingHold({
        driverId: driverA.id,
        stationSlug: station.slug,
        connectorId: connector.id,
        windowStart,
        idempotencyKey: `k-disabled-${suffix}`,
      }),
    ).rejects.toMatchObject({ code: "conflict" });

    const policy = await prisma.bookingPolicy.create({
      data: {
        stationId: station.id,
        bookingEnabled: true,
        approvalStatus: "approved",
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
        eligibleConnectorIds: [connector.id],
        arrivalWindowMinutes: 15,
        reservationDurationMinutes: 30,
        capacityLimit: 1,
        bookingFeePaise: 10000,
        gstRateBps: 1800,
        cancellationAllowed: true,
        cancellationCutoffMinutes: 0,
        refundOnCancel: true,
        refundPercentBps: 10000,
        cancellationPolicyText: "Cancel before the window starts.",
        noShowPolicyText: "No-show forfeits the fee.",
        refundPolicyText: "Refunds wait for provider confirmation.",
        supportContactText: "Open a booking support ticket.",
        version: 1,
        approvedBy: "finance-test-1",
        approvedAt: new Date(),
      },
    });
    void policy;

    const first = await createBookingHold({
      driverId: driverA.id,
      stationSlug: station.slug,
      connectorId: connector.id,
      windowStart,
      idempotencyKey: `k-first-${suffix}`,
    });
    expect(first.booking.status).toBe("pending_payment");
    const reused = await createBookingHold({
      driverId: driverA.id,
      stationSlug: station.slug,
      connectorId: connector.id,
      windowStart,
      idempotencyKey: `k-first-${suffix}`,
    });
    expect(reused.reused).toBe(true);
    expect(reused.booking.id).toBe(first.booking.id);

    const second = createBookingHold({
      driverId: driverB.id,
      stationSlug: station.slug,
      connectorId: connector.id,
      windowStart,
      idempotencyKey: `k-second-${suffix}`,
    });
    await expect(second).rejects.toMatchObject({ code: "conflict" });

    const processing = await markPaymentProcessing(driverA.id, first.booking.publicRef);
    expect(processing.status).toBe("payment_processing");
    const stillUnconfirmed = await prisma.booking.findUniqueOrThrow({ where: { id: first.booking.id } });
    expect(stillUnconfirmed.status).toBe("payment_processing");

    const attempt = await prisma.paymentAttempt.findFirstOrThrow({
      where: { bookingId: first.booking.id },
    });
    const invalid = await processVerifiedPaymentEvent({
      provider: "mock",
      rawBody: JSON.stringify({
        eventId: `bad-${suffix}`,
        type: "payment.captured",
        orderId: attempt.providerOrderId,
        amountPaise: attempt.amountPaise,
      }),
      headers: new Headers({ "x-png-mock-signature": "00" }),
    });
    expect(invalid.ok).toBe(false);

    const captureBody = JSON.stringify({
      eventId: `cap-${suffix}`,
      type: "payment.captured",
      orderId: attempt.providerOrderId,
      paymentId: `mock_pay_${suffix}`,
      amountPaise: attempt.amountPaise,
    });
    const captured = await processVerifiedPaymentEvent({
      provider: "mock",
      rawBody: captureBody,
      headers: new Headers({ "x-png-mock-signature": signMockWebhook(captureBody) }),
    });
    expect(captured).toEqual({ ok: true, result: "payment_captured" });
    const duplicate = await processVerifiedPaymentEvent({
      provider: "mock",
      rawBody: captureBody,
      headers: new Headers({ "x-png-mock-signature": signMockWebhook(captureBody) }),
    });
    expect(duplicate).toEqual({ ok: true, result: "payment_captured" });

    const confirmed = await getDriverBooking(driverA.id, first.booking.publicRef);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.documents.some((row) => row.kind === "booking_receipt")).toBe(true);
    expect(confirmed.documents.some((row) => row.kind === "charging_invoice_placeholder")).toBe(true);
    expect(confirmed.documents.find((row) => row.kind === "charging_invoice_placeholder")?.status).toBe(
      "not_issuable_until_session",
    );

    await expect(getDriverBooking(driverB.id, first.booking.publicRef)).rejects.toBeInstanceOf(BookingError);

    const cancelled = await cancelDriverBooking({
      driverId: driverA.id,
      publicRef: first.booking.publicRef,
      reason: "Plans changed before arrival.",
    });
    expect(cancelled.status).toBe("refund_pending");
    expect(cancelled.refunds[0]?.status).toBe("pending_review");

    setEnv("STAFF_DEV_ROLE", "station_operator");
    expect(() => requireStaffRole(ROLE_MATRIX.initiateRefund)).toThrow(StaffAuthError);
    setEnv("STAFF_DEV_ROLE", "finance");
    const actor = requireStaffRole(ROLE_MATRIX.initiateRefund);
    const pending = cancelled.refunds[0];
    expect(pending).toBeTruthy();
    const refund = await staffSendPendingRefund({
      actor,
      refundId: pending!.id,
    });
    expect(["pending_provider", "processing", "pending_review"]).toContain(refund.status);

    const refundBody = JSON.stringify({
      eventId: `rfnd-${suffix}`,
      type: "refund.processed",
      orderId: attempt.providerOrderId,
      refundId: refund.providerRefundId ?? `mock_rfnd_${suffix}`,
      amountPaise: attempt.amountPaise,
    });
    await prisma.refund.update({
      where: { id: refund.id },
      data: { providerRefundId: refund.providerRefundId ?? `mock_rfnd_${suffix}`, status: "processing" },
    });
    const refunded = await processVerifiedPaymentEvent({
      provider: "mock",
      rawBody: refundBody,
      headers: new Headers({ "x-png-mock-signature": signMockWebhook(refundBody) }),
    });
    expect(refunded.ok).toBe(true);
    const afterRefund = await prisma.booking.findUniqueOrThrow({ where: { id: first.booking.id } });
    expect(afterRefund.status).toBe("refunded");

    const window2 = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const raced = await Promise.allSettled([
      createBookingHold({
        driverId: driverA.id,
        stationSlug: station.slug,
        connectorId: connector.id,
        windowStart: window2,
        idempotencyKey: `k-race-a-${suffix}`,
      }),
      createBookingHold({
        driverId: driverB.id,
        stationSlug: station.slug,
        connectorId: connector.id,
        windowStart: window2,
        idempotencyKey: `k-race-b-${suffix}`,
      }),
    ]);
    expect(raced.filter((row) => row.status === "fulfilled")).toHaveLength(1);
    expect(raced.filter((row) => row.status === "rejected")).toHaveLength(1);

    await expireUnpaidHolds();
  });
});
