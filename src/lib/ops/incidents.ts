import type { IncidentSeverity, IncidentStatus, IncidentTrigger, StaffRole } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";
import { DEFAULT_MAINTENANCE_CHECKLIST, INCIDENT_TRANSITIONS, OpsError } from "./roles";
import { assertStationAccess, resolveOpsScope, stationWhere, type OpsScope } from "./scope";

const OPEN_STATUSES: IncidentStatus[] = [
  "new",
  "acknowledged",
  "diagnosing",
  "technician_assigned",
  "waiting_on_vendor",
  "resolved",
  "verification_required",
];

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return (INCIDENT_TRANSITIONS[from] ?? []).includes(to);
}

export async function listIncidents(
  actor: StaffActor,
  filters: {
    stationId?: string;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    technicianId?: string;
    city?: string;
  },
) {
  const scope = await resolveOpsScope(actor);
  if (!roleAllows(actor, ROLE_MATRIX.readOps) && actor.role !== "technician") {
    throw new OpsError(403, "staff_forbidden", "This role cannot read incidents.");
  }
  const prisma = getPrisma();
  return prisma.incident.findMany({
    where: {
      station: {
        ...stationWhere(scope),
        city: filters.city ? { equals: filters.city, mode: "insensitive" } : undefined,
      },
      stationId: filters.stationId,
      severity: filters.severity,
      status: filters.status,
      assignedTechnicianId: filters.technicianId,
    },
    include: {
      station: { select: { id: true, name: true, city: true, slug: true, publicationStatus: true } },
      connector: { select: { id: true, publicRef: true, connectorType: true } },
      workOrders: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getIncident(actor: StaffActor, incidentId: string) {
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      station: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          slug: true,
          addressLine1: true,
          landmark: true,
          arrivalInstructions: true,
          emergencyInstructions: true,
          internalNotes: true,
          supportPhoneOverride: true,
          publicationStatus: true,
        },
      },
      connector: { select: { id: true, publicRef: true, connectorType: true, connectorIndex: true } },
      chargePoint: {
        select: {
          id: true,
          identity: true,
          serialNumber: true,
          vendor: true,
          model: true,
          lastHeartbeatAt: true,
          lastFaultCode: true,
          connectionStatus: true,
        },
      },
      chargingSession: { select: { id: true, publicRef: true, status: true, driverId: true } },
      supportIssue: { select: { id: true, publicReference: true, status: true, category: true } },
      events: { orderBy: { createdAt: "asc" } },
      workOrders: {
        include: {
          checklist: { orderBy: { sortOrder: "asc" } },
          evidence: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!incident) throw new OpsError(404, "not_found", "That incident was not found.");
  assertStationAccess(scope, incident.stationId);
  return redactIncident(actor, incident);
}

function redactIncident<T extends { chargingSession: { driverId: string } | null; station: { internalNotes: string | null }; chargePoint: { identity: string | null; serialNumber: string | null } | null }>(
  actor: StaffActor,
  incident: T,
): T {
  const copy = { ...incident };
  if (!roleAllows(actor, ROLE_MATRIX.readOpsCustomerContext) && copy.chargingSession) {
    copy.chargingSession = { ...copy.chargingSession, driverId: "redacted" };
  }
  if (actor.role === "technician" && copy.station) {
    copy.station = { ...copy.station, internalNotes: null };
  }
  if (!roleAllows(actor, ROLE_MATRIX.readOpsRawDevice) && copy.chargePoint) {
    copy.chargePoint = { ...copy.chargePoint, identity: null, serialNumber: null };
  }
  return copy;
}

export async function createIncident(
  actor: StaffActor,
  input: {
    stationId: string;
    title: string;
    summary: string;
    severity: IncidentSeverity;
    connectorId?: string | null;
    chargePointId?: string | null;
    chargingSessionId?: string | null;
    supportIssueId?: string | null;
    suggestedFrom?: IncidentTrigger;
    requestId?: string;
  },
) {
  if (!roleAllows(actor, ROLE_MATRIX.writeIncidents)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot create incidents.");
  }
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, input.stationId);
  if (!input.title.trim() || input.title.trim().length < 4) {
    throw new OpsError(400, "validation_error", "Incident title is required.");
  }
  const prisma = getPrisma();
  const incident = await prisma.incident.create({
    data: {
      stationId: input.stationId,
      title: input.title.trim(),
      summary: input.summary.trim() || input.title.trim(),
      severity: input.severity,
      connectorId: input.connectorId ?? null,
      chargePointId: input.chargePointId ?? null,
      chargingSessionId: input.chargingSessionId ?? null,
      supportIssueId: input.supportIssueId ?? null,
      suggestedFrom: input.suggestedFrom ?? "manual",
      customerVisibleStatus: "We are investigating this charger.",
      events: {
        create: {
          actorId: actor.id,
          actorRole: actor.role as StaffRole,
          kind: "status",
          toStatus: "new",
          body: "Incident opened.",
        },
      },
    },
  });
  await writeAudit({
    actor,
    action: "incident.create",
    targetType: "incident",
    targetId: incident.id,
    after: { stationId: input.stationId, severity: input.severity, trigger: incident.suggestedFrom },
    requestId: input.requestId,
  });
  return incident;
}

export async function transitionIncident(
  actor: StaffActor,
  incidentId: string,
  toStatus: IncidentStatus,
  body?: string,
  requestId?: string,
) {
  if (!roleAllows(actor, ROLE_MATRIX.writeIncidents)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot update incidents.");
  }
  const incident = await getIncident(actor, incidentId);
  if (!canTransitionIncident(incident.status, toStatus)) {
    throw new OpsError(409, "conflict", `Cannot move an incident from ${incident.status} to ${toStatus}.`);
  }
  if (toStatus === "closed" && incident.severity === "critical" && !incident.verifiedAt) {
    throw new OpsError(409, "conflict", "Critical incidents need operator verification before close.");
  }
  const prisma = getPrisma();
  const now = new Date();
  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: toStatus,
      resolvedAt: toStatus === "resolved" ? now : incident.resolvedAt,
      closedAt: toStatus === "closed" ? now : incident.closedAt,
      events: {
        create: {
          actorId: actor.id,
          actorRole: actor.role as StaffRole,
          kind: "status",
          fromStatus: incident.status,
          toStatus,
          body: body?.trim() || null,
        },
      },
    },
  });
  await writeAudit({
    actor,
    action: "incident.transition",
    targetType: "incident",
    targetId: incidentId,
    before: { status: incident.status },
    after: { status: toStatus },
    requestId,
  });
  return updated;
}

