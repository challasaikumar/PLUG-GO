import { hmacSha256Hex, signaturesEqual, type PaymentAdapter, type VerifiedPaymentEvent } from "./types";

function basicAuth(): string {
  const id = process.env.PAYMENT_RAZORPAY_KEY_ID?.trim() ?? "";
  const secret = process.env.PAYMENT_RAZORPAY_KEY_SECRET?.trim() ?? "";
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

export function createRazorpayAdapter(): PaymentAdapter {
  return {
    name: "razorpay",
    async createOrder(input) {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: input.amountPaise,
          currency: input.currency,
          receipt: input.receipt.slice(0, 40),
          notes: input.notes,
        }),
      });
      if (!response.ok) {
        throw new Error("The payment provider could not create an order.");
      }
      const body = (await response.json()) as { id?: string };
      if (!body.id) throw new Error("The payment provider did not return an order id.");
      return {
        providerOrderId: body.id,
        checkout: {
          mode: "razorpay_checkout",
          provider: "razorpay",
          orderId: body.id,
          amountPaise: input.amountPaise,
          currency: "INR",
          keyId: process.env.PAYMENT_RAZORPAY_KEY_ID?.trim(),
        },
      };
    },
    verifyWebhook(rawBody, headers) {
      const secret = process.env.PAYMENT_RAZORPAY_WEBHOOK_SECRET?.trim();
      if (!secret) return null;
      const signature = headers.get("x-razorpay-signature")?.trim() || "";
      const expected = hmacSha256Hex(secret, rawBody);
      if (!signaturesEqual(expected, signature)) return null;
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return null;
      }
      return mapRazorpayEvent(parsed);
    },
    async createRefund(input) {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${input.providerPaymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: input.amountPaise, notes: { reason: input.notes.slice(0, 200) } }),
      });
      if (!response.ok) {
        throw new Error("The payment provider could not start a refund.");
      }
      const body = (await response.json()) as { id?: string; status?: string };
      if (!body.id) throw new Error("The payment provider did not return a refund id.");
      return {
        providerRefundId: body.id,
        status: body.status === "processed" ? "processed" : "processing",
      };
    },
  };
}

function mapRazorpayEvent(parsed: Record<string, unknown>): VerifiedPaymentEvent | null {
  const eventId = typeof parsed.id === "string" ? parsed.id : "";
  const event = typeof parsed.event === "string" ? parsed.event : "";
  const payload = parsed.payload && typeof parsed.payload === "object" ? (parsed.payload as Record<string, unknown>) : {};
  const paymentEntity = nestedEntity(payload, "payment");
  const refundEntity = nestedEntity(payload, "refund");
  const orderId =
    stringField(paymentEntity, "order_id") ||
    stringField(refundEntity, "order_id") ||
    "";
  if (!eventId || !orderId) return null;

  if (event === "payment.captured") {
    return {
      providerEventId: eventId,
      type: "payment.captured",
      providerOrderId: orderId,
      providerPaymentId: stringField(paymentEntity, "id"),
      amountPaise: numberField(paymentEntity, "amount"),
    };
  }
  if (event === "payment.failed") {
    return {
      providerEventId: eventId,
      type: "payment.failed",
      providerOrderId: orderId,
      providerPaymentId: stringField(paymentEntity, "id"),
      amountPaise: numberField(paymentEntity, "amount"),
    };
  }
  if (event === "refund.processed") {
    return {
      providerEventId: eventId,
      type: "refund.processed",
      providerOrderId: orderId,
      providerPaymentId: stringField(refundEntity, "payment_id"),
      providerRefundId: stringField(refundEntity, "id"),
      amountPaise: numberField(refundEntity, "amount"),
    };
  }
  return {
    providerEventId: eventId,
    type: "ignored",
    providerOrderId: orderId,
  };
}

function nestedEntity(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const node = payload[key];
  if (!node || typeof node !== "object") return {};
  const entity = (node as { entity?: unknown }).entity;
  if (!entity || typeof entity !== "object") return {};
  return entity as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value ? value : undefined;
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}
