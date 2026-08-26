import { afterEach, describe, expect, it } from "vitest";
import { parseMobileNumber, maskE164 } from "./phone";
import { isSameOriginMutation } from "./csrf";
import { safeReturnPath, loginHref } from "./return-path";
import { hashOtpCode, otpCodesEqual, generateOtpCode } from "./crypto";
import { driverLoginAvailable, isDevOtpEnabled } from "./config";

const original = {
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_DEV_OTP: process.env.AUTH_DEV_OTP,
  SMS_OTP_PROVIDER: process.env.SMS_OTP_PROVIDER,
  SMS_OTP_WEBHOOK_URL: process.env.SMS_OTP_WEBHOOK_URL,
  SMS_OTP_PROVIDER_KEY: process.env.SMS_OTP_PROVIDER_KEY,
};

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

afterEach(() => {
  setEnv("NODE_ENV", original.NODE_ENV);
  setEnv("AUTH_SECRET", original.AUTH_SECRET);
  setEnv("AUTH_DEV_OTP", original.AUTH_DEV_OTP);
  setEnv("SMS_OTP_PROVIDER", original.SMS_OTP_PROVIDER);
  setEnv("SMS_OTP_WEBHOOK_URL", original.SMS_OTP_WEBHOOK_URL);
  setEnv("SMS_OTP_PROVIDER_KEY", original.SMS_OTP_PROVIDER_KEY);
});

describe("phone normalisation", () => {
  it("normalises Indian mobiles to E.164", () => {
    expect(parseMobileNumber("9876543210")).toEqual({
      ok: true,
      value: { e164: "+919876543210", country: "IN", nationalNumber: "9876543210" },
    });
    expect(parseMobileNumber("09876543210").ok).toBe(true);
    expect(parseMobileNumber("+91 98765 43210").ok).toBe(true);
    expect(parseMobileNumber("12345").ok).toBe(false);
    expect(parseMobileNumber("5876543210").ok).toBe(false);
  });

  it("masks E.164 without exposing the full number", () => {
    expect(maskE164("+919876543210")).toBe("+91 ••••••3210");
  });
});

describe("OTP crypto", () => {
  it("hashes and compares codes in constant time", () => {
    const secret = "unit-test-secret-value";
    const salt = "abc";
    const hash = hashOtpCode("123456", salt, secret);
    expect(otpCodesEqual(hash, hashOtpCode("123456", salt, secret))).toBe(true);
    expect(otpCodesEqual(hash, hashOtpCode("000000", salt, secret))).toBe(false);
    expect(generateOtpCode(6)).toMatch(/^\d{6}$/);
  });
});

describe("return path", () => {
  it("rejects open redirects and admin/api paths", () => {
    expect(safeReturnPath("/vehicles")).toBe("/vehicles");
    expect(safeReturnPath("/scan/st_a/cn_b")).toBe("/scan/st_a/cn_b");
    expect(safeReturnPath("https://evil.example")).toBe("/account");
    expect(safeReturnPath("//evil.example")).toBe("/account");
    expect(safeReturnPath("/admin/stations")).toBe("/account");
    expect(safeReturnPath("/api/account/vehicles")).toBe("/account");
    expect(loginHref("/saved-stations")).toBe("/login?next=%2Fsaved-stations");
  });
});

describe("CSRF origin check", () => {
  it("accepts same-origin POSTs and rejects cross-site", () => {
    const same = new Request("http://localhost:3000/api/auth/otp/request", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(isSameOriginMutation(same)).toBe(true);
    const cross = new Request("http://localhost:3000/api/auth/otp/request", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        host: "localhost:3000",
        "sec-fetch-site": "cross-site",
      },
    });
    expect(isSameOriginMutation(cross)).toBe(false);
  });
});

describe("driver login availability", () => {
  it("fails closed without a secret or SMS, and never enables dev OTP in production", () => {
    setEnv("AUTH_SECRET", undefined);
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("SMS_OTP_PROVIDER", undefined);
    setEnv("NODE_ENV", "test");
    expect(driverLoginAvailable().ok).toBe(false);

    setEnv("AUTH_SECRET", "unit-test-secret-value");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("NODE_ENV", "test");
    expect(isDevOtpEnabled()).toBe(true);
    expect(driverLoginAvailable()).toEqual({ ok: true });

    setEnv("NODE_ENV", "production");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("SMS_OTP_PROVIDER", undefined);
    expect(isDevOtpEnabled()).toBe(false);
    expect(driverLoginAvailable()).toEqual({ ok: false, reason: "delivery" });
  });
});
