/**
 * Startup validation. Throws for named production/pilot when required safety is missing.
 * Never logs secret values.
 */

import { getAuthSecret, isDevOtpEnabled, smsDeliveryConfigured } from "@/lib/auth/config";
import { isPaymentMockEnabled, paymentConfigured } from "@/lib/payments/config";
import { envFlagEnabled } from "./flags";
import {
  getPngEnv,
  isLoopbackHost,
  parseDatabaseHost,
  siteUrlIsHttps,
  type PngEnv,
} from "./env";
import { emitReleaseEvent } from "./observe";

export type EnvIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export type StartupValidation = {
  env: PngEnv;
  nodeEnv: string | undefined;
  ok: boolean;
  issues: EnvIssue[];
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
}

export function collectStartupIssues(): StartupValidation {
  const env = getPngEnv();
  const issues: EnvIssue[] = [];
  const nodeEnv = process.env.NODE_ENV;
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const dbHost = databaseUrl ? parseDatabaseHost(databaseUrl) : null;
  const productionHost = process.env.PNG_PRODUCTION_DATABASE_HOST?.trim().toLowerCase() || "";
  const stagingHost = process.env.PNG_STAGING_DATABASE_HOST?.trim().toLowerCase() || "";
  const url = siteUrl();

  if (env === "development" || env === "staging" || nodeEnv !== "production") {
    if (productionHost && dbHost && dbHost === productionHost) {
      issues.push({
        level: "error",
        code: "production_database_in_non_production",
        message:
          "DATABASE_URL host matches PNG_PRODUCTION_DATABASE_HOST. Local, staging, and pilot must not use the production database.",
      });
    }
  }

  if (env === "staging" && stagingHost && dbHost && dbHost !== stagingHost) {
    issues.push({
      level: "error",
      code: "staging_database_mismatch",
      message: "PNG_ENV=staging requires DATABASE_URL to use PNG_STAGING_DATABASE_HOST.",
    });
  }

  if (env === "staging" && productionHost && stagingHost && stagingHost === productionHost) {
    issues.push({
      level: "error",
      code: "staging_shares_production_host",
      message: "Staging and production database hosts must be distinct.",
    });
  }

  if (env === "production") {
    if (!url) {
      issues.push({
        level: "error",
        code: "site_url_missing",
        message: "NEXT_PUBLIC_SITE_URL is required in production. Canonical URLs must not fall back to localhost.",
      });
    } else if (!siteUrlIsHttps(url)) {
      issues.push({
        level: "error",
        code: "site_url_not_https",
        message: "Production NEXT_PUBLIC_SITE_URL must be https.",
      });
    }
    if (!databaseUrl) {
      issues.push({
        level: "error",
        code: "database_missing",
        message: "DATABASE_URL is required in production.",
      });
    } else if (dbHost && isLoopbackHost(dbHost) && process.env.PNG_ALLOW_LOCAL_PRODUCTION !== "true") {
      issues.push({
        level: "error",
        code: "production_on_loopback",
        message: "Production PNG_ENV cannot use a loopback DATABASE_URL.",
      });
    }
    if (!getAuthSecret()) {
      issues.push({
        level: "error",
        code: "auth_secret_missing",
        message: "AUTH_SECRET (min 16 characters) is required in production.",
      });
    }
    if (process.env.AUTH_DEV_OTP?.trim() === "true" || isDevOtpEnabled()) {
      issues.push({
        level: "error",
        code: "dev_otp_in_production",
        message: "AUTH_DEV_OTP must stay unset for PNG_ENV=production. Development OTP is never a production login path.",
      });
    }
    if (isPaymentMockEnabled() || process.env.PAYMENT_DEV_MOCK === "true") {
      issues.push({
        level: "error",
        code: "mock_payment_in_production",
        message: "PAYMENT_DEV_MOCK cannot be used in named production.",
      });
    }
    if (process.env.STAFF_DEV_ROLE?.trim() || process.env.STAFF_DEV_ACTOR_ID?.trim()) {
      issues.push({
        level: "error",
        code: "staff_dev_adapter_in_production",
        message: "STAFF_DEV_ROLE / STAFF_DEV_ACTOR_ID must not be set in named production.",
      });
    }
    if (envFlagEnabled("driverOtpLogin") && !smsDeliveryConfigured()) {
      issues.push({
        level: "error",
        code: "otp_flag_without_sms",
        message: "FLAG_DRIVER_OTP is true but SMS delivery is not configured. Fail closed: do not enable the flag.",
      });
    }
    if (envFlagEnabled("paymentCheckout") && !paymentConfigured()) {
      issues.push({
        level: "error",
        code: "payment_flag_without_gateway",
        message: "FLAG_PAYMENT_CHECKOUT is true but a verified payment gateway is not configured.",
      });
    }
    if (envFlagEnabled("booking") && (!envFlagEnabled("paymentCheckout") || !paymentConfigured())) {
      issues.push({
        level: "error",
        code: "booking_flag_without_payment",
        message: "FLAG_BOOKING requires FLAG_PAYMENT_CHECKOUT and a verified payment gateway.",
      });
    }
    if (envFlagEnabled("productionRemoteCharging")) {
      issues.push({
        level: "warning",
        code: "production_remote_charging_enabled",
        message:
          "FLAG_PRODUCTION_REMOTE_CHARGING is true. Confirm isolated OCPP acceptance, allow-lists, MFA, and audit before any charger-control approval.",
      });
    }
  }

  if (env === "pilot" || env === "staging") {
    if (!url) {
      issues.push({
        level: "warning",
        code: "site_url_missing",
        message: `${env} should set NEXT_PUBLIC_SITE_URL to the environment origin.`,
      });
    }
    if (!databaseUrl) {
      issues.push({
        level: "error",
        code: "database_missing",
        message: `DATABASE_URL is required for ${env}.`,
      });
    }
  }

  if (envFlagEnabled("productionRemoteCharging") && env !== "production") {
    issues.push({
      level: "error",
      code: "production_remote_outside_production",
      message: "FLAG_PRODUCTION_REMOTE_CHARGING is only valid when PNG_ENV=production.",
    });
  }

  const ok = !issues.some((issue) => issue.level === "error");
  return { env, nodeEnv, ok, issues };
}

export function validateReleaseEnv(input?: { throwOnError?: boolean }): StartupValidation {
  const result = collectStartupIssues();
  if (!result.ok) {
    emitReleaseEvent("startup_validation_failed", {
      env: result.env,
      codes: result.issues.map((issue) => issue.code).join(","),
    });
    const fatal = result.issues.filter((issue) => issue.level === "error").map((issue) => issue.message);
    if (input?.throwOnError !== false && (result.env === "production" || result.env === "pilot" || result.env === "staging")) {
      throw new Error(`Plug and Go startup validation failed:\n- ${fatal.join("\n- ")}`);
    }
  }
  return result;
}

export function cookieSecurityIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const env = getPngEnv();
  const url = siteUrl();
  if ((env === "production" || env === "pilot" || env === "staging") && url && !siteUrlIsHttps(url)) {
    issues.push({
      level: "error",
      code: "insecure_site_url",
      message: "Secure cookies and TLS-only assumptions require an https site origin.",
    });
  }
  return issues;
}
