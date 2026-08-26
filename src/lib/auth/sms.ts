import { isDevOtpEnabled, isProductionRuntime, smsDeliveryConfigured } from "./config";

export class SmsNotConfiguredError extends Error {
  constructor() {
    super("SMS OTP delivery is not configured.");
    this.name = "SmsNotConfiguredError";
  }
}

export class SmsDeliveryError extends Error {
  constructor() {
    super("The verification code could not be sent.");
    this.name = "SmsDeliveryError";
  }
}

/**
 * Server-side SMS adapter. Never called from the browser.
 * Does not log the OTP or the full destination number.
 */
export async function sendOtpSms(e164: string, code: string): Promise<void> {
  if (isDevOtpEnabled()) {
    return;
  }
  if (isProductionRuntime() && process.env.AUTH_DEV_OTP === "true") {
    throw new SmsNotConfiguredError();
  }
  if (!smsDeliveryConfigured()) {
    throw new SmsNotConfiguredError();
  }

  const provider = process.env.SMS_OTP_PROVIDER?.trim().toLowerCase();
  if (provider === "webhook") {
    await sendViaWebhook(e164, code);
    return;
  }

  throw new SmsNotConfiguredError();
}

async function sendViaWebhook(e164: string, code: string): Promise<void> {
  const url = process.env.SMS_OTP_WEBHOOK_URL?.trim();
  if (!url) throw new SmsNotConfiguredError();

  const token =
    process.env.SMS_OTP_WEBHOOK_TOKEN?.trim() || process.env.SMS_OTP_PROVIDER_KEY?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "plug-and-go-website",
      purpose: "driver_otp",
      to: e164,
      code,
      from: process.env.SMS_OTP_FROM?.trim() || undefined,
    }),
  });

  if (!response.ok) {
    throw new SmsDeliveryError();
  }
}

export function smsAdapterStatus(): "dev_otp" | "configured" | "unconfigured" {
  if (isDevOtpEnabled()) return "dev_otp";
  if (smsDeliveryConfigured()) return "configured";
  return "unconfigured";
}
