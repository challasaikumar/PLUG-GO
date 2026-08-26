/**
 * Deployment health. Responses never include secrets, connection strings, or credentials.
 */

import { isDatabaseConfigured, getPrisma } from "@/lib/db/prisma";
import { paymentConfigured, paymentAdapterStatus } from "@/lib/payments/config";
import { smsDeliveryConfigured } from "@/lib/auth/config";
import { getPngEnv } from "./env";
import { collectStartupIssues } from "./startup";
import { featureEnabledSync } from "./flags";

export type CheckState = "ok" | "degraded" | "error" | "not_configured";

export type HealthCheck = {
  name: string;
  state: CheckState;
  detail: string;
};

export type HealthReport = {
  ok: boolean;
  ready: boolean;
  service: "plug-and-go-web";
  env: string;
  time: string;
  checks: HealthCheck[];
};

async function checkDatabase(): Promise<HealthCheck> {
  if (!isDatabaseConfigured()) {
    return { name: "database", state: "not_configured", detail: "DATABASE_URL is not set." };
  }
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return { name: "database", state: "ok", detail: "Query succeeded." };
  } catch {
    return { name: "database", state: "error", detail: "Database query failed." };
  }
}

async function checkCsms(): Promise<HealthCheck> {
  const base = process.env.CSMS_CONTROL_URL?.trim();
  if (!base) {
    return { name: "csms", state: "not_configured", detail: "CSMS_CONTROL_URL is not set." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`${base.replace(/\/+$/, "")}/health`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return { name: "csms", state: "error", detail: `CSMS health returned HTTP ${response.status}.` };
    }
    return { name: "csms", state: "ok", detail: "CSMS /health responded." };
  } catch {
    return { name: "csms", state: "error", detail: "CSMS health probe failed or timed out." };
  } finally {
    clearTimeout(timer);
  }
}

function checkPayments(): HealthCheck {
  const status = paymentAdapterStatus();
  if (!status.ok) {
    return {
      name: "payments",
      state: featureEnabledSync("paymentCheckout") ? "error" : "not_configured",
      detail: status.reason === "mock_blocked_in_production" ? "Mock payments are blocked." : "Gateway is not configured.",
    };
  }
  return {
    name: "payments",
    state: paymentConfigured() ? "ok" : "not_configured",
    detail: `Adapter ${status.provider} is configured. Checkout still requires FLAG_PAYMENT_CHECKOUT.`,
  };
}

function checkSms(): HealthCheck {
  if (!smsDeliveryConfigured()) {
    return {
      name: "sms",
      state: featureEnabledSync("driverOtpLogin") ? "error" : "not_configured",
      detail: "SMS OTP provider is not configured.",
    };
  }
  return { name: "sms", state: "ok", detail: "SMS provider configuration is present." };
}

function checkQueueCache(): HealthCheck {
  return {
    name: "queue_cache",
    state: "not_configured",
    detail: "No separate queue or cache service is deployed. PostgreSQL is the current persistence layer.",
  };
}

export async function liveHealth(): Promise<{ ok: true; service: string; env: string; time: string }> {
  return {
    ok: true,
    service: "plug-and-go-web",
    env: getPngEnv(),
    time: new Date().toISOString(),
  };
}

export async function readyHealth(): Promise<HealthReport> {
  const [database, csms] = await Promise.all([checkDatabase(), checkCsms()]);
  const checks: HealthCheck[] = [database, csms, checkPayments(), checkSms(), checkQueueCache()];
  const startup = collectStartupIssues();
  if (startup.issues.length > 0) {
    checks.push({
      name: "startup_validation",
      state: startup.ok ? "degraded" : "error",
      detail: startup.issues.map((issue) => issue.code).join(", "),
    });
  }
  const blocking = checks.filter((check) => check.state === "error");
  const pngEnv = getPngEnv();
  const dbRequired = pngEnv === "production" || pngEnv === "staging" || pngEnv === "pilot";
  const dbBlocking = dbRequired && database.state !== "ok";
  return {
    ok: blocking.length === 0 && !dbBlocking,
    ready: blocking.length === 0 && !dbBlocking,
    service: "plug-and-go-web",
    env: pngEnv,
    time: new Date().toISOString(),
    checks,
  };
}

export function publicStatusView(report: HealthReport): {
  ok: boolean;
  env: string;
  time: string;
  components: Array<{ name: string; state: CheckState }>;
} {
  return {
    ok: report.ready,
    env: report.env,
    time: report.time,
    components: report.checks.map((check) => ({ name: check.name, state: check.state })),
  };
}
