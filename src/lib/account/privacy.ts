import { getPrisma } from "@/lib/db/prisma";
import { revokeAllDriverSessions } from "@/lib/auth/session";
import { writeDriverAudit } from "./audit";

export async function getNotificationPreference(driverId: string) {
  const prisma = getPrisma();
  const existing = await prisma.notificationPreference.findUnique({ where: { driverId } });
  if (existing) return existing;
  return prisma.notificationPreference.create({
    data: { driverId },
  });
}

export async function updateNotificationPreference(
  driverId: string,
  raw: unknown,
  requestId?: string,
) {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!body) return { ok: false as const, error: "The preference update could not be read." };

  const productUpdates = body.productUpdates;
  const marketingSms = body.marketingSms;
  const marketingEmail = body.marketingEmail;
  if (
    typeof productUpdates !== "boolean" ||
    typeof marketingSms !== "boolean" ||
    typeof marketingEmail !== "boolean"
  ) {
    return { ok: false as const, error: "Choose yes or no for each notification preference." };
  }

  const prisma = getPrisma();
  const preference = await prisma.notificationPreference.upsert({
    where: { driverId },
    create: { driverId, productUpdates, marketingSms, marketingEmail },
    update: { productUpdates, marketingSms, marketingEmail },
  });
  await writeDriverAudit({
    driverId,
    action: "privacy.preferences_updated",
    targetType: "notification_preference",
    targetId: preference.id,
    requestId,
  });
  return { ok: true as const, preference };
}

export async function createDataExport(driverId: string, requestId?: string) {
  const prisma = getPrisma();
  const [driver, vehicles, saved, preference, exports, deletions, bookings, tickets, sessions] = await Promise.all([
    prisma.driver.findUnique({ where: { id: driverId } }),
    prisma.driverVehicle.findMany({ where: { driverId }, orderBy: { createdAt: "asc" } }),
    prisma.savedStation.findMany({
      where: { driverId },
      include: { station: { select: { name: true, slug: true, city: true, state: true, publicationStatus: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getNotificationPreference(driverId),
    prisma.dataExportRequest.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.accountDeletionRequest.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { driverId },
      select: {
        publicRef: true,
        referenceCode: true,
        status: true,
        windowStart: true,
        windowEnd: true,
        totalPaise: true,
        createdAt: true,
        station: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.supportIssue.findMany({
      where: { driverId },
      select: { publicReference: true, category: true, status: true, paymentState: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.chargingSession.findMany({
      where: { driverId },
      select: {
        publicRef: true,
        status: true,
        startedAt: true,
        endedAt: true,
        energyMilliWh: true,
        supportReference: true,
        createdAt: true,
        station: { select: { name: true, city: true, slug: true } },
        connector: { select: { publicRef: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  if (!driver || driver.deletedAt) return { ok: false as const, notFound: true as const };

  const request = await prisma.dataExportRequest.create({
    data: { driverId, status: "completed", completedAt: new Date() },
  });
  await writeDriverAudit({
    driverId,
    action: "privacy.export_requested",
    targetType: "data_export",
    targetId: request.id,
    requestId,
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    exportRequestId: request.id,
    note:
      "This file contains driver account data held by the Plug and Go website today. Card numbers, CVV, UPI PINs, payment-provider secrets, charger credentials, and raw OCPP payloads are never stored in this export. Energy invoices are not issued from a remote-command response.",
    account: {
      id: driver.id,
      phoneE164: driver.phoneE164,
      phoneCountry: driver.phoneCountry,
      createdAt: driver.createdAt.toISOString(),
      lastLoginAt: driver.lastLoginAt?.toISOString() ?? null,
    },
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      connectorType: vehicle.connectorType,
      batteryKwh: vehicle.batteryKwh,
      nickname: vehicle.nickname,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    })),
    savedStations: saved.map((row) => ({
      savedAt: row.createdAt.toISOString(),
      stationName: row.station.name,
      stationSlug: row.station.publicationStatus === "published" ? row.station.slug : null,
      city: row.station.city,
      state: row.station.state,
      publicationStatus:
        row.station.publicationStatus === "published" ? "published" : "no_longer_published",
    })),
    notificationPreference: {
      productUpdates: preference.productUpdates,
      marketingSms: preference.marketingSms,
      marketingEmail: preference.marketingEmail,
    },
    previousExportRequests: exports.map((item) => ({
      id: item.id,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
    deletionRequests: deletions.map((item) => ({
      id: item.id,
      status: item.status,
      confirmedAt: item.confirmedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    })),
    supportRecords: tickets.map((row) => ({
      publicReference: row.publicReference,
      category: row.category,
      status: row.status,
      paymentState: row.paymentState,
      createdAt: row.createdAt.toISOString(),
    })),
    supportRecordsNote:
      "Booking-related support tickets created from this login are listed without payment-provider identifiers.",
    bookings: bookings.map((row) => ({
      publicRef: row.publicRef,
      referenceCode: row.referenceCode,
      status: row.status,
      stationName: row.station.name,
      city: row.station.city,
      windowStart: row.windowStart.toISOString(),
      windowEnd: row.windowEnd.toISOString(),
      totalPaise: row.totalPaise,
      createdAt: row.createdAt.toISOString(),
    })),
    chargingSessions: sessions.map((row) => ({
      publicRef: row.publicRef,
      status: row.status,
      stationName: row.station.name,
      city: row.station.city,
      stationSlug: row.station.slug,
      connectorPublicRef: row.connector.publicRef,
      startedAt: row.startedAt?.toISOString() ?? null,
      endedAt: row.endedAt?.toISOString() ?? null,
      energyMilliWh: row.energyMilliWh?.toString() ?? null,
      supportReference: row.supportReference,
      createdAt: row.createdAt.toISOString(),
    })),
  };

  return { ok: true as const, payload, requestId: request.id };
}

export async function confirmAccountDeletion(driverId: string, confirmation: unknown, requestId?: string) {
  const phrase =
    typeof confirmation === "object" &&
    confirmation &&
    !Array.isArray(confirmation) &&
    "confirmation" in confirmation
      ? String((confirmation as { confirmation: unknown }).confirmation)
      : typeof confirmation === "string"
        ? confirmation
        : "";

  if (phrase.trim().toUpperCase() !== "DELETE") {
    return {
      ok: false as const,
      error: "Type DELETE to confirm this request. The account is not removed immediately.",
    };
  }

  const prisma = getPrisma();
  const existing = await prisma.accountDeletionRequest.findFirst({
    where: { driverId, status: "received" },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  const request =
    existing ??
    (await prisma.accountDeletionRequest.create({
      data: { driverId, status: "received", confirmedAt: now },
    }));

  await prisma.driver.update({
    where: { id: driverId },
    data: { deletedAt: now },
  });
  await revokeAllDriverSessions(driverId, now);
  await writeDriverAudit({
    driverId,
    action: "privacy.deletion_requested",
    targetType: "deletion_request",
    targetId: request.id,
    requestId,
  });
  return { ok: true as const, request };
}

export async function getOpenDeletionRequest(driverId: string) {
  const prisma = getPrisma();
  return prisma.accountDeletionRequest.findFirst({
    where: { driverId, status: "received" },
    orderBy: { createdAt: "desc" },
  });
}
