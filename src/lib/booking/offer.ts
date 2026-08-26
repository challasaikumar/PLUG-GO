import { getPrisma } from "@/lib/db/prisma";
import { featureEnabledSync } from "@/lib/release/flags";
import { computePublicStatus } from "@/lib/status";
import {
  connectorEligible,
  connectorSafeToBook,
  evaluateStationBookingGate,
  CAPACITY_OCCUPYING_STATUSES,
  windowsOverlap,
} from "./eligibility";
import { expireUnpaidHolds, getEffectivePolicy, quotePolicyFee } from "./service";

export async function getStationBookingOffer(input: {
  stationSlug: string;
  authenticated: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  await expireUnpaidHolds(now);
  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { slug: input.stationSlug, publicationStatus: "published", isDemo: false },
    include: {
      connectors: { where: { installationStatus: "installed" }, include: { currentStatus: true } },
    },
  });
  if (!station) {
    return { show: false as const, reason: "station_unpublished" as const };
  }
  const policy = await getEffectivePolicy(station.id, now);
  const paymentReady = featureEnabledSync("paymentCheckout");
  const bookingFeatureEnabled = featureEnabledSync("booking");
  const gate = evaluateStationBookingGate({
    station,
    policy,
    paymentReady,
    bookingFeatureEnabled,
    authenticated: true,
    now,
  });

  const policyReady =
    Boolean(policy) &&
    evaluateStationBookingGate({
      station,
      policy,
      paymentReady,
      bookingFeatureEnabled,
      authenticated: true,
      now,
    }).offer === true;

  if (!policyReady) {
    const blocked = evaluateStationBookingGate({
      station,
      policy,
      paymentReady,
      bookingFeatureEnabled,
      authenticated: true,
      now,
    });
    return {
      show: false as const,
      reason: blocked.offer ? "booking_disabled" : blocked.reason,
      signInWouldHelp: false,
    };
  }

  if (!input.authenticated) {
    return {
      show: true as const,
      needsSignIn: true as const,
      policySummary: publicPolicySummary(policy!),
    };
  }

  if (gate.offer !== true) {
    return { show: false as const, reason: gate.reason, signInWouldHelp: false };
  }

  const connectors = [];
  for (const connector of station.connectors) {
    if (!connectorEligible(policy!, connector.id)) continue;
    const safe = connectorSafeToBook({
      installationStatus: connector.installationStatus,
      recordedStatus: connector.currentStatus?.recordedStatus ?? null,
      statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
      overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
    });
    const computed = computePublicStatus({
      recordedStatus: connector.currentStatus?.recordedStatus ?? null,
      statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
      overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
    });
    const windowEnd = new Date(now.getTime() + policy!.reservationDurationMinutes * 60 * 1000);
    const occupying = await prisma.booking.findMany({
      where: { connectorId: connector.id, status: { in: CAPACITY_OCCUPYING_STATUSES } },
      select: { windowStart: true, windowEnd: true },
    });
    const overlapping = occupying.filter((row) =>
      windowsOverlap(now, windowEnd, row.windowStart, row.windowEnd),
    ).length;
    connectors.push({
      connectorId: connector.id,
      publicRef: connector.publicRef,
      connectorType: connector.connectorType,
      maxKw: connector.maxPowerWatts / 1000,
      publicStatus: computed.publicStatus,
      safe,
      capacityRemaining: Math.max(0, policy!.capacityLimit - overlapping),
    });
  }

  return {
    show: true as const,
    needsSignIn: false as const,
    policySummary: publicPolicySummary(policy!),
    quote: quotePolicyFee(policy!),
    connectors,
    reservationDurationMinutes: policy!.reservationDurationMinutes,
    arrivalWindowMinutes: policy!.arrivalWindowMinutes,
  };
}

function publicPolicySummary(policy: NonNullable<Awaited<ReturnType<typeof getEffectivePolicy>>>) {
  return {
    version: policy.version,
    cancellationAllowed: policy.cancellationAllowed,
    cancellationCutoffMinutes: policy.cancellationCutoffMinutes,
    refundOnCancel: policy.refundOnCancel,
    cancellationPolicyText: policy.cancellationPolicyText,
    refundPolicyText: policy.refundPolicyText,
    noShowPolicyText: policy.noShowPolicyText,
    supportContactText: policy.supportContactText,
    reservationDurationMinutes: policy.reservationDurationMinutes,
    arrivalWindowMinutes: policy.arrivalWindowMinutes,
  };
}
