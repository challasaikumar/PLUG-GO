import { createHmac, timingSafeEqual } from "node:crypto";
import { csmsInternalHmacSecret } from "./config";

export function signInternalBody(body: string, timestamp = Math.floor(Date.now() / 1000).toString()): {
  timestamp: string;
  signature: string;
} {
  const secret = csmsInternalHmacSecret();
  if (!secret) {
    throw new Error("CSMS_INTERNAL_HMAC_SECRET or AUTH_SECRET is required for internal CSMS HMAC.");
  }
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return { timestamp, signature };
}

export function verifyInternalSignature(body: string, timestamp: string | null, signature: string | null): boolean {
  const secret = csmsInternalHmacSecret();
  if (!secret || !timestamp || !signature) return false;
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isInteger(ts)) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > 60) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(signature, "hex");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
