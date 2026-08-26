import { getPrisma } from "@/lib/db/prisma";
import {
  driverLoginAvailable,
  getAuthSecret,
  isDevOtpEnabled,
  loginUnavailableMessage,
  otpExpirySeconds,
  otpMaxAttempts,
  otpResendCooldownSeconds,
  otpSendPerIpPerHour,
  otpSendPerPhonePerHour,
  otpVerifyPerPhonePerHour,
} from "./config";
import { generateOtpCode, generateSalt, hashOpaque, hashOtpCode, otpCodesEqual } from "./crypto";
import { parseMobileNumber, type NormalisedPhone } from "./phone";
import { consumeRateLimit } from "./rate-limit";
import { SmsDeliveryError, SmsNotConfiguredError, sendOtpSms } from "./sms";
import { createDriverSession, type DriverActor } from "./session";
import { featureEnabledSync } from "@/lib/release/flags";

export const GENERIC_AUTH_ERROR =
  "That sign-in attempt did not work. Check the code or request a new one.";
export const GENERIC_RATE_LIMIT_ERROR = "Please wait before requesting another code.";

export class DriverAuthError extends Error {
  readonly status: number;
  readonly code: "not_configured" | "auth_rate_limited" | "auth_failed" | "validation_error";

  constructor(
    status: number,
    code: "not_configured" | "auth_rate_limited" | "auth_failed" | "validation_error",
    message: string,
  ) {
    super(message);
    this.name = "DriverAuthError";
    this.status = status;
    this.code = code;
  }
}

export type RequestOtpResult = {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
  developmentCode?: string;
};

export type VerifyOtpResult = {
  driver: DriverActor;
  sessionToken: string;
  isNewAccount: boolean;
};

function availabilityOrThrow() {
  if (!featureEnabledSync("driverOtpLogin")) {
    throw new DriverAuthError(
      503,
      "not_configured",
      "Driver sign-in is disabled until FLAG_DRIVER_OTP is true and SMS delivery is configured.",
    );
  }
  const available = driverLoginAvailable();
  if (!available.ok) {
    throw new DriverAuthError(503, "not_configured", loginUnavailableMessage(available.reason));
  }
}

function secretOrThrow(): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new DriverAuthError(503, "not_configured", loginUnavailableMessage("secret"));
  }
  return secret;
}

export function parseDriverPhone(raw: unknown): NormalisedPhone {
  if (typeof raw !== "string") {
    throw new DriverAuthError(400, "validation_error", "Enter a valid 10-digit Indian mobile number.");
  }
  const parsed = parseMobileNumber(raw);
  if (!parsed.ok) {
    throw new DriverAuthError(400, "validation_error", parsed.error);
  }
  return parsed.value;
}