export async function addIncidentNote(
  actor: StaffActor,
  incidentId: string,
  body: string,
  customerVisible: boolean,
  requestId?: string,
) {
  if (!roleAllows(actor, ROLE_MATRIX.writeIncidents)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot note incidents.");
  }
  await getIncident(actor, incidentId);
  if (!body.trim() || body.trim().length < 4) {
    throw new OpsError(400, "validation_error", "A note is required.");
  }
  const prisma = getPrisma();
  const event = await prisma.incidentEvent.create({
    data: {
      incidentId,
      actorId: actor.id,
      actorRole: actor.role as StaffRole,
      kind: customerVisible ? "note_customer" : "note_internal",
      body: body.trim(),
      customerVisible,
    },
  });
  await writeAudit({
    actor,
    action: customerVisible ? "incident.note_customer" : "incident.note_internal",
    targetType: "incident",
    targetId: incidentId,
    requestId,
  });
  return event;
}

export async function assignTechnician(
  actor: StaffActor,
  incidentId: string,
  technicianActorId: string,
  requestId?: string,
) {
  if (!roleAllows(actor, ROLE_MATRIX.assignTechnician)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot assign technicians.");
  }
  const incident = await getIncident(actor, incidentId);
  const prisma = getPrisma();
  const assignment = await prisma.stationAssignment.findFirst({
    where: { actorId: technicianActorId, stationId: incident.stationId, role: "technician", active: true },
  });
  if (!assignment) {
    throw new OpsError(409, "conflict", "That technician is not assigned to this station.");
  }
  const nextStatus: IncidentStatus =
    incident.status === "new" || incident.status === "acknowledged" || incident.status === "diagnosing"
      ? "technician_assigned"
      : incident.status;

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      assignedTechnicianId: technicianActorId,
      assignedActorId: technicianActorId,
      status: nextStatus,
      events: {
        create: {
          actorId: actor.id,
          actorRole: actor.role as StaffRole,
          kind: "assignment",
          fromStatus: incident.status,
          toStatus: nextStatus,
          body: `Technician ${technicianActorId} assigned.`,
        },
      },
    },
  });

  const existing = await prisma.technicianWorkOrder.findFirst({
    where: { incidentId, assignedActorId: technicianActorId, status: { not: "cancelled" } },
  });
  if (!existing) {
    await prisma.technicianWorkOrder.create({
      data: {
        incidentId,
        stationId: incident.stationId,
        assignedActorId: technicianActorId,
        checklist: {
          create: DEFAULT_MAINTENANCE_CHECKLIST.map((item) => ({
            code: item.code,
            label: item.label,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });
  }
  await writeAudit({
    actor,
    action: "incident.assign_technician",
    targetType: "incident",
    targetId: incidentId,
    after: { technicianActorId },
    requestId,
  });
  return getIncident(actor, incidentId);
}

export async function escalateToVendor(actor: StaffActor, incidentId: string, body: string, requestId?: string) {
  if (!roleAllows(actor, ROLE_MATRIX.writeIncidents)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot escalate incidents.");
  }
  const incident = await getIncident(actor, incidentId);
  const prisma = getPrisma();
  const toStatus: IncidentStatus = incident.status === "closed" ? incident.status : "waiting_on_vendor";
  if (incident.status !== "waiting_on_vendor" && !canTransitionIncident(incident.status, "waiting_on_vendor") && incident.status !== "technician_assigned" && incident.status !== "diagnosing") {
    throw new OpsError(409, "conflict", "This incident cannot escalate to the vendor from its current state.");
  }
  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: toStatus,
      vendorEscalatedAt: new Date(),
      events: {
        create: {
          actorId: actor.id,
          actorRole: actor.role as StaffRole,
          kind: "escalation",
          fromStatus: incident.status,
          toStatus,
          body: body.trim() || "Escalated to charger vendor.",
        },
      },
    },
  });
  await writeAudit({
    actor,
    action: "incident.escalate_vendor",
    targetType: "incident",
    targetId: incidentId,
    requestId,
  });
  return getIncident(actor, incidentId);
}

export async function verifyIncidentResolution(actor: StaffActor, incidentId: string, requestId?: string) {
  if (!roleAllows(actor, ROLE_MATRIX.verifyIncident)) {
    throw new OpsError(403, "staff_forbidden", "Only a station operator can verify resolution.");
  }
  const incident = await getIncident(actor, incidentId);
  if (incident.status !== "verification_required" && incident.status !== "resolved") {
    throw new OpsError(409, "conflict", "Verification is only for resolved incidents.");
  }
  const prisma = getPrisma();
  const toStatus: IncidentStatus = incident.status === "resolved" ? "verification_required" : "verification_required";
  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: incident.status === "resolved" ? "verification_required" : incident.status,
      verifiedAt: new Date(),
      events: {
        create: {
          actorId: actor.id,
          actorRole: actor.role as StaffRole,
          kind: "verification",
          fromStatus: incident.status,
          toStatus: incident.status === "resolved" ? "verification_required" : incident.status,
          body: "Operator verified the resolution evidence.",
        },
      },
    },
  });
  await writeAudit({
    actor,
    action: "incident.verify",
    targetType: "incident",
    targetId: incidentId,
    after: { toStatus },
    requestId,
  });
  return getIncident(actor, incidentId);
}

export async function hasOpenIncident(scope: OpsScope, where: { chargePointId?: string; connectorId?: string; stationId: string }) {
  const prisma = getPrisma();
  const existing = await prisma.incident.findFirst({
    where: {
      stationId: where.stationId,
      chargePointId: where.chargePointId,
      connectorId: where.connectorId,
      status: { in: OPEN_STATUSES },
    },
    select: { id: true },
  });
  return existing;
}

export { OPEN_STATUSES };
