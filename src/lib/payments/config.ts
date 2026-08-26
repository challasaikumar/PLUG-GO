/**
 * Payment provider configuration.
 * Secrets stay server-side. Production stays disabled until a real provider is configured.
 */

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function paymentProviderName(): string {
  return process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "none";
}

/** Development-only mock checkout. Never honoured when NODE_ENV is production. */
export function isPaymentMockEnabled(): boolean {
  if (isProductionRuntime()) return false;
  return process.env.PAYMENT_DEV_MOCK === "true";
}

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_RAZORPAY_KEY_ID?.trim() &&
      process.env.PAYMENT_RAZORPAY_KEY_SECRET?.trim() &&
      process.env.PAYMENT_RAZORPAY_WEBHOOK_SECRET?.trim(),
  );
}

export function paymentAdapterStatus():
  | { ok: true; provider: "mock" | "razorpay" }
  | { ok: false; reason: "unconfigured" | "mock_blocked_in_production" } {
  if (isPaymentMockEnabled()) {
    return { ok: true, provider: "mock" };
  }
  if (paymentProviderName() === "razorpay" && razorpayConfigured()) {
    return { ok: true, provider: "razorpay" };
  }
  if (paymentProviderName() === "mock" && isProductionRuntime()) {
    return { ok: false, reason: "mock_blocked_in_production" };
  }
  return { ok: false, reason: "unconfigured" };
}

export function paymentConfigured(): boolean {
  return paymentAdapterStatus().ok;
}

export function bookingHoldSeconds(): number {
  return intFromEnv("BOOKING_HOLD_SECONDS", 900, 60, 3600);
}

export function receiptPrefix(): string {
  return process.env.RECEIPT_NUMBER_PREFIX?.trim() || "PNG-R";
}

export function invoicePrefix(): string {
  return process.env.INVOICE_NUMBER_PREFIX?.trim() || "PNG-INV";
}

export function bookingRefPrefix(): string {
  return process.env.BOOKING_REFERENCE_PREFIX?.trim() || "PNG-B";
}

export function publicCheckoutKey(): string | null {
  const key =
    process.env.NEXT_PUBLIC_PAYMENT_CHECKOUT_KEY?.trim() ||
    process.env.PAYMENT_RAZORPAY_KEY_ID?.trim() ||
    null;
  return key;
}

export function paymentUnavailableMessage(): string {
  return "Booking cannot be accepted because payment is not configured. Plug and Go still needs a regulated payment provider and webhook secret.";
}
