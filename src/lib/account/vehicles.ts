import type { ConnectorType } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { writeDriverAudit } from "./audit";
import { parseVehicleInput } from "./vehicle-input";

export { parseVehicleInput, type VehicleInput, type VehicleParseResult } from "./vehicle-input";

export async function listDriverVehicles(driverId: string) {
  const prisma = getPrisma();
  return prisma.driverVehicle.findMany({
    where: { driverId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPreferredConnectorType(driverId: string): Promise<ConnectorType | null> {
  const prisma = getPrisma();
  const latest = await prisma.driverVehicle.findFirst({
    where: { driverId },
    orderBy: { updatedAt: "desc" },
    select: { connectorType: true },
  });
  return latest?.connectorType ?? null;
}

export async function createDriverVehicle(
  driverId: string,
  raw: unknown,
  requestId?: string,
) {
  const parsed = parseVehicleInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const vehicle = await prisma.driverVehicle.create({
    data: { driverId, ...parsed.value },
  });
  await writeDriverAudit({
    driverId,
    action: "vehicle.created",
    targetType: "vehicle",
    targetId: vehicle.id,
    requestId,
  });
  return { ok: true as const, vehicle };
}

export async function updateDriverVehicle(
  driverId: string,
  vehicleId: string,
  raw: unknown,
  requestId?: string,
) {
  const parsed = parseVehicleInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const existing = await prisma.driverVehicle.findFirst({
    where: { id: vehicleId, driverId },
  });
  if (!existing) return { ok: false as const, notFound: true as const };
  const vehicle = await prisma.driverVehicle.update({
    where: { id: existing.id },
    data: parsed.value,
  });
  await writeDriverAudit({
    driverId,
    action: "vehicle.updated",
    targetType: "vehicle",
    targetId: vehicle.id,
    requestId,
  });
  return { ok: true as const, vehicle };
}

export async function deleteDriverVehicle(driverId: string, vehicleId: string, requestId?: string) {
  const prisma = getPrisma();
  const existing = await prisma.driverVehicle.findFirst({
    where: { id: vehicleId, driverId },
  });
  if (!existing) return { ok: false as const, notFound: true as const };
  await prisma.driverVehicle.delete({ where: { id: existing.id } });
  await writeDriverAudit({
    driverId,
    action: "vehicle.deleted",
    targetType: "vehicle",
    targetId: existing.id,
    requestId,
  });
  return { ok: true as const };
}
