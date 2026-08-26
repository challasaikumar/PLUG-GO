/**
 * Driver authentication configuration.
 * Staff admin continues to use src/lib/auth/staff.ts and is not read from here.
 */

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.DRIVER_SESSION_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Development-only OTP bypass. Never honoured when NODE_ENV is production. */
export function isDevOtpEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return process.env.AUTH_DEV_OTP === "true";
}

export function otpExpirySeconds(): number {
  return intFromEnv("AUTH_OTP_EXPIRY_SECONDS", 300, 60, 900);
}

export function otpResendCooldownSeconds(): number {
  return intFromEnv("AUTH_OTP_RESEND_SECONDS", 60, 15, 300);
}

export function otpMaxAttempts(): number {
  return intFromEnv("AUTH_OTP_MAX_ATTEMPTS", 5, 3, 10);
}

export function otpSendPerPhonePerHour(): number {
  return intFromEnv("AUTH_OTP_SEND_PER_PHONE_HOUR", 5, 1, 20);
}

export function otpSendPerIpPerHour(): number {
  return intFromEnv("AUTH_OTP_SEND_PER_IP_HOUR", 10, 1, 40);
}

export function otpVerifyPerPhonePerHour(): number {
  return intFromEnv("AUTH_OTP_VERIFY_PER_PHONE_HOUR", 20, 5, 60);
}

export function sessionTtlDays(): number {
  return intFromEnv("AUTH_SESSION_DAYS", 30, 1, 90);
}

export function sessionCookieName(): string {
  return process.env.AUTH_SESSION_COOKIE?.trim() || "png_driver";
}

export function driverLoginAvailable(): { ok: true } | { ok: false; reason: "secret" | "delivery" } {
  if (!getAuthSecret()) return { ok: false, reason: "secret" };
  if (!isDevOtpEnabled() && !smsDeliveryConfigured()) return { ok: false, reason: "delivery" };
  return { ok: true };
}

export function smsDeliveryConfigured(): boolean {
  const provider = process.env.SMS_OTP_PROVIDER?.trim().toLowerCase();
  if (!provider || provider === "none") return false;
  if (provider === "webhook") {
    return Boolean(process.env.SMS_OTP_WEBHOOK_URL?.trim());
  }
  if (provider === "msg91" || provider === "twilio" || provider === "generic") {
    return Boolean(process.env.SMS_OTP_PROVIDER_KEY?.trim());
  }
  return false;
}

export function loginUnavailableMessage(reason: "secret" | "delivery"): string {
  if (reason === "secret") {
    return "Driver sign-in is unavailable because AUTH_SECRET is not configured on this server.";
  }
  return "Driver sign-in is unavailable because SMS delivery is not configured. Plug and Go still needs an SMS provider before production login can send codes.";
}
