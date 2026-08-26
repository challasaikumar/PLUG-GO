import type { StaffActor, StaffRole } from "@/lib/auth/staff";
import { requireStaffRole, StaffAuthError } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { jsonError } from "@/lib/api/http";
import { OpsError } from "./roles";
import { featureEnabledSync } from "@/lib/release/flags";

export function guardOps(allowed: readonly StaffRole[]):
  | { ok: true; actor: StaffActor }
  | { ok: false; response: ReturnType<typeof jsonError> } {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      response: jsonError(503, "not_configured", "DATABASE_URL is not set. Operations portals cannot run."),
    };
  }
  if (!featureEnabledSync("opsPortal")) {
    return {
      ok: false,
      response: jsonError(503, "not_configured", "FLAG_OPS_PORTAL is not enabled."),
    };
  }
  try {
    return { ok: true, actor: requireStaffRole(allowed) };
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return { ok: false, response: jsonError(error.status, error.code as never, error.message) };
    }
    throw error;
  }
}

export function asOpsFailure(error: unknown) {
  if (error instanceof OpsError) {
    return jsonError(error.status, error.code as never, error.message);
  }
  if (error instanceof StaffAuthError) {
    return jsonError(error.status, error.code as never, error.message);
  }
  throw error;
}
