import { NextResponse } from "next/server";
import {
  isEnquiryConfigured,
  validateEnquiry,
  type EnquiryInput,
} from "@/lib/enquiry";

export const runtime = "nodejs";

function stripHoneypot(value: EnquiryInput) {
  const { website, ...rest } = value;
  void website;
  return rest;
}

async function deliver(payload: EnquiryInput): Promise<{ ok: boolean; detail?: string }> {
  const url = process.env.ENQUIRY_WEBHOOK_URL?.trim();
  if (!url) {
    return { ok: false, detail: "unconfigured" };
  }

  const token = process.env.ENQUIRY_WEBHOOK_TOKEN?.trim();
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
      receivedAt: new Date().toISOString(),
      enquiry: stripHoneypot(payload),
    }),
  });

  if (!response.ok) {
    return { ok: false, detail: `webhook_${response.status}` };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "The form could not be read. Try again." },
      { status: 400 },
    );
  }

  const validated = validateEnquiry(body);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: validated.formError, errors: validated.errors },
      { status: 400 },
    );
  }

  if (!isEnquiryConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Enquiry delivery is not configured. Nothing was sent. Set ENQUIRY_WEBHOOK_URL on the server to enable this form.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await deliver(validated.value);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "The enquiry could not be delivered. Nothing was stored as sent. Try again later or use another published contact method.",
        },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "The enquiry could not be delivered. Nothing was stored as sent.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
