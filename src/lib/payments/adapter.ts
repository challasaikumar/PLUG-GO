import { paymentAdapterStatus } from "./config";
import { createMockAdapter } from "./mock";
import { createRazorpayAdapter } from "./razorpay";
import type { PaymentAdapter } from "./types";

export function getPaymentAdapter(): PaymentAdapter {
  const status = paymentAdapterStatus();
  if (!status.ok) {
    throw new Error("Payment adapter is not configured.");
  }
  if (status.provider === "mock") return createMockAdapter();
  return createRazorpayAdapter();
}

export { paymentConfigured, paymentAdapterStatus, isPaymentMockEnabled } from "./config";
