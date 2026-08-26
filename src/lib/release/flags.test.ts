import { afterEach, describe, expect, it } from "vitest";
import { FEATURE_FLAG_KEYS, envFlagEnabled, featureEnabledSync, resolveFlagSync } from "./flags";
import { alertsMissingOwners, ALERT_CATALOGUE } from "./alerts";
import { sanitizeObservePayload } from "./observe";
import { collectStartupIssues } from "./startup";
import { allSecurityHeaders } from "./headers";
import { scanText } from "./secret-scan";
import { isSitemapEligiblePath } from "@/lib/seo/sitemap-entries";

const original = { ...process.env };

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) Reflect.deleteProperty(process.env, key);
  }
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
});

describe("feature flags fail closed", () => {
  it("treats unset, empty, and non-true values as disabled for every flag", () => {
    for (const key of FEATURE_FLAG_KEYS) {
      setEnv(`FLAG_${key}`, undefined);
    }
    setEnv("FLAG_PUBLIC_FINDER", undefined);
    setEnv("FLAG_PUBLISHED_CONTENT", "");
    setEnv("FLAG_DRIVER_OTP", "yes");
    setEnv("FLAG_BOOKING", "1");
    setEnv("FLAG_PAYMENT_CHECKOUT", "TRUE");
    setEnv("FLAG_REFUNDS", "false");
    setEnv("FLAG_PILOT_REMOTE_CHARGING", "true ");
    setEnv("FLAG_PRODUCTION_REMOTE_CHARGING", "true");
    setEnv("OCPP_REMOTE_COMMANDS_ENABLED", undefined);
    setEnv("OCPP_PRODUCTION_CONTROL_APPROVED", undefined);
    setEnv("OCPP_HARDWARE_INVENTORY_COMPLETE", undefined);
    setEnv("PAYMENT_DEV_MOCK", "false");
    setEnv("PAYMENT_PROVIDER", "none");
    setEnv("PAYMENT_RAZORPAY_KEY_ID", undefined);
    setEnv("PAYMENT_RAZORPAY_KEY_SECRET", undefined);
    setEnv("PAYMENT_RAZORPAY_WEBHOOK_SECRET", undefined);

    expect(envFlagEnabled("publicStationFinder")).toBe(false);
    expect(envFlagEnabled("publishedCityRouteContent")).toBe(false);
    expect(envFlagEnabled("driverOtpLogin")).toBe(false);
    expect(envFlagEnabled("booking")).toBe(false);
    expect(featureEnabledSync("paymentCheckout")).toBe(false);
    expect(featureEnabledSync("refunds")).toBe(false);
    expect(featureEnabledSync("pilotRemoteCharging")).toBe(false);
    expect(featureEnabledSync("productionRemoteCharging")).toBe(false);
    expect(featureEnabledSync("opsPortal")).toBe(false);
    expect(featureEnabledSync("publicStatusPage")).toBe(false);
  });

  it("does not enable payment checkout without a verified gateway", () => {
    setEnv("FLAG_PAYMENT_CHECKOUT", "true");
    setEnv("PAYMENT_DEV_MOCK", "false");
    setEnv("PAYMENT_PROVIDER", "none");
    setEnv("NODE_ENV", "test");
    expect(featureEnabledSync("paymentCheckout")).toBe(false);
    expect(resolveFlagSync("paymentCheckout").dependencyBlock).toBe("payment_gateway");
  });

  it("does not enable booking unless the booking flag and payment checkout are both on", () => {
    setEnv("FLAG_BOOKING", "true");
    setEnv("FLAG_PAYMENT_CHECKOUT", undefined);
    setEnv("PAYMENT_DEV_MOCK", "true");
    setEnv("NODE_ENV", "test");
    expect(featureEnabledSync("booking")).toBe(false);
    expect(resolveFlagSync("booking").dependencyBlock).toBe("booking_requires_payment");
  });

  it("keeps production remote charging off without control approval", () => {
    setEnv("FLAG_PRODUCTION_REMOTE_CHARGING", "true");
    setEnv("OCPP_ENABLED", "true");
    setEnv("OCPP_REMOTE_COMMANDS_ENABLED", "true");
    setEnv("OCPP_PRODUCTION_CONTROL_APPROVED", undefined);
    setEnv("OCPP_HARDWARE_INVENTORY_COMPLETE", undefined);
    expect(featureEnabledSync("productionRemoteCharging")).toBe(false);
  });

  it("staff override can only disable an env-enabled discovery flag", () => {
    setEnv("FLAG_PUBLIC_FINDER", "true");
    expect(resolveFlagSync("publicStationFinder", null).enabled).toBe(true);
    expect(resolveFlagSync("publicStationFinder", false).enabled).toBe(false);
    setEnv("FLAG_PUBLIC_FINDER", undefined);
    expect(resolveFlagSync("publicStationFinder", true).enabled).toBe(false);
  });
});

describe("startup validation", () => {
  it("rejects a production database host used from development", () => {
    setEnv("PNG_ENV", "development");
    setEnv("PNG_PRODUCTION_DATABASE_HOST", "prod.db.example");
    setEnv("DATABASE_URL", "postgresql://u:p@prod.db.example:5432/plugandgo");
    const result = collectStartupIssues();
    expect(result.issues.some((issue) => issue.code === "production_database_in_non_production")).toBe(true);
    expect(result.ok).toBe(false);
  });

  it("requires https site URL in named production", () => {
    setEnv("PNG_ENV", "production");
    setEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    setEnv("DATABASE_URL", "postgresql://u:p@db.example:5432/plugandgo");
    setEnv("AUTH_SECRET", "production-secret-value");
    setEnv("AUTH_DEV_OTP", undefined);
    setEnv("PAYMENT_DEV_MOCK", undefined);
    const result = collectStartupIssues();
    expect(result.issues.some((issue) => issue.code === "site_url_not_https")).toBe(true);
  });
});

describe("alerts, observe, headers, secrets, sitemap", () => {
  it("has an owner and response for every alert", () => {
    expect(ALERT_CATALOGUE.length).toBeGreaterThan(8);
    expect(alertsMissingOwners()).toEqual([]);
  });

  it("strips OTP and payment fields from observe payloads", () => {
    expect(sanitizeObservePayload({ otp: "123456", phone: "+91", flag: "booking" })).toEqual({ flag: "booking" });
  });

  it("sends security headers without wildcard CORS", () => {
    const headers = allSecurityHeaders(true);
    expect(headers.some((row) => row.key === "X-Frame-Options" && row.value === "DENY")).toBe(true);
    expect(headers.some((row) => row.key === "Strict-Transport-Security")).toBe(true);
    expect(headers.some((row) => row.value.includes("*")) && headers.some((row) => row.key === "Access-Control-Allow-Origin")).toBe(
      false,
    );
  });

  it("detects committed private keys and ignores placeholders", () => {
    expect(scanText("oops.pem", ["-----BEGIN", "PRIVATE KEY-----"].join(" ")).length).toBe(1);
    expect(scanText(".env.example", "# PAYMENT_RAZORPAY_KEY_SECRET=").length).toBe(0);
  });

  it("keeps private and status routes out of the sitemap", () => {
    expect(isSitemapEligiblePath("/ops/flags")).toBe(false);
    expect(isSitemapEligiblePath("/status")).toBe(false);
    expect(isSitemapEligiblePath("/login")).toBe(false);
    expect(isSitemapEligiblePath("/api/health")).toBe(false);
  });
});
