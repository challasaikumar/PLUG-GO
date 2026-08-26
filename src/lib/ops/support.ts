import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";
import { canSeeCustomerContext, OpsError } from "./roles";
import { resolveOpsScope, stationWhere } from "./scope";
import { SUPPORT_TEMPLATES } from "./support-templates";

export async function listSupportQueue(
  actor: StaffActor,
  filters: {
    category?: string;
    status?: string;
    stationId?: string;
    assigneeId?: string;
    priority?: string;
  },
) {
  if (!roleAllows(actor, ROLE_MATRIX.readSupportQueue)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot open the internal support queue.");
  }
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  const issues = await prisma.supportIssue.findMany({
    where: {
      category: filters.category as never,
      status: filters.status as never,
      stationId: filters.stationId,
      station: filters.stationId || scope.stationIds !== "all" ? stationWhere(scope) : undefined,
      assignments: filters.assigneeId ? { some: { assigneeActorId: filters.assigneeId } } : undefined,
    },
    include: {
      station: { select: { id: true, name: true, city: true, slug: true } },
      assignments: { orderBy: { createdAt: "desc" }, take: 1 },
      notes: { orderBy: { createdAt: "desc" }, take: 3 },
      booking: { select: { publicRef: true, status: true } },
      chargingSession: { select: { publicRef: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return {
    templates: SUPPORT_TEMPLATES,
    tickets: issues.map((issue) => ({
      id: issue.id,
      publicReference: issue.publicReference,
      category: issue.category,
      status: issue.status,
      channel: issue.channel,
      createdAt: issue.createdAt.toISOString(),
      station: issue.station,
      bookingRef: issue.booking?.publicRef ?? null,
      bookingStatus: issue.booking?.status ?? null,
      sessionRef: issue.chargingSession?.publicRef ?? null,
      sessionStatus: issue.chargingSession?.status ?? null,
      paymentState: issue.paymentState,
      assigneeActorId: issue.assignments[0]?.assigneeActorId ?? null,
      slaOpenedAt: issue.createdAt.toISOString(),
      description: issue.description,
      reporter: canSeeCustomerContext(actor)
        ? {
            name: issue.reporterName,
            email: issue.reporterEmail,
            phone: issue.reporterPhone ? `${issue.reporterPhone.slice(0, 5)}…` : null,
          }
        : { name: issue.reporterName ? "On file" : null, email: null, phone: null },
      latestNote: issue.notes[0]
        ? { customerVisible: issue.notes[0].customerVisible, createdAt: issue.notes[0].createdAt.toISOString() }
        : null,
    })),
  };
}

export async function assignSupportTicket(actor: StaffActor, issueId: string, assigneeActorId: string, requestId?: string) {
  if (!roleAllows(actor, ROLE_MATRIX.assignSupport)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot assign support tickets.");
  }
  const prisma = getPrisma();
  const issue = await prisma.supportIssue.findUnique({ where: { id: issueId } });
  if (!issue) throw new OpsError(404, "not_found", "That ticket was not found.");
  if (issue.stationId) {
    const scope = await resolveOpsScope(actor);
    if (scope.stationIds !== "all" && !scope.stationIds.includes(issue.stationId)) {
      throw new OpsError(403, "staff_forbidden", "That ticket is outside this actor’s station scope.");
    }
  }
  const assignment = await prisma.supportTicketAssignment.create({
    data: { supportIssueId: issueId, assigneeActorId, assignedById: actor.id },
  });
  await writeAudit({
    actor,
    action: "support.assign",
    targetType: "support_issue",
    targetId: issueId,
    after: { assigneeActorId },
    requestId,
  });
  return assignment;
}

export async function addSupportNote(
  actor: StaffActor,
  issueId: string,
  body: string,
  customerVisible: boolean,
  templateId?: string,
  requestId?: string,
) {
  if (!roleAllows(actor, ROLE_MATRIX.readSupportQueue)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot note support tickets.");
  }
  if (!roleAllows(actor, ROLE_MATRIX.assignSupport) && actor.role !== "station_operator" && actor.role !== "super_admin") {
    throw new OpsError(403, "staff_forbidden", "This role cannot write support notes.");
  }
  const text = body.trim();
  if (text.length < 4) throw new OpsError(400, "validation_error", "Edit the template before sending. Empty replies are not stored.");
  const prisma = getPrisma();
  const issue = await prisma.supportIssue.findUnique({ where: { id: issueId } });
  if (!issue) throw new OpsError(404, "not_found", "That ticket was not found.");
  const note = await prisma.supportIssueNote.create({
    data: {
      supportIssueId: issueId,
      actorId: actor.id,
      customerVisible,
      body: templateId ? `[template:${templateId}] ${text}` : text,
    },
  });
  await writeAudit({
    actor,
    action: customerVisible ? "support.note_customer" : "support.note_internal",
    targetType: "support_issue",
    targetId: issueId,
    requestId,
  });
  return note;
}
