import type { Prisma } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";

export type PolicyWrite = {
  bookingEnabled: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
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
};

export function parsePolicyWrite(raw: unknown): { ok: true; value: PolicyWrite } | { ok: false; errors: Record<string, string> } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: { form: "The policy could not be read." } };
  }
  const body = raw as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const int = (key: string, min: number, max: number) => {
    const parsed = typeof body[key] === "number" ? body[key] : Number.parseInt(String(body[key] ?? ""), 10);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      errors[key] = `${key} must be an integer between ${min} and ${max}.`;
      return min;
    }
    return parsed;
  };
  const text = (key: string) => (typeof body[key] === "string" ? body[key].trim() : "");
  const effectiveFrom = body.effectiveFrom ? new Date(String(body.effectiveFrom)) : new Date();
  const effectiveToRaw = body.effectiveTo ? new Date(String(body.effectiveTo)) : null;
  if (Number.isNaN(effectiveFrom.getTime())) errors.effectiveFrom = "effectiveFrom is not a valid date.";
  const eligible = Array.isArray(body.eligibleConnectorIds)
    ? body.eligibleConnectorIds.filter((id): id is string => typeof id === "string" && id.length > 8)
    : typeof body.eligibleConnectorIds === "string"
      ? body.eligibleConnectorIds.split(",").map((id) => id.trim()).filter(Boolean)
      : [];
  if (eligible.length < 1) errors.eligibleConnectorIds = "Select at least one connector. Booking does not assume every connector is reservable.";
  const cancellationPolicyText = text("cancellationPolicyText");
  const refundPolicyText = text("refundPolicyText");
  const noShowPolicyText = text("noShowPolicyText");
  const supportContactText = text("supportContactText");
  if (!cancellationPolicyText) errors.cancellationPolicyText = "Cancellation rules are required.";
  if (!refundPolicyText) errors.refundPolicyText = "Refund rules are required.";
  if (!noShowPolicyText) errors.noShowPolicyText = "No-show policy is required.";
  if (!supportContactText) errors.supportContactText = "Support contact is required.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      bookingEnabled: body.bookingEnabled === true || body.bookingEnabled === "true",
      effectiveFrom,
      effectiveTo: effectiveToRaw && !Number.isNaN(effectiveToRaw.getTime()) ? effectiveToRaw : null,
      eligibleConnectorIds: eligible,
      arrivalWindowMinutes: int("arrivalWindowMinutes", 5, 180),
      reservationDurationMinutes: int("reservationDurationMinutes", 10, 240),
      capacityLimit: int("capacityLimit", 1, 20),
      bookingFeePaise: int("bookingFeePaise", 0, 10000000),
      gstRateBps: int("gstRateBps", 0, 4000),
      cancellationAllowed: body.cancellationAllowed === true || body.cancellationAllowed === "true",
      cancellationCutoffMinutes:
        body.cancellationCutoffMinutes === "" || body.cancellationCutoffMinutes == null
          ? null
          : int("cancellationCutoffMinutes", 0, 1440),
      refundOnCancel: body.refundOnCancel === true || body.refundOnCancel === "true",
      refundPercentBps: int("refundPercentBps", 0, 10000),
      cancellationPolicyText,
      noShowPolicyText,
      refundPolicyText,
      supportContactText,
    },
  };
}

export async function upsertDraftPolicy(actor: StaffActor, stationId: string, raw: unknown, requestId?: string) {
  const parsed = parsePolicyWrite(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: { connectors: { select: { id: true } } },
  });
  if (!station) return { ok: false as const, notFound: true as const };
  const allowed = new Set(station.connectors.map((row) => row.id));
  if (parsed.value.eligibleConnectorIds.some((id) => !allowed.has(id))) {
    return { ok: false as const, errors: { eligibleConnectorIds: "Connectors must belong to this station." } };
  }

  const existing = await prisma.bookingPolicy.findFirst({
    where: { stationId, approvalStatus: "draft" },
    orderBy: { createdAt: "desc" },
  });
  const data: Prisma.BookingPolicyUncheckedCreateInput = {
    stationId,
    ...parsed.value,
    approvalStatus: "draft",
    version: existing ? existing.version : 1,
  };
  const policy = existing
    ? await prisma.bookingPolicy.update({ where: { id: existing.id }, data: parsed.value })
    : await prisma.bookingPolicy.create({ data });
  await writeAudit({
    actor,
    action: existing ? "booking_policy.update" : "booking_policy.create",
    targetType: "booking_policy",
    targetId: policy.id,
    after: { stationId, bookingEnabled: policy.bookingEnabled },
    requestId,
  });
  return { ok: true as const, policy };
}

export async function approvePolicy(actor: StaffActor, policyId: string, requestId?: string) {
  const prisma = getPrisma();
  const policy = await prisma.bookingPolicy.findUnique({ where: { id: policyId } });
  if (!policy) return { ok: false as const, notFound: true as const };
  const parsed = parsePolicyWrite(policy);
  if (!parsed.ok) return parsed;
  const approved = await prisma.bookingPolicy.update({
    where: { id: policyId },
    data: {
      approvalStatus: "approved",
      approvedBy: actor.id,
      approvedAt: new Date(),
      version: policy.approvalStatus === "draft" ? Math.max(1, policy.version) : policy.version,
    },
  });
  await writeAudit({
    actor,
    action: "booking_policy.approve",
    targetType: "booking_policy",
    targetId: approved.id,
    requestId,
  });
  return { ok: true as const, policy: approved };
}

export async function listStationPolicies(stationId: string) {
  const prisma = getPrisma();
  return prisma.bookingPolicy.findMany({
    where: { stationId },
    orderBy: { createdAt: "desc" },
  });
}
