import type { StaffActor } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";
import type { Prisma, StaffRole } from "@prisma/client";

export async function writeAudit(input: {
  actor: StaffActor;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  requestId?: string;
}) {
  const prisma = getPrisma();
  await prisma.staffAuditEvent.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role as StaffRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      beforeSummary: (input.before ?? undefined) as Prisma.InputJsonValue | undefined,
      afterSummary: (input.after ?? undefined) as Prisma.InputJsonValue | undefined,
      requestId: input.requestId,
    },
  });
}

export function publicSafeSummary(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = { ...(value as Record<string, unknown>) };
  delete record.internalNotes;
  delete record.notes;
  delete record.serialNumber;
  delete record.firmwareNotes;
  delete record.identity;
  delete record.secretHash;
  delete record.secretKid;
  delete record.certificateRef;
  delete record.ocppChargePointId;
  delete record.endpointPath;
  delete record.primaryContactName;
  delete record.primaryContactPhone;
  delete record.primaryContactEmail;
  delete record.reporterName;
  delete record.reporterPhone;
  delete record.reporterEmail;
  return record;
}
