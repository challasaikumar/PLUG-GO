import type { StaffActor } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { parseHostWrite, parseOrgWrite } from "@/lib/catalogue/validation";
import { getPrisma } from "@/lib/db/prisma";
import type { DataSource } from "@prisma/client";

export async function createOrganisation(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseOrgWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const organisation = await prisma.organisation.create({
    data: {
      ...parsed.value,
      isDemo: false,
      dataSource: "operator_admin" as DataSource,
      verifiedBy: actor.id,
      lastVerifiedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "organisation.create",
    targetType: "organisation",
    targetId: organisation.id,
    after: { legalName: organisation.legalName, brandName: organisation.brandName },
    requestId,
  });
  return { ok: true as const, organisation };
}

export async function createHost(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseHostWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const organisation = await prisma.organisation.findUnique({
    where: { id: parsed.value.organisationId },
  });
  if (!organisation) return { ok: false as const, errors: { organisationId: "Unknown organisation." } };
  const host = await prisma.host.create({
    data: {
      ...parsed.value,
      isDemo: false,
      dataSource: "operator_admin",
      verifiedBy: actor.id,
      lastVerifiedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "host.create",
    targetType: "host",
    targetId: host.id,
    after: { hostDisplayName: host.hostDisplayName, organisationId: host.organisationId },
    requestId,
  });
  return { ok: true as const, host };
}
