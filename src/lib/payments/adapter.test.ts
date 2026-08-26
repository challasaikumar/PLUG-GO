import { describe, expect, it } from "vitest";
import { createMockAdapter, signMockWebhook } from "./mock";
import { paymentAdapterStatus } from "./config";
import { hmacSha256Hex } from "./types";

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

describe("payment adapters", () => {
  it("never enables the mock adapter in production", () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      PAYMENT_DEV_MOCK: process.env.PAYMENT_DEV_MOCK,
      PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    };
    setEnv("NODE_ENV", "production");
    setEnv("PAYMENT_DEV_MOCK", "true");
    setEnv("PAYMENT_PROVIDER", "mock");
    expect(paymentAdapterStatus()).toEqual({ ok: false, reason: "mock_blocked_in_production" });
    setEnv("NODE_ENV", previous.NODE_ENV);
    setEnv("PAYMENT_DEV_MOCK", previous.PAYMENT_DEV_MOCK);
    setEnv("PAYMENT_PROVIDER", previous.PAYMENT_PROVIDER);
  });

  it("rejects unsigned or tampered mock webhooks", () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "phase8-unit-secret";
    const adapter = createMockAdapter();
    const body = JSON.stringify({
      eventId: "evt_1",
      type: "payment.captured",
      orderId: "mock_order_1",
      amountPaise: 11800,
    });
    expect(adapter.verifyWebhook(body, new Headers())).toBeNull();
    expect(
      adapter.verifyWebhook(body, new Headers({ "x-png-mock-signature": hmacSha256Hex("wrong", body) })),
    ).toBeNull();
    const verified = adapter.verifyWebhook(
      body,
      new Headers({ "x-png-mock-signature": signMockWebhook(body) }),
    );
    expect(verified?.type).toBe("payment.captured");
    expect(verified?.providerOrderId).toBe("mock_order_1");
  });
});
