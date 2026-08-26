import type { CommandApprovalAction, StaffRole } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows, staffMfaEnforced } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";
import { csmsCommandService } from "@/lib/ocpp/commands";
import { OcppError } from "@/lib/ocpp/types";
import { commandRiskNote, OpsError, opsStaffRemoteCommandsEnabled } from "./roles";
import { assertStationAccess, resolveOpsScope, stationWhere } from "./scope";

const IMPLEMENTABLE: CommandApprovalAction[] = ["remote_stop"];

export async function listCommandApprovals(actor: StaffActor) {
  if (!roleAllows(actor, ROLE_MATRIX.readCommands)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot read command records.");
  }
  const scope = await resolveOpsScope(actor);
  const prisma = getPrisma();
  const [approvals, remote] = await Promise.all([
    prisma.commandApproval.findMany({
      where: { station: stationWhere(scope) },
      include: { station: { select: { name: true, city: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.remoteCommand.findMany({
      where: { stationId: scope.stationIds === "all" ? undefined : { in: scope.stationIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        publicRef: true,
        type: true,
        status: true,
        reason: true,
        timeoutAt: true,
        evidenceState: true,
        stationId: true,
        connectorId: true,
        requestedAt: true,
        actorType: true,
      },
    }),
  ]);
  return { approvals, remote };
}

export async function requestCommandApproval(
  actor: StaffActor,
  input: {
    action: CommandApprovalAction;
    stationId: string;
    reason: string;
    mfaAssertion: boolean;
    connectorId?: string;
    sessionPublicRef?: string;
    chargePointId?: string;
    requestId?: string;
  },
) {
  if (!roleAllows(actor, ROLE_MATRIX.requestCommand)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot request remote commands.");
  }
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, input.stationId);
  if (!input.reason.trim() || input.reason.trim().length < 8) {
    throw new OpsError(400, "validation_error", "A specific reason of at least 8 characters is required.");
  }
  if (!input.mfaAssertion) {
    throw new OpsError(
      403,
      "staff_mfa_required",
      "Remote commands require an MFA assertion. Production also requires an identity provider with MFA.",
    );
  }
  if (process.env.NODE_ENV === "production" && !staffMfaEnforced()) {
    throw new OpsError(403, "staff_mfa_required", "Production remote commands stay disabled until staff MFA is enforced.");
  }

  const prisma = getPrisma();
  const approval = await prisma.commandApproval.create({
    data: {
      action: input.action,
      actorId: actor.id,
      actorRole: actor.role as StaffRole,
      stationId: input.stationId,
      connectorId: input.connectorId ?? null,
      sessionPublicRef: input.sessionPublicRef ?? null,
      chargePointId: input.chargePointId ?? null,
      reason: input.reason.trim(),
      riskNote: commandRiskNote(input.action),
      mfaAssertion: true,
      status: IMPLEMENTABLE.includes(input.action) ? "pending" : "denied",
    },
  });
  await writeAudit({
    actor,
    action: "command.request",
    targetType: "command_approval",
    targetId: approval.id,
    after: { action: input.action, status: approval.status },
    requestId: input.requestId,
  });
  if (!IMPLEMENTABLE.includes(input.action)) {
    throw new OpsError(
      501,
      "not_configured",
      `${input.action} is not implemented in this phase. The request was recorded as denied. The browser never sends OCPP.`,
    );
  }
  return approval;
}

export async function approveCommand(actor: StaffActor, approvalId: string, requestId?: string) {
  if (!roleAllows(actor, ROLE_MATRIX.approveCommand)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot approve remote commands.");
  }
  const prisma = getPrisma();
  const approval = await prisma.commandApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new OpsError(404, "not_found", "That command approval was not found.");
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, approval.stationId);
  if (approval.status !== "pending") {
    throw new OpsError(409, "conflict", "Only pending requests can be approved.");
  }
  if (approval.actorId === actor.id && actor.role !== "super_admin") {
    throw new OpsError(403, "staff_forbidden", "A second authorised operator must approve this command.");
  }
  const updated = await prisma.commandApproval.update({
    where: { id: approvalId },
    data: { status: "approved", approverId: actor.id, approvedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "command.approve",
    targetType: "command_approval",
    targetId: approvalId,
    requestId,
  });
  return dispatchIfAllowed(actor, updated.id, requestId);
}

export async function breakGlassCommand(
  actor: StaffActor,
  approvalId: string,
  expiresAtIso: string,
  requestId?: string,
) {
  if (!roleAllows(actor, ROLE_MATRIX.breakGlassCommand)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot use break-glass.");
  }
  const expiresAt = new Date(expiresAtIso);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + 15 * 60 * 1000) {
    throw new OpsError(400, "validation_error", "Break-glass expiry must be in the next 15 minutes.");
  }
  const prisma = getPrisma();
  const approval = await prisma.commandApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new OpsError(404, "not_found", "That command approval was not found.");
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, approval.stationId);
  if (approval.status !== "pending") {
    throw new OpsError(409, "conflict", "Break-glass applies to pending requests only.");
  }
  await prisma.commandApproval.update({
    where: { id: approvalId },
    data: {
      status: "break_glass",
      breakGlass: true,
      breakGlassExpiresAt: expiresAt,
      approverId: actor.id,
      approvedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "command.break_glass",
    targetType: "command_approval",
    targetId: approvalId,
    after: { expiresAt: expiresAt.toISOString() },
    requestId,
  });
  return dispatchIfAllowed(actor, approvalId, requestId);
}

async function dispatchIfAllowed(actor: StaffActor, approvalId: string, requestId?: string) {
  const prisma = getPrisma();
  const approval = await prisma.commandApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new OpsError(404, "not_found", "That command approval was not found.");
  if (approval.breakGlass && approval.breakGlassExpiresAt && approval.breakGlassExpiresAt < new Date()) {
    await prisma.commandApproval.update({ where: { id: approvalId }, data: { status: "expired" } });
    throw new OpsError(409, "conflict", "The break-glass window has expired. The command was not sent.");
  }
  if (!opsStaffRemoteCommandsEnabled()) {
    throw new OpsError(
      403,
      "forbidden",
      "Approval is recorded, but staff remote commands remain disabled (OPS_STAFF_REMOTE_COMMANDS_ENABLED). The browser did not send OCPP.",
    );
  }
  if (approval.action !== "remote_stop") {
    throw new OpsError(501, "not_configured", "Only remote stop can be dispatched from operations in this phase.");
  }
  if (!approval.sessionPublicRef) {
    throw new OpsError(400, "validation_error", "Remote stop needs a charging session reference.");
  }
  try {
    const result = await csmsCommandService.requestStaffRemoteStop({
      actorId: actor.id,
      sessionPublicRef: approval.sessionPublicRef,
      reason: approval.reason,
      idempotencyKey: `ops-cmd-${approval.id}`,
    });
    await prisma.commandApproval.update({
      where: { id: approvalId },
      data: {
        status: "dispatched",
        dispatchedAt: new Date(),
        commandId: result.command.id,
      },
    });
    await writeAudit({
      actor,
      action: "command.dispatch",
      targetType: "command_approval",
      targetId: approvalId,
      after: { remoteCommandId: result.command.id, status: result.command.status },
      requestId,
    });
    return { approvalId, command: result.command };
  } catch (error) {
    if (error instanceof OcppError) {
      throw new OpsError(error.status, error.code, error.message);
    }
    throw error;
  }
}

export async function rejectCommand(actor: StaffActor, approvalId: string, requestId?: string) {
  if (!roleAllows(actor, ROLE_MATRIX.approveCommand)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot reject remote commands.");
  }
  const prisma = getPrisma();
  const approval = await prisma.commandApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new OpsError(404, "not_found", "That command approval was not found.");
  const scope = await resolveOpsScope(actor);
  assertStationAccess(scope, approval.stationId);
  const updated = await prisma.commandApproval.update({
    where: { id: approvalId },
    data: { status: "rejected", approverId: actor.id },
  });
  await writeAudit({
    actor,
    action: "command.reject",
    targetType: "command_approval",
    targetId: approvalId,
    requestId,
  });
  return updated;
}
