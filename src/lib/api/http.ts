import { NextResponse } from "next/server";

export type ErrorCode = "validation_error" | "not_found" | "not_configured" | "internal_error";

export function jsonError(
  status: number,
  code: ErrorCode,
  error: string,
  errors?: Record<string, string | undefined>,
) {
  return NextResponse.json(
    { ok: false as const, code, error, errors },
    { status },
  );
}

export function jsonOk<T extends object>(body: T, status = 200) {
  return NextResponse.json({ ok: true as const, ...body }, { status });
}

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}

export function parseJsonBody(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function readJson(request: Request): Promise<
  { ok: true; value: unknown } | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "validation_error", "The request body could not be read."),
    };
  }
}

export function noStoreJson<T extends object>(body: T, status = 200) {
  const response = NextResponse.json({ ok: true as const, ...body }, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
