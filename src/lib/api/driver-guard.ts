import { jsonError } from "@/lib/api/http";
import { requireDriverFromRequest, DriverAuthRequiredError } from "@/lib/auth/driver";
import { isSameOriginMutation } from "@/lib/auth/csrf";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import type { DriverSessionRecord } from "@/lib/auth/session";

export async function guardDriverMutation(request: Request): Promise<
  | { ok: true; driver: DriverSessionRecord }
  | { ok: false; response: ReturnType<typeof jsonError> }
> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      response: jsonError(503, "not_configured", "The account service is not configured on this server."),
    };
  }
  if (!isSameOriginMutation(request)) {
    return {
      ok: false,
      response: jsonError(403, "forbidden", "This request could not be verified."),
    };
  }
  try {
    return { ok: true, driver: await requireDriverFromRequest(request) };
  } catch (error) {
    if (error instanceof DriverAuthRequiredError) {
      return { ok: false, response: jsonError(401, "unauthenticated", error.message) };
    }
    throw error;
  }
}

export async function guardDriverRead(request: Request): Promise<
  | { ok: true; driver: DriverSessionRecord }
  | { ok: false; response: ReturnType<typeof jsonError> }
> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      response: jsonError(503, "not_configured", "The account service is not configured on this server."),
    };
  }
  try {
    return { ok: true, driver: await requireDriverFromRequest(request) };
  } catch (error) {
    if (error instanceof DriverAuthRequiredError) {
      return { ok: false, response: jsonError(401, "unauthenticated", error.message) };
    }
    throw error;
  }
}
