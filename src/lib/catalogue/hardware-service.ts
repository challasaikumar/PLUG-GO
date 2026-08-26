import type { StaffActor } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import {
  parseConnectorWrite,
  parseEvseWrite,
  parseMediaWrite,
  parseOverrideWrite,
  parseTariffWrite,
} from "@/lib/catalogue/validation";
import { getPrisma } from "@/lib/db/prisma";
import type { MediaKind } from "@prisma/client";

export async function addEvse(actor: StaffActor, stationId: string, raw: unknown, requestId?: string) {
  const parsed = parseEvseWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) return { ok: false as const, notFound: true as const };
  const evse = await prisma.evse.create({
    data: {
      stationId,
      ...parsed.value,
      verifiedBy: actor.id,
      lastVerifiedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "evse.create",
    targetType: "evse",
    targetId: evse.id,
    after: { stationId, evseLabel: evse.evseLabel },
    requestId,
  });
  return { ok: true as const, evse };
}

export async function updateEvse(actor: StaffActor, id: string, raw: unknown, requestId?: string) {
  const parsed = parseEvseWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const current = await prisma.evse.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const evse = await prisma.evse.update({
    where: { id },
    data: { ...parsed.value, verifiedBy: actor.id, lastVerifiedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "evse.update",
    targetType: "evse",
    targetId: id,
    before: { evseLabel: current.evseLabel },
    after: { evseLabel: evse.evseLabel },
    requestId,
  });
  return { ok: true as const, evse };
}

export async function addConnector(
  actor: StaffActor,
  evseId: string,
  raw: unknown,
  requestId?: string,
) {
  const parsed = parseConnectorWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const evse = await prisma.evse.findUnique({ where: { id: evseId } });
  if (!evse) return { ok: false as const, notFound: true as const };
  const connector = await prisma.connector.create({
    data: {
      evseId,
      stationId: evse.stationId,
      ...parsed.value,
      verifiedBy: actor.id,
      lastVerifiedAt: new Date(),
    },
  });
  await prisma.currentConnectorStatus.create({
    data: {
      connectorId: connector.id,
      recordedStatus: "unknown",
      source: "manual_import",
      statusUpdatedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "connector.create",
    targetType: "connector",
    targetId: connector.id,
    after: { evseId, connectorType: connector.connectorType },
    requestId,
  });
  return { ok: true as const, connector };
}

export async function updateConnector(actor: StaffActor, id: string, raw: unknown, requestId?: string) {
  const parsed = parseConnectorWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const current = await prisma.connector.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const connector = await prisma.connector.update({
    where: { id },
    data: { ...parsed.value, verifiedBy: actor.id, lastVerifiedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "connector.update",
    targetType: "connector",
    targetId: id,
    before: { connectorType: current.connectorType },
    after: { connectorType: connector.connectorType },
    requestId,
  });
  return { ok: true as const, connector };
}

export async function createTariffDraft(
  actor: StaffActor,
  stationId: string,
  raw: unknown,
  requestId?: string,
) {
  const parsed = parseTariffWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) return { ok: false as const, notFound: true as const };
  const tariff = await prisma.tariffVersion.create({
    data: {
      stationId,
      connectorId: parsed.value.connectorId,
      connectorType: parsed.value.connectorType,
      timeBand: parsed.value.timeBand,
      timeBandNotes: parsed.value.timeBandNotes,
      energyPaisePerKwh: parsed.value.energyPaisePerKwh,
      servicePaisePerKwh: parsed.value.servicePaisePerKwh,
      parkingPaiseFlat: parsed.value.parkingPaiseFlat,
      parkingPaisePerMin: parsed.value.parkingPaisePerMin,
      idlePaisePerMin: parsed.value.idlePaisePerMin,
      idleGraceMinutes: parsed.value.idleGraceMinutes,
      reservationPaise: parsed.value.reservationPaise,
      gstRateBps: parsed.value.gstRateBps,
      discountKind: parsed.value.discountKind,
      discountName: parsed.value.discountName,
      discountValue: parsed.value.discountValue,
      effectiveFrom: new Date(parsed.value.effectiveFrom),
      effectiveTo: parsed.value.effectiveTo ? new Date(parsed.value.effectiveTo) : null,
      approvalStatus: "draft",
      dataSource: "operator_admin",
      verifiedBy: actor.id,
      lineItems: {
        create: [
          {
            sortOrder: 1,
            code: "energy",
            label: "Energy charge",
            calculation: "per_kwh",
            ratePaise: parsed.value.energyPaisePerKwh,
          },
          {
            sortOrder: 2,
            code: "service",
            label: "Service charge",
            calculation: "per_kwh",
            ratePaise: parsed.value.servicePaisePerKwh,
          },
        ],
      },
    },
  });
  await writeAudit({
    actor,
    action: "tariff.create",
    targetType: "tariff",
    targetId: tariff.id,
    after: {
      stationId,
      energyPaisePerKwh: tariff.energyPaisePerKwh,
      gstRateBps: tariff.gstRateBps,
      approvalStatus: tariff.approvalStatus,
    },
    requestId,
  });
  return { ok: true as const, tariff };
}

export async function approveTariff(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.tariffVersion.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  if (current.approvalStatus !== "draft") {
    return { ok: false as const, errors: { approvalStatus: "Only a draft tariff can be approved." } };
  }

  await prisma.tariffVersion.updateMany({
    where: {
      stationId: current.stationId,
      connectorId: current.connectorId,
      timeBand: current.timeBand,
      approvalStatus: "approved",
      id: { not: id },
    },
    data: { approvalStatus: "superseded" },
  });

  const tariff = await prisma.tariffVersion.update({
    where: { id },
    data: {
      approvalStatus: "approved",
      approvedBy: actor.id,
      approvedAt: new Date(),
      verifiedBy: actor.id,
      lastVerifiedAt: new Date(),
    },
  });
  await writeAudit({
    actor,
    action: "tariff.approve",
    targetType: "tariff",
    targetId: id,
    before: { approvalStatus: current.approvalStatus },
    after: { approvalStatus: tariff.approvalStatus, approvedBy: actor.role },
    requestId,
  });
  return { ok: true as const, tariff };
}

export async function addMedia(actor: StaffActor, stationId: string, raw: unknown, requestId?: string) {
  const parsed = parseMediaWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) return { ok: false as const, notFound: true as const };
  const media = await prisma.stationMedia.create({
    data: {
      stationId,
      storageUrl: parsed.value.storageUrl,
      altText: parsed.value.altText,
      caption: parsed.value.caption,
      kind: parsed.value.kind as MediaKind,
      rightsConfirmed: parsed.value.rightsConfirmed,
      publicationStatus: "draft",
    },
  });
  await writeAudit({
    actor,
    action: "media.create",
    targetType: "media",
    targetId: media.id,
    after: { stationId, kind: media.kind, rightsConfirmed: media.rightsConfirmed },
    requestId,
  });
  return { ok: true as const, media };
}

export async function overrideStatus(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseOverrideWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const connector = await prisma.connector.findUnique({ where: { id: parsed.value.connectorId } });
  if (!connector) return { ok: false as const, notFound: true as const };

  const occurredAt = new Date();
  const event = await prisma.connectorAvailabilityEvent.create({
    data: {
      stationId: connector.stationId,
      evseId: connector.evseId,
      connectorId: connector.id,
      recordedStatus: parsed.value.recordedStatus,
      source: parsed.value.source,
      occurredAt,
      statusUpdatedAt: occurredAt,
      overrideReason: parsed.value.reason,
      overrideExpiresAt: new Date(parsed.value.expiresAt),
    },
  });
  await prisma.currentConnectorStatus.upsert({
    where: { connectorId: connector.id },
    create: {
      connectorId: connector.id,
      recordedStatus: parsed.value.recordedStatus,
      source: parsed.value.source,
      statusUpdatedAt: occurredAt,
      lastEventId: event.id,
      overrideReason: parsed.value.reason,
      overrideExpiresAt: new Date(parsed.value.expiresAt),
    },
    update: {
      recordedStatus: parsed.value.recordedStatus,
      source: parsed.value.source,
      statusUpdatedAt: occurredAt,
      lastEventId: event.id,
      overrideReason: parsed.value.reason,
      overrideExpiresAt: new Date(parsed.value.expiresAt),
    },
  });
  await prisma.station.update({
    where: { id: connector.stationId },
    data: { statusUpdatedAt: occurredAt },
  });
  await writeAudit({
    actor,
    action: "status.override",
    targetType: "connector",
    targetId: connector.id,
    after: {
      recordedStatus: parsed.value.recordedStatus,
      expiresAt: parsed.value.expiresAt,
      reason: parsed.value.reason,
    },
    requestId,
  });
  return { ok: true as const, event };
}

export async function listStationAudit(stationId: string) {
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
      evses: { select: { id: true, connectors: { select: { id: true } } } },
      tariffs: { select: { id: true } },
      media: { select: { id: true } },
      chargePoints: { select: { id: true } },
    },
  });
  if (!station) return null;
  const ids = [
    stationId,
    ...station.evses.map((evse) => evse.id),
    ...station.evses.flatMap((evse) => evse.connectors.map((connector) => connector.id)),
    ...station.tariffs.map((tariff) => tariff.id),
    ...station.media.map((media) => media.id),
    ...station.chargePoints.map((row) => row.id),
  ];
  return prisma.staffAuditEvent.findMany({
    where: { targetId: { in: ids } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listAudit(targetType: string, targetId: string) {
  const prisma = getPrisma();
  return prisma.staffAuditEvent.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
