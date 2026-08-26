import { randomBytes, timingSafeEqual } from "node:crypto";
import { hashOpaque } from "@/lib/auth/crypto";
import { getPrisma } from "@/lib/db/prisma";
import { credentialPepper } from "./config";
import { OcppError } from "./types";

export class ChargerCredentialService {
  hashSecret(plaintext: string): { secretHash: string; secretKid: string } {
    const pepper = credentialPepper();
    if (!pepper) {
      throw new OcppError(
        503,
        "not_configured",
        "CSMS_CREDENTIAL_PEPPER or AUTH_SECRET is required to store charger credentials.",
      );
    }
    const secretKid = randomBytes(8).toString("hex");
    return { secretHash: hashOpaque(`${secretKid}:${plaintext}`, pepper), secretKid };
  }

  generatePassword(): string {
    return randomBytes(24).toString("base64url");
  }

  verify(plaintext: string, secretHash: string, secretKid: string | null): boolean {
    const pepper = credentialPepper();
    if (!pepper || !secretKid) return false;
    const computed = hashOpaque(`${secretKid}:${plaintext}`, pepper);
    const left = Buffer.from(computed, "hex");
    const right = Buffer.from(secretHash, "hex");
    if (left.length === 0 || left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }

  async latestFor(chargePointId: string) {
    const prisma = getPrisma();
    return prisma.chargePointCredential.findFirst({
      where: { chargePointId },
      orderBy: { createdAt: "desc" },
    });
  }

  async rotate(chargePointId: string, certificateRef?: string | null) {
    const password = this.generatePassword();
    const hashed = this.hashSecret(password);
    const prisma = getPrisma();
    const row = await prisma.chargePointCredential.create({
      data: {
        chargePointId,
        secretHash: hashed.secretHash,
        secretKid: hashed.secretKid,
        certificateRef: certificateRef?.trim() || null,
        rotatedAt: new Date(),
      },
    });
    return { credentialId: row.id, password, secretKid: hashed.secretKid, certificateRef: row.certificateRef };
  }
}

export const chargerCredentialService = new ChargerCredentialService();
