import type { ChecklistOutcome, StaffRole, WorkOrderStatus } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";
import { getIncident } from "./incidents";
import { isApprovedEvidenceUrl, OpsError } from "./roles";
import { resolveOpsScope } from "./scope";

const WORK_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  queued: ["in_progress", "cancelled"],
  in_progress: ["paused", "completed", "cancelled"],
  paused: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function listTechnicianQueue(actor: StaffActor) {
  if (!roleAllows(actor, ROLE_MATRIX.technicianField)) {
    throw new OpsError(403, "staff_forbidden", "Only assigned technicians can open the field workspace.");
  }
  const prisma = getPrisma();
  return prisma.technicianWorkOrder.findMany({
    where: {
      assignedActorId: actor.id,
      status: { in: ["queued", "in_progress", "paused"] },
    },
    include: {
      incident: { select: { id: true, publicRef: true, title: true, severity: true, status: true } },
      station: {
        select: {
          id: true,
          name: true,
          city: true,
          slug: true,
          addressLine1: true,
          landmark: true,
          arrivalInstructions: true,
          emergencyInstructions: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getTechnicianWorkOrder(actor: StaffActor, workOrderId: string) {
  const prisma = getPrisma();
  const order = await prisma.technicianWorkOrder.findUnique({
    where: { id: workOrderId },
    include: {
      checklist: { orderBy: { sortOrder: "asc" } },
      evidence: { orderBy: { createdAt: "asc" } },
      incident: true,
      station: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          slug: true,
          addressLine1: true,
          addressLine2: true,
          landmark: true,
          arrivalInstructions: true,
          emergencyInstructions: true,
          accessHoursSummary: true,
          parkingDetails: true,
        },
      },
    },
  });
  if (!order) throw new OpsError(404, "not_found", "That work order was not found.");
  if (actor.role !== "super_admin" && order.assignedActorId !== actor.id) {
    throw new OpsError(403, "staff_forbidden", "This work order is assigned to another technician.");
  }
  const scope = await resolveOpsScope(actor);
  if (scope.stationIds !== "all" && !scope.stationIds.includes(order.stationId)) {
    throw new OpsError(403, "staff_forbidden", "This technician is not assigned to that station.");
  }
  return order;
}

export async function transitionWorkOrder(
  actor: StaffActor,
  workOrderId: string,
  toStatus: WorkOrderStatus,
  notes?: string,
  requestId?: string,
) {
  const order = await getTechnicianWorkOrder(actor, workOrderId);
  if (!WORK_TRANSITIONS[order.status].includes(toStatus)) {
    throw new OpsError(409, "conflict", `Cannot move a work order from ${order.status} to ${toStatus}.`);
  }
  if (toStatus === "completed") {
    const unfinished = order.checklist.filter((item) => !item.outcome);
    if (unfinished.length) {
      throw new OpsError(409, "conflict", "Complete every checklist item (pass, fail, or not applicable) before closing.");
    }
    if ((order.incident.severity === "critical" || order.incident.severity === "high") && order.evidence.length === 0) {
      throw new OpsError(409, "conflict", "High and critical work needs at least one evidence photo from approved storage.");
    }
  }
  const prisma = getPrisma();
  const now = new Date();
  const updated = await prisma.technicianWorkOrder.update({
    where: { id: workOrderId },
    data: {
      status: toStatus,
      notes: notes?.trim() || order.notes,
      startedAt: toStatus === "in_progress" ? order.startedAt ?? now : order.startedAt,
      pausedAt: toStatus === "paused" ? now : order.pausedAt,
      completedAt: toStatus === "completed" ? now : order.completedAt,
    },
  });
  if (toStatus === "completed") {
    await prisma.incident.update({
      where: { id: order.incidentId },
      data: {
        status: "resolved",
        resolvedAt: now,
        events: {
          create: {
            actorId: actor.id,
            actorRole: actor.role as StaffRole,
            kind: "status",
            fromStatus: order.incident.status,
            toStatus: "resolved",
            body: "Technician completed the work order. Operator verification may still be required.",
          },
        },
      },
    });
  }
  await writeAudit({
    actor,
    action: "work_order.transition",
    targetType: "work_order",
    targetId: workOrderId,
    before: { status: order.status },
    after: { status: toStatus },
    requestId,
  });
  return updated;
}

export async function setChecklistOutcome(
  actor: StaffActor,
  workOrderId: string,
  code: string,
  outcome: ChecklistOutcome,
) {
  await getTechnicianWorkOrder(actor, workOrderId);
  const prisma = getPrisma();
  const item = await prisma.maintenanceChecklist.findUnique({
    where: { workOrderId_code: { workOrderId, code } },
  });
  if (!item) throw new OpsError(404, "not_found", "That checklist item was not found.");
  return prisma.maintenanceChecklist.update({
    where: { id: item.id },
    data: { outcome },
  });
}

export async function addMaintenanceEvidence(
  actor: StaffActor,
  workOrderId: string,
  storageUrl: string,
  altText: string,
  requestId?: string,
) {
  await getTechnicianWorkOrder(actor, workOrderId);
  if (!isApprovedEvidenceUrl(storageUrl.trim())) {
    throw new OpsError(
      400,
      "validation_error",
      "Evidence must be an https URL from approved storage. Files are not accepted in this request body.",
    );
  }
  if (!altText.trim()) {
    throw new OpsError(400, "validation_error", "Evidence needs alt text.");
  }
  const prisma = getPrisma();
  const evidence = await prisma.maintenanceEvidence.create({
    data: {
      workOrderId,
      storageUrl: storageUrl.trim(),
      altText: altText.trim(),
      uploadedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "work_order.evidence",
    targetType: "work_order",
    targetId: workOrderId,
    after: { evidenceId: evidence.id },
    requestId,
  });
  return evidence;
}

export async function getIncidentForTechnician(actor: StaffActor, incidentId: string) {
  const incident = await getIncident(actor, incidentId);
  if (actor.role !== "super_admin" && incident.assignedTechnicianId !== actor.id) {
    throw new OpsError(403, "staff_forbidden", "This incident is not assigned to you.");
  }
  return incident;
}
