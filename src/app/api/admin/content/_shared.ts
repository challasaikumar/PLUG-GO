import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import type { StaffRole } from "@/lib/auth/staff";

export const contentRuntime = {
  runtime: "nodejs" as const,
  dynamic: "force-dynamic" as const,
};

export function readStaff(roles: readonly StaffRole[]) {
  return guardStaff(roles);
}

export { ROLE_MATRIX, jsonError, jsonOk, readJson, requestIdFrom };

export function writeAuth() {
  return guardStaff(ROLE_MATRIX.writeEditorial);
}

export function publishAuth() {
  return guardStaff(ROLE_MATRIX.publishEditorial);
}

export function readAuth() {
  return guardStaff(ROLE_MATRIX.readCatalogue);
}

export async function parseBody(request: Request) {
  return readJson(request);
}

export function notFound(entity: string) {
  return jsonError(404, "not_found", `${entity} not found.`);
}

export function validation(
  errors: Record<string, string | undefined> | undefined,
  message = "Please correct the highlighted fields.",
) {
  return jsonError(400, "validation_error", message, errors);
}
