import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function generateOtpCode(digits = 6): string {
  const max = 10 ** digits;
  return String(randomInt(0, max)).padStart(digits, "0");
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashOtpCode(code: string, salt: string, secret: string): string {
  return createHmac("sha256", secret).update(`${salt}:${code}`).digest("hex");
}

export function otpCodesEqual(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function hashOpaque(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function peekUserAgent(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 180);
}
