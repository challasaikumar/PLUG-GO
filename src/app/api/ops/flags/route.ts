import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { guardOps } from "@/lib/ops/guard";
import { FlagOverrideError, resolveAllFlags, setStaffFlagOverride } from "@/lib/release/overrides";
import { FLAG_ENV_NAMES, isEnvOnlyFlag } from "@/lib/release/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = guardOps(ROLE_MATRIX.manageReleaseFlags);
  if (!auth.ok) return auth.response;
  const flags = await resolveAllFlags();
  const response = jsonOk({
    flags: flags.map((row) => ({
      key: row.key,
      envName: row.envName,
      envEnabled: row.envEnabled,
      enabled: row.enabled,
      staffOverride: row.staffOverride,
      dependencyBlock: row.dependencyBlock,
      envOnly: isEnvOnlyFlag(row.key),
    })),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  const auth = guardOps(ROLE_MATRIX.manageReleaseFlags);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value);
  if (!body) return jsonError(400, "validation_error", "The flag request could not be read.");
  try {
    const row = await setStaffFlagOverride({
      actor: auth.actor,
      flagKey: String(body.flagKey ?? ""),
      enabled: body.enabled === true,
      reason: String(body.reason ?? ""),
      requestId: requestIdFrom(request),
    });
    return jsonOk({
      flagKey: row.flagKey,
      enabled: row.enabled,
      envName: FLAG_ENV_NAMES[row.flagKey as keyof typeof FLAG_ENV_NAMES],
    });
  } catch (error) {
    if (error instanceof FlagOverrideError) {
      return jsonError(error.status, error.code, error.message);
    }
    throw error;
  }
}