export async function requestDriverOtp(input: {
  phone: unknown;
  ip?: string | null;
  now?: Date;
}): Promise<RequestOtpResult> {
  availabilityOrThrow();
  const secret = secretOrThrow();
  const now = input.now ?? new Date();
  const phone = parseDriverPhone(input.phone);
  const prisma = getPrisma();

  const phoneKey = `otp_send:phone:${hashOpaque(phone.e164, secret)}`;
  const ipKey = input.ip ? `otp_send:ip:${hashOpaque(input.ip, secret)}` : null;

  const phoneLimit = await consumeRateLimit(phoneKey, otpSendPerPhonePerHour(), 60 * 60 * 1000, now);
  if (!phoneLimit.allowed) {
    throw new DriverAuthError(429, "auth_rate_limited", GENERIC_RATE_LIMIT_ERROR);
  }
  if (ipKey) {
    const ipLimit = await consumeRateLimit(ipKey, otpSendPerIpPerHour(), 60 * 60 * 1000, now);
    if (!ipLimit.allowed) {
      throw new DriverAuthError(429, "auth_rate_limited", GENERIC_RATE_LIMIT_ERROR);
    }
  }

  const latest = await prisma.driverAuthChallenge.findFirst({
    where: { phoneE164: phone.e164, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (latest && latest.resendAvailableAt > now) {
    throw new DriverAuthError(429, "auth_rate_limited", GENERIC_RATE_LIMIT_ERROR);
  }

  if (latest && !latest.consumedAt) {
    await prisma.driverAuthChallenge.update({
      where: { id: latest.id },
      data: { consumedAt: now },
    });
  }

  const code = generateOtpCode(6);
  const salt = generateSalt();
  const expiresAt = new Date(now.getTime() + otpExpirySeconds() * 1000);
  const resendAvailableAt = new Date(now.getTime() + otpResendCooldownSeconds() * 1000);

  const challenge = await prisma.driverAuthChallenge.create({
    data: {
      phoneE164: phone.e164,
      codeHash: hashOtpCode(code, salt, secret),
      salt,
      expiresAt,
      maxAttempts: otpMaxAttempts(),
      resendAvailableAt,
      createdIpHash: input.ip ? hashOpaque(input.ip, secret) : null,
    },
  });

  try {
    await sendOtpSms(phone.e164, code);
  } catch (error) {
    await prisma.driverAuthChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now },
    });
    if (error instanceof SmsNotConfiguredError) {
      throw new DriverAuthError(503, "not_configured", loginUnavailableMessage("delivery"));
    }
    if (error instanceof SmsDeliveryError) {
      throw new DriverAuthError(502, "auth_failed", GENERIC_AUTH_ERROR);
    }
    throw error;
  }

  return {
    challengeId: challenge.id,
    expiresAt: expiresAt.toISOString(),
    resendAvailableAt: resendAvailableAt.toISOString(),
    developmentCode: isDevOtpEnabled() ? code : undefined,
  };
}

export async function verifyDriverOtp(input: {
  phone: unknown;
  challengeId: unknown;
  code: unknown;
  ip?: string | null;
  userAgent?: string | null;
  now?: Date;
}): Promise<VerifyOtpResult> {
  availabilityOrThrow();
  const secret = secretOrThrow();
  const now = input.now ?? new Date();
  const phone = parseDriverPhone(input.phone);
  const challengeId = typeof input.challengeId === "string" ? input.challengeId.trim() : "";
  const code = typeof input.code === "string" ? input.code.replace(/\D/g, "") : "";

  if (!challengeId || !/^\d{6}$/.test(code)) {
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }

  const prisma = getPrisma();
  const verifyKey = `otp_verify:phone:${hashOpaque(phone.e164, secret)}`;
  const verifyLimit = await consumeRateLimit(verifyKey, otpVerifyPerPhonePerHour(), 60 * 60 * 1000, now);
  if (!verifyLimit.allowed) {
    throw new DriverAuthError(429, "auth_rate_limited", GENERIC_RATE_LIMIT_ERROR);
  }

  const challenge = await prisma.driverAuthChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.phoneE164 !== phone.e164) {
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }
  if (challenge.consumedAt || challenge.expiresAt <= now) {
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }
  if (challenge.attemptCount >= challenge.maxAttempts) {
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }

  const expected = hashOtpCode(code, challenge.salt, secret);
  if (!otpCodesEqual(challenge.codeHash, expected)) {
    await prisma.driverAuthChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }

  const consumed = await prisma.driverAuthChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });
  if (consumed.count !== 1) {
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }

  const existing = await prisma.driver.findUnique({ where: { phoneE164: phone.e164 } });
  if (existing?.deletedAt) {
    throw new DriverAuthError(401, "auth_failed", GENERIC_AUTH_ERROR);
  }

  const driver = existing
    ? await prisma.driver.update({
        where: { id: existing.id },
        data: { lastLoginAt: now },
      })
    : await prisma.driver.create({
        data: {
          phoneE164: phone.e164,
          phoneCountry: phone.country,
          lastLoginAt: now,
          notificationPreference: { create: {} },
        },
      });

  const { token } = await createDriverSession({
    driverId: driver.id,
    ip: input.ip,
    userAgent: input.userAgent,
    now,
  });

  return {
    driver: {
      id: driver.id,
      phoneE164: driver.phoneE164,
      phoneCountry: driver.phoneCountry,
    },
    sessionToken: token,
    isNewAccount: !existing,
  };
}
