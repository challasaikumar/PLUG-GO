/**
 * Observability abstraction. No-op until OBSERVABILITY_WEBHOOK_URL is configured.
 * Payloads must not include secrets, OTPs, payment instruments, or precise location.
 */

const FORBIDDEN =
  /^(lat|lng|latitude|longitude|phone|mobile|msisdn|payment|card|pan|cvv|otp|code|token|secret|password|authorization|cookie|precise_?location|registration)$/i;

export type ReleaseEventName =
  | "application_error"
  | "dependency_unhealthy"
  | "otp_provider_failure"
  | "payment_webhook_failure"
  | "booking_exception"
  | "refund_exception"
  | "csms_unhealthy"
  | "remote_command_failure"
  | "backup_check_failed"
  | "suspicious_auth"
  | "feature_flag_changed"
  | "feature_flag_override_read_failed"
  | "startup_validation_failed";

export type ObservePayload = Record<string, string | number | boolean | null | undefined>;

export function sanitizeObservePayload(payload?: ObservePayload): ObservePayload {
  if (!payload) return {};
  const clean: ObservePayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN.test(key)) continue;
    if (typeof value === "string" && value.length > 240) {
      clean[key] = `${value.slice(0, 240)}…`;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function observabilityConfigured(): boolean {
  return Boolean(process.env.OBSERVABILITY_WEBHOOK_URL?.trim());
}

export function emitReleaseEvent(event: ReleaseEventName, payload?: ObservePayload): void {
  const safe = sanitizeObservePayload(payload);
  const url = process.env.OBSERVABILITY_WEBHOOK_URL?.trim();
  if (!url) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[observe] ${event}`, safe);
    }
    return;
  }
  const token = process.env.OBSERVABILITY_WEBHOOK_TOKEN?.trim();
  void fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ source: "plug-and-go", event, at: new Date().toISOString(), payload: safe }),
  }).catch(() => {
    console.warn("[observe] webhook delivery failed", event);
  });
}
