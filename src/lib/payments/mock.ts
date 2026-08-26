import { hmacSha256Hex, signaturesEqual, type PaymentAdapter } from "./types";

function mockSecret(): string {
  return (
    process.env.PAYMENT_WEBHOOK_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    ""
  );
}

export function createMockAdapter(): PaymentAdapter {
  return {
    name: "mock",
    async createOrder(input) {
      const providerOrderId = `mock_order_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
      return {
        providerOrderId,
        checkout: {
          mode: "hosted_mock",
          provider: "mock",
          orderId: providerOrderId,
          amountPaise: input.amountPaise,
          currency: "INR",
        },
      };
    },
    verifyWebhook(rawBody, headers) {
      const secret = mockSecret();
      if (!secret) return null;
      const signature = headers.get("x-png-mock-signature")?.trim() || "";
      const expected = hmacSha256Hex(secret, rawBody);
      if (!signaturesEqual(expected, signature)) return null;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return null;
      }
      const typeRaw = typeof parsed.type === "string" ? parsed.type : "";
      const type =
        typeRaw === "payment.captured" || typeRaw === "payment.failed" || typeRaw === "refund.processed"
          ? typeRaw
          : "ignored";
      const providerEventId = typeof parsed.eventId === "string" ? parsed.eventId : "";
      const providerOrderId = typeof parsed.orderId === "string" ? parsed.orderId : "";
      if (!providerEventId || !providerOrderId) return null;
      return {
        providerEventId,
        type,
        providerOrderId,
        providerPaymentId: typeof parsed.paymentId === "string" ? parsed.paymentId : undefined,
        providerRefundId: typeof parsed.refundId === "string" ? parsed.refundId : undefined,
        amountPaise: typeof parsed.amountPaise === "number" ? parsed.amountPaise : undefined,
      };
    },
    async createRefund() {
      return {
        providerRefundId: `mock_rfnd_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        status: "processing",
      };
    },
  };
}

export function signMockWebhook(rawBody: string): string {
  const secret = mockSecret();
  if (!secret) throw new Error("Mock webhook secret is not configured.");
  return hmacSha256Hex(secret, rawBody);
}
