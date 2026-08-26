import type { StaffActor, StaffRole } from "@/lib/auth/staff";
import { requireStaffRole, StaffAuthError } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { jsonError, staffErrorResponse } from "@/lib/api/http";

export function guardStaff(allowed: readonly StaffRole[]):
  | { ok: true; actor: StaffActor }
  | { ok: false; response: ReturnType<typeof jsonError> } {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      response: jsonError(
        503,
        "not_configured",
        "DATABASE_URL is not set. Catalogue admin cannot run.",
      ),
    };
  }
  try {
    return { ok: true, actor: requireStaffRole(allowed) };
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return { ok: false, response: staffErrorResponse(error) };
    }
    throw error;
  }
}
