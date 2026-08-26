import type { ChargePointCommissioningState, OcppProtocolVersion, OcppSecurityProfile } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { getPrisma } from "@/lib/db/prisma";
import { chargerCredentialService } from "./credentials";
import { ocppPathFor } from "./versions";
import { VERIFIED_OCPP_VERSIONS } from "./types";
import { OcppError } from "./types";

const IDENTITY_RE = /^[A-Za-z0-9._-]{1,48}$/;

export async function listStationChargePoints(stationId: string) {
  const prisma = getPrisma();
  return prisma.chargePoint.findMany({
    where: { stationId },
    include: {
      connectorMaps: { include: { connector: { select: { id: true, publicRef: true, connectorIndex: true } } } },
      capabilities: true,
      credentials: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, secretKid: true, certificateRef: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function staffChargePointView(row: Awaited<ReturnType<typeof listStationChargePoints>>[number]) {
  return {
    id: row.id,
    identity: row.identity,
    protocolVersion: row.protocolVersion,
    commissioningState: row.commissioningState,
    connectionStatus: row.connectionStatus,
    vendor: row.vendor,
    model: row.model,
    serialNumber: row.serialNumber,
    firmwareVersion: row.firmwareVersion,
    securityProfile: row.securityProfile,
    endpointPath: row.endpointPath,
    lastHeartbeatAt: row.lastHeartbeatAt?.toISOString() ?? null,
    lastBootAt: row.lastBootAt?.toISOString() ?? null,
    inventoryComplete: row.inventoryComplete,
    ocppCertifiedClaim: row.ocppCertifiedClaim,
    capabilities: row.capabilities,
    connectors: row.connectorMaps.map((map) => ({
      connectorId: map.connectorId,
      connectorPublicRef: map.connector.publicRef,
      ocppConnectorId: map.ocppConnectorId,
    })),
    credential: row.credentials[0]
      ? {
          id: row.credentials[0].id,
          secretKid: row.credentials[0].secretKid,
          certificateRef: row.credentials[0].certificateRef,
          createdAt: row.credentials[0].createdAt.toISOString(),
        }
      : null,
  };
}

export async function commissionChargePoint(
  actor: StaffActor,
  raw: unknown,
  requestId?: string,
): Promise<
  | { ok: true; chargePoint: ReturnType<typeof staffChargePointView>; oneTimePassword: string }
  | { ok: false; errors: Record<string, string> }
> {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!body) return { ok: false, errors: { body: "Could not read the charge point payload." } };

  const stationId = String(body.stationId ?? "").trim();
  const identity = String(body.identity ?? "").trim();
  const protocolVersion = String(body.protocolVersion ?? "").trim() as OcppProtocolVersion;
  const evseId = String(body.evseId ?? "").trim() || null;
  const vendor = String(body.vendor ?? "").trim() || null;
  const model = String(body.model ?? "").trim() || null;
  const serialNumber = String(body.serialNumber ?? "").trim() || null;
  const firmwareVersion = String(body.firmwareVersion ?? "").trim() || null;
  const commissioningState = (String(body.commissioningState ?? "draft") || "draft") as ChargePointCommissioningState;
  const securityProfile = (String(body.securityProfile ?? "basic_auth") || "basic_auth") as OcppSecurityProfile;
  const certificateRef = String(body.certificateRef ?? "").trim() || null;
  const mappings = Array.isArray(body.connectorMappings) ? body.connectorMappings : [];

  const errors: Record<string, string> = {};
  if (!stationId) errors.stationId = "Station is required.";
  if (!IDENTITY_RE.test(identity)) errors.identity = "Charge point identity must be 1–48 letters, digits, dot, underscore, or hyphen.";
  if (!VERIFIED_OCPP_VERSIONS.includes(protocolVersion as (typeof VERIFIED_OCPP_VERSIONS)[number])) {
    errors.protocolVersion =
      "Only OCPP 1.6 JSON is implemented. OCPP 2.0.1 and 2.1 adapters are stubs until a verified charger requires them.";
  }
  const allowedState: ChargePointCommissioningState[] = ["draft", "test", "pilot", "production", "disabled"];
  if (!allowedState.includes(commissioningState)) errors.commissioningState = "Invalid commissioning state.";
  if (commissioningState === "production") {
    errors.commissioningState =
      "Production commissioning is blocked until the hardware inventory, simulator tests, isolated physical tests, and production-control flags are complete.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const prisma = getPrisma();
  const station = await prisma.station.findUnique({ where: { id: stationId }, include: { connectors: true } });
  if (!station) return { ok: false, errors: { stationId: "Station not found." } };

  const parsedMaps: Array<{ connectorId: string; ocppConnectorId: number }> = [];
  for (const item of mappings) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const connectorId = String(row.connectorId ?? "").trim();
    const ocppConnectorId = Number.parseInt(String(row.ocppConnectorId ?? ""), 10);
    if (!connectorId || !Number.isInteger(ocppConnectorId) || ocppConnectorId < 1) {
      errors.connectorMappings = "Each mapping needs a connector and an OCPP connector id ≥ 1.";
      return { ok: false, errors };
    }
    if (!station.connectors.some((connector) => connector.id === connectorId)) {
      errors.connectorMappings = "Mapped connector does not belong to this station.";
      return { ok: false, errors };
    }
    parsedMaps.push({ connectorId, ocppConnectorId });
  }

  const chargePoint = await prisma.chargePoint.create({
    data: {
      identity,
      stationId,
      evseId,
      vendor,
      model,
      serialNumber,
      firmwareVersion,
      protocolVersion,
      securityProfile,
      endpointPath: ocppPathFor(protocolVersion, identity),
      commissioningState,
      ownedByStaffId: actor.id,
      inventoryComplete: false,
      ocppCertifiedClaim: false,
      connectorMaps: parsedMaps.length
        ? { create: parsedMaps.map((map) => ({ connectorId: map.connectorId, ocppConnectorId: map.ocppConnectorId })) }
        : undefined,
      capabilities: {
        create: [
          { code: "remote_start", enabled: true, notes: "Recorded for OCPP 1.6 simulator/pilot. Re-verify on physical hardware." },
          { code: "remote_stop", enabled: true, notes: "Recorded for OCPP 1.6 simulator/pilot. Re-verify on physical hardware." },
          { code: "meter_values", enabled: true, notes: "Energy.Active.Import.Register expected in Wh or kWh." },
        ],
      },
    },
  });
  const rotated = await chargerCredentialService.rotate(chargePoint.id, certificateRef);
  await writeAudit({
    actor,
    action: "charge_point.commission",
    targetType: "charge_point",
    targetId: chargePoint.id,
    after: {
      identity,
      protocolVersion,
      commissioningState,
      credentialKid: rotated.secretKid,
      certificateRef,
    },
    requestId,
  });
  const created = await listStationChargePoints(stationId);
  const view = created.find((row) => row.id === chargePoint.id);
  if (!view) throw new OcppError(500, "internal_error", "Charge point created but could not be reloaded.");
  return { ok: true, chargePoint: staffChargePointView(view), oneTimePassword: rotated.password };
}

export async function updateChargePointCommissioning(
  actor: StaffActor,
  id: string,
  raw: unknown,
  requestId?: string,
) {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!body) return { ok: false as const, errors: { body: "Could not read the update." } };
  const prisma = getPrisma();
  const current = await prisma.chargePoint.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };

  const commissioningState = body.commissioningState
    ? (String(body.commissioningState) as ChargePointCommissioningState)
    : current.commissioningState;
  if (commissioningState === "production") {
    return {
      ok: false as const,
      errors: {
        commissioningState:
          "Do not move a charger to Production until inventory, simulator, isolated hardware tests, and production-control flags pass.",
      },
    };
  }

  const updated = await prisma.chargePoint.update({
    where: { id },
    data: {
      commissioningState,
      vendor: body.vendor != null ? String(body.vendor) : current.vendor,
      model: body.model != null ? String(body.model) : current.model,
      serialNumber: body.serialNumber != null ? String(body.serialNumber) : current.serialNumber,
      firmwareVersion: body.firmwareVersion != null ? String(body.firmwareVersion) : current.firmwareVersion,
      inventoryComplete: body.inventoryComplete === true,
    },
  });
  await writeAudit({
    actor,
    action: "charge_point.update",
    targetType: "charge_point",
    targetId: id,
    before: { commissioningState: current.commissioningState },
    after: { commissioningState: updated.commissioningState, inventoryComplete: updated.inventoryComplete },
    requestId,
  });
  return { ok: true as const, chargePoint: updated };
}

export async function rotateChargePointCredential(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.chargePoint.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const rotated = await chargerCredentialService.rotate(id, null);
  await writeAudit({
    actor,
    action: "charge_point.rotate_credential",
    targetType: "charge_point",
    targetId: id,
    after: { secretKid: rotated.secretKid },
    requestId,
  });
  return { ok: true as const, oneTimePassword: rotated.password, secretKid: rotated.secretKid };
}
