import { createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutPayload = {
  mode: "hosted_mock" | "razorpay_checkout";
  provider: "mock" | "razorpay";
  orderId: string;
  amountPaise: number;
  currency: "INR";
  keyId?: string;
};

export type CreateOrderInput = {
  amountPaise: number;
  currency: "INR";
  receipt: string;
  notes: Record<string, string>;
};

export type VerifiedPaymentEvent = {
  providerEventId: string;
  type: "payment.captured" | "payment.failed" | "refund.processed" | "ignored";
  providerOrderId: string;
  providerPaymentId?: string;
  providerRefundId?: string;
  amountPaise?: number;
};

export type PaymentAdapter = {
  name: "mock" | "razorpay";
  createOrder(input: CreateOrderInput): Promise<{ providerOrderId: string; checkout: CheckoutPayload }>;
  verifyWebhook(rawBody: string, headers: Headers): VerifiedPaymentEvent | null;
  createRefund(input: {
    providerPaymentId: string;
    amountPaise: number;
    notes: string;
  }): Promise<{ providerRefundId: string; status: "processing" | "processed" }>;
};

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signaturesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
