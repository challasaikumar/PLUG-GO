import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { DriverAuthError, requestDriverOtp, verifyDriverOtp } from "./otp";
import { resolveDriverSession, revokeSessionByToken } from "./session";

const db = process.env.DATABASE_URL?.trim();
const original = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_DEV_OTP: process.env.AUTH_DEV_OTP,
  AUTH_OTP_SEND_PER_PHONE_HOUR: process.env.AUTH_OTP_SEND_PER_PHONE_HOUR,
  AUTH_OTP_RESEND_SECONDS: process.env.AUTH_OTP_RESEND_SECONDS,
  SMS_OTP_PROVIDER: process.env.SMS_OTP_PROVIDER,
  AUTH_OTP_SEND_PER_IP_HOUR: process.env.AUTH_OTP_SEND_PER_IP_HOUR,
  NODE_ENV: process.env.NODE_ENV,
};

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

function uniquePhone(head: "6" | "7" | "8" | "9"): string {
  const rest = String(100000000 + Math.floor(Math.random() * 899999999)).slice(0, 9);
  return `+91${head}${rest}`;
}

describe.skipIf(!db)("driver OTP", () => {
  const prisma = new PrismaClient();
  const phone1 = uniquePhone("8");
  const phone2 = uniquePhone("7");
  const limitedPhone = uniquePhone("6");
  const ipOffset = 50 + (Date.now() % 40);
  const ip1 = `203.0.113.${ipOffset}`;
  const ip2 = `203.0.113.${ipOffset + 1}`;
  const ip3 = `203.0.113.${ipOffset + 2}`;
  const ip4 = `203.0.113.${ipOffset + 3}`;
  const ip5 = `203.0.113.${ipOffset + 4}`;

  beforeAll(() => {
    setEnv("AUTH_SECRET", "phase7-test-secret-value");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("NODE_ENV", "test");
    setEnv("SMS_OTP_PROVIDER", undefined);
    setEnv("AUTH_OTP_SEND_PER_IP_HOUR", "60");
  });

  afterEach(() => {
    setEnv("AUTH_OTP_SEND_PER_PHONE_HOUR", original.AUTH_OTP_SEND_PER_PHONE_HOUR);
    setEnv("AUTH_OTP_RESEND_SECONDS", original.AUTH_OTP_RESEND_SECONDS);
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("SMS_OTP_PROVIDER", undefined);
  });

  afterAll(async () => {
    setEnv("AUTH_SECRET", original.AUTH_SECRET);
    setEnv("AUTH_DEV_OTP", original.AUTH_DEV_OTP);
    setEnv("NODE_ENV", original.NODE_ENV);
    setEnv("SMS_OTP_PROVIDER", original.SMS_OTP_PROVIDER);
    setEnv("AUTH_OTP_SEND_PER_IP_HOUR", original.AUTH_OTP_SEND_PER_IP_HOUR);
    await prisma.driver.deleteMany({
      where: { phoneE164: { in: [phone1, phone2, limitedPhone] } },
    });
    await prisma.driverAuthChallenge.deleteMany({
      where: { phoneE164: { in: [phone1, phone2, limitedPhone] } },
    });
    await prisma.$disconnect();
  });

  it("verifies a valid OTP, rejects wrong/expired/replayed codes, cooldown, logout, and missing SMS", async () => {
    const requested = await requestDriverOtp({ phone: phone1, ip: ip1 });
    expect(requested.developmentCode).toMatch(/^\d{6}$/);

    await expect(
      verifyDriverOtp({
        phone: phone1,
        challengeId: requested.challengeId,
        code: "000000",
      }),
    ).rejects.toBeInstanceOf(DriverAuthError);

    const expired = await requestDriverOtp({
      phone: phone1,
      ip: ip1,
      now: new Date(Date.now() + 70_000),
    });
    await prisma.driverAuthChallenge.update({
      where: { id: expired.challengeId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(
      verifyDriverOtp({
        phone: phone1,
        challengeId: expired.challengeId,
        code: expired.developmentCode,
      }),
    ).rejects.toMatchObject({ code: "auth_failed" });

    const fresh = await requestDriverOtp({
      phone: phone1,
      ip: ip1,
      now: new Date(Date.now() + 140_000),
    });
    const first = await verifyDriverOtp({
      phone: phone1,
      challengeId: fresh.challengeId,
      code: fresh.developmentCode,
    });
    expect(first.driver.phoneE164).toBe(phone1);
    expect(first.isNewAccount).toBe(true);
    const session = await resolveDriverSession(first.sessionToken);
    expect(session?.id).toBe(first.driver.id);

    await expect(
      verifyDriverOtp({
        phone: phone1,
        challengeId: fresh.challengeId,
        code: fresh.developmentCode,
      }),
    ).rejects.toMatchObject({ code: "auth_failed" });

    await revokeSessionByToken(first.sessionToken);
    expect(await resolveDriverSession(first.sessionToken)).toBeNull();

    await requestDriverOtp({ phone: phone2, ip: ip2 });
    await expect(requestDriverOtp({ phone: phone2, ip: ip2 })).rejects.toMatchObject({
      code: "auth_rate_limited",
    });

    setEnv("AUTH_DEV_OTP", undefined);
    setEnv("SMS_OTP_PROVIDER", undefined);
    const later = new Date(Date.now() + 10 * 60 * 1000);
    await expect(requestDriverOtp({ phone: phone1, ip: ip3, now: later })).rejects.toMatchObject({
      code: "not_configured",
    });

    setEnv("AUTH_DEV_OTP", "true");
    setEnv("AUTH_OTP_SEND_PER_PHONE_HOUR", "1");
    await requestDriverOtp({ phone: limitedPhone, ip: ip4, now: later });
    await expect(
      requestDriverOtp({
        phone: limitedPhone,
        ip: ip5,
        now: new Date(later.getTime() + 120_000),
      }),
    ).rejects.toMatchObject({ code: "auth_rate_limited" });
  });
});
