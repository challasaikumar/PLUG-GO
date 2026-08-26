import { NextResponse } from "next/server";
import { BookingError } from "@/lib/booking/service";
import { DriverAuthError } from "@/lib/auth/otp";
import { DriverAuthRequiredError } from "@/lib/auth/driver";
import { StaffAuthError } from "@/lib/auth/staff";
import { OpsError } from "@/lib/ops/roles";
import { OcppError } from "@/lib/ocpp/types";

export type ErrorCode =
  | "validation_error"
  | "not_found"
  | "conflict"
  | "admin_disabled"
  | "staff_unauthenticated"
  | "staff_forbidden"
  | "staff_identity_unconfigured"
  | "staff_mfa_required"
  | "not_configured"
  | "auth_rate_limited"
  | "auth_failed"
  | "unauthenticated"
  | "forbidden"
  | "internal_error";

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

export function staffErrorResponse(error: unknown) {
  if (error instanceof StaffAuthError) {
    return jsonError(error.status, error.code as ErrorCode, error.message);
  }
  throw error;
}

export function opsErrorResponse(error: unknown) {
  if (error instanceof OpsError) {
    return jsonError(error.status, error.code as ErrorCode, error.message);
  }
  if (error instanceof StaffAuthError) {
    return jsonError(error.status, error.code as ErrorCode, error.message);
  }
  throw error;
}

export function driverErrorResponse(error: unknown) {
  if (error instanceof DriverAuthError) {
    return jsonError(error.status, error.code, error.message);
  }
  if (error instanceof DriverAuthRequiredError) {
    return jsonError(error.status, error.code, error.message);
  }
  throw error;
}

export function bookingErrorResponse(error: unknown) {
  if (error instanceof BookingError) {
    return jsonError(error.status, error.code, error.message);
  }
  return driverErrorResponse(error);
}

export function ocppErrorResponse(error: unknown) {
  if (error instanceof OcppError) {
    return jsonError(error.status, error.code as ErrorCode, error.message);
  }
  return driverErrorResponse(error);
}

export function noStoreJson<T extends object>(body: T, status = 200) {
  const response = NextResponse.json({ ok: true as const, ...body }, { status });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function pagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const requested = Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20;
  const pageSize = Math.min(50, Math.max(1, requested));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
