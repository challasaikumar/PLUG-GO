import type { ExportJobKind, Prisma, StaffRole } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { ROLE_MATRIX, roleAllows } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";
import { exportSyncRowLimit, OpsError } from "./roles";
import { resolveOpsScope, stationWhere } from "./scope";

function kindAllowed(actor: StaffActor, kind: ExportJobKind): boolean {
  if (kind === "finance_refunds") return roleAllows(actor, ROLE_MATRIX.requestExportFinance);
  if (kind === "ops_incidents" || kind === "compliance_station") {
    return roleAllows(actor, ROLE_MATRIX.requestExportOps);
  }
  if (kind === "host_summary") return roleAllows(actor, ROLE_MATRIX.requestExportHost);
  if (kind === "fleet_activity") return roleAllows(actor, ROLE_MATRIX.requestExportFleet);
  return false;
}

export async function requestExportJob(
  actor: StaffActor,
  input: {
    kind: ExportJobKind;
    filters: Record<string, unknown>;
    from?: string;
    to?: string;
    requestId?: string;
  },
) {
  if (!kindAllowed(actor, input.kind)) {
    throw new OpsError(403, "staff_forbidden", "This role cannot request that export.");
  }
  const prisma = getPrisma();
  const job = await prisma.exportJob.create({
    data: {
      kind: input.kind,
      actorId: actor.id,
      actorRole: actor.role as StaffRole,
      filters: {
        ...input.filters,
        from: input.from ?? null,
        to: input.to ?? null,
      } as Prisma.InputJsonValue,
      status: "queued",
    },
  });
  await writeAudit({
    actor,
    action: "export.request",
    targetType: "export_job",
    targetId: job.id,
    after: { kind: input.kind },
    requestId: input.requestId,
  });
  return processExportJob(actor, job.id);
}

