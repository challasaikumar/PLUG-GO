import { NextResponse } from "next/server";
import { paymentConfigured, paymentProviderName } from "@/lib/payments/config";
import { processVerifiedPaymentEvent } from "@/lib/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!paymentConfigured()) {
    return NextResponse.json({ ok: false, error: "Payment is not configured." }, { status: 503 });
  }
  const rawBody = await request.text();
  const result = await processVerifiedPaymentEvent({
    provider: paymentProviderName(),
    rawBody,
    headers: request.headers,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, result: result.result });
}
