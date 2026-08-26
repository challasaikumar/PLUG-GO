import type { ChargePoint, ChargePointCommissioningState, OcppProtocolVersion } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { hashOpaque, sha256Hex } from "@/lib/auth/crypto";
import { chargerCredentialService } from "./credentials";
import { credentialPepper, maxConnectionsPerIp, maxCsmsConnections } from "./config";
import { adapterFor } from "./versions";
import type { ConnectionRejectReason } from "./types";

export async function lookupChargePoint(identity: string): Promise<ChargePoint | null> {
  const prisma = getPrisma();
  return prisma.chargePoint.findUnique({ where: { identity } });
}

export async function authorizeChargePointConnection(input: {
  identity: string;
  pathVersion: OcppProtocolVersion;
  password: string | null;
  duplicate: boolean;
  connectionCount: number;
  ipCount: number;
}): Promise<{ ok: true; chargePoint: ChargePoint } | { ok: false; reason: ConnectionRejectReason }> {
  if (input.connectionCount >= maxCsmsConnections()) {
    return { ok: false, reason: "connection_limit" };
  }
  if (input.ipCount >= maxConnectionsPerIp()) {
    return { ok: false, reason: "connection_limit" };
  }
  if (input.duplicate) {
    return { ok: false, reason: "duplicate" };
  }

  const chargePoint = await lookupChargePoint(input.identity);
  if (!chargePoint) return { ok: false, reason: "unknown_charge_point" };
  if (chargePoint.commissioningState === "disabled") return { ok: false, reason: "disabled" };
  if (chargePoint.commissioningState === "draft") return { ok: false, reason: "draft" };
  if (chargePoint.protocolVersion !== input.pathVersion) return { ok: false, reason: "suspicious" };

  const adapter = adapterFor(chargePoint.protocolVersion);
  if (!adapter.implemented) return { ok: false, reason: "unsupported_version" };

  const credential = await chargerCredentialService.latestFor(chargePoint.id);
  if (!credential || !input.password) return { ok: false, reason: "unauthorized" };
  if (!chargerCredentialService.verify(input.password, credential.secretHash, credential.secretKid)) {
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true, chargePoint };
}

export async function recordConnectionChange(input: {
  chargePointId: string;
  state: "connected" | "disconnected" | "rejected";
  reason: string;
  remoteAddressHash?: string | null;
}) {
  const prisma = getPrisma();
  const now = new Date();
  await prisma.chargerConnection.create({
    data: {
      chargePointId: input.chargePointId,
      state: input.state,
      reason: input.reason,
      remoteAddressHash: input.remoteAddressHash ?? null,
      connectedAt: input.state === "connected" ? now : null,
      disconnectedAt: input.state === "disconnected" || input.state === "rejected" ? now : null,
    },
  });
  await prisma.chargePoint.update({
    where: { id: input.chargePointId },
    data: { connectionStatus: input.state === "rejected" ? "rejected" : input.state },
  });
}

export function hashRemoteAddress(address: string | undefined): string | null {
  if (!address) return null;
  const pepper = credentialPepper();
  if (!pepper) return sha256Hex(address);
  return hashOpaque(address, pepper);
}

export function commissioningAllowsSocket(state: ChargePointCommissioningState): boolean {
  return state === "test" || state === "pilot" || state === "production";
}