export async function processExportJob(actor: StaffActor, jobId: string) {
  const prisma = getPrisma();
  const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new OpsError(404, "not_found", "That export job was not found.");
  if (job.actorId !== actor.id && actor.role !== "super_admin") {
    throw new OpsError(403, "staff_forbidden", "Export jobs are only readable by the requestor.");
  }
  const scope = await resolveOpsScope(actor);
  const filters = (job.filters ?? {}) as Record<string, unknown>;
  const from = typeof filters.from === "string" && filters.from ? new Date(filters.from) : new Date(Date.now() - 7 * 86400000);
  const to = typeof filters.to === "string" && filters.to ? new Date(filters.to) : new Date();

  await prisma.exportJob.update({ where: { id: jobId }, data: { status: "running" } });

  let rows: string[][] = [];
  if (job.kind === "finance_refunds") {
    const refunds = await prisma.refund.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        booking: scope.stationIds === "all" ? undefined : { stationId: { in: scope.stationIds } },
      },
      include: { booking: { select: { publicRef: true, stationId: true } } },
      take: exportSyncRowLimit() + 1,
    });
    if (refunds.length > exportSyncRowLimit()) {
      return leaveQueued(jobId, "More than 500 rows. Leave queued — do not generate large exports synchronously.");
    }
    rows = [
      ["refund_id", "booking_ref", "amount_paise", "status", "created_at"],
      ...refunds.map((row) => [
        row.id,
        row.booking.publicRef,
        String(row.amountPaise),
        row.status,
        row.createdAt.toISOString(),
      ]),
    ];
  } else if (job.kind === "ops_incidents") {
    const incidents = await prisma.incident.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        station: stationWhere(scope),
      },
      include: { station: { select: { name: true, city: true, publicRef: true } } },
      take: exportSyncRowLimit() + 1,
    });
    if (incidents.length > exportSyncRowLimit()) {
      return leaveQueued(jobId, "More than 500 rows. Leave queued — do not generate large exports synchronously.");
    }
    rows = [
      ["incident_id", "public_ref", "station_public_ref", "city", "severity", "status", "created_at"],
      ...incidents.map((row) => [
        row.id,
        row.publicRef,
        row.station.publicRef,
        row.station.city,
        row.severity,
        row.status,
        row.createdAt.toISOString(),
      ]),
    ];
  } else if (job.kind === "compliance_station") {
    const stations = await prisma.station.findMany({
      where: stationWhere(scope),
      include: {
        evses: { include: { connectors: { include: { currentStatus: true } } } },
        tariffs: { where: { approvalStatus: "approved" }, orderBy: { effectiveFrom: "desc" }, take: 1 },
        chargePoints: { select: { lastHeartbeatAt: true, lastMeterAt: true, connectionStatus: true } },
      },
      take: exportSyncRowLimit() + 1,
    });
    if (stations.length > exportSyncRowLimit()) {
      return leaveQueued(jobId, "More than 500 rows. Leave queued — do not generate large exports synchronously.");
    }
    rows = [
      [
        "station_public_ref",
        "evse_id",
        "connector_public_ref",
        "city",
        "state",
        "recorded_status",
        "status_updated_at",
        "tariff_energy_paise_kwh",
        "last_heartbeat_at",
        "last_meter_at",
      ],
    ];
    for (const station of stations) {
      for (const evse of station.evses) {
        for (const connector of evse.connectors) {
          const cp = station.chargePoints[0];
          rows.push([
            station.publicRef,
            evse.id,
            connector.publicRef,
            station.city,
            station.state,
            connector.currentStatus?.recordedStatus ?? "unknown",
            connector.currentStatus?.statusUpdatedAt.toISOString() ?? "",
            station.tariffs[0] ? String(station.tariffs[0].energyPaisePerKwh) : "",
            cp?.lastHeartbeatAt?.toISOString() ?? "",
            cp?.lastMeterAt?.toISOString() ?? "",
          ]);
        }
      }
    }
  } else if (job.kind === "host_summary") {
    rows = [
      ["note"],
      ["Host exports exclude driver personal data and payment details. Revenue is omitted until a host settlement agreement exists."],
    ];
  } else {
    rows = [
      ["note"],
      ["Fleet activity exports are aggregates only. Invitation, payroll, and full cost allocation are out of scope."],
    ];
  }

  const csv = rows.map((line) => line.map(csvCell).join(",")).join("\n");
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 24 * 60 * 60 * 1000);
  const updated = await prisma.exportJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      csvContent: csv,
      fileRef: `export:${job.publicRef}`,
      rowCount: Math.max(0, rows.length - 1),
      generatedAt,
      expiresAt,
    },
  });
  await writeAudit({
    actor,
    action: "export.generated",
    targetType: "export_job",
    targetId: jobId,
    after: { rowCount: updated.rowCount, expiresAt: expiresAt.toISOString() },
  });
  return updated;
}

async function leaveQueued(jobId: string, error: string) {
  const prisma = getPrisma();
  return prisma.exportJob.update({
    where: { id: jobId },
    data: { status: "queued", error },
  });
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

export async function getExportJob(actor: StaffActor, publicRef: string) {
  const prisma = getPrisma();
  const job = await prisma.exportJob.findUnique({ where: { publicRef } });
  if (!job) throw new OpsError(404, "not_found", "That export job was not found.");
  if (job.actorId !== actor.id && actor.role !== "super_admin") {
    throw new OpsError(403, "staff_forbidden", "This export belongs to another requestor.");
  }
  if (job.expiresAt && job.expiresAt < new Date()) {
    await prisma.exportJob.update({ where: { id: job.id }, data: { status: "expired" } });
    throw new OpsError(410, "not_found", "This export has expired.");
  }
  return job;
}

export async function downloadExportCsv(actor: StaffActor, publicRef: string) {
  const job = await getExportJob(actor, publicRef);
  if (job.status !== "completed" || !job.csvContent) {
    throw new OpsError(409, "conflict", "This export is not ready to download.");
  }
  const prisma = getPrisma();
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { downloadCount: { increment: 1 } },
  });
  await writeAudit({
    actor,
    action: "export.download",
    targetType: "export_job",
    targetId: job.id,
  });
  return { csv: job.csvContent, filename: `${job.kind}-${job.publicRef}.csv` };
}
