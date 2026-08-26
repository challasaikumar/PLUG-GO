/**
 * Staff-controlled flag kill-switches. Fail safer: an override can only disable.
 * Lookups fail open to the env decision if the database is unavailable, and the
 * miss is recorded. Operators who need a guaranteed off-switch should unset the env flag.
 */

import { writeAudit } from "@/lib/catalogue/audit";
import type { StaffActor } from "@/lib/auth/staff";
import { isDatabaseConfigured, getPrisma } from "@/lib/db/prisma";
import {
  FEATURE_FLAG_KEYS,
  FLAG_ENV_NAMES,
  envFlagEnabled,
  isEnvOnlyFlag,
  isFeatureFlagKey,
  isStaffControllable,
  resolveFlagSync,
  type FeatureFlagKey,
  type FlagResolution,
} from "./flags";
import { emitReleaseEvent } from "./observe";

type CacheEntry = { at: number; values: Map<FeatureFlagKey, boolean> };

let cache: CacheEntry | null = null;
const CACHE_MS = 5_000;

function asMap(rows: Array<{ flagKey: string; enabled: boolean }>): Map<FeatureFlagKey, boolean> {
  const map = new Map<FeatureFlagKey, boolean>();
  for (const row of rows) {
    if (isFeatureFlagKey(row.flagKey)) map.set(row.flagKey, row.enabled);
  }
  return map;
}

export async function loadStaffOverrides(force = false): Promise<Map<FeatureFlagKey, boolean>> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.values;
  if (!isDatabaseConfigured()) {
    cache = { at: Date.now(), values: new Map() };
    return cache.values;
  }
  try {
    const prisma = getPrisma();
    const rows = await prisma.featureFlagOverride.findMany({
      select: { flagKey: true, enabled: true },
    });
    cache = { at: Date.now(), values: asMap(rows) };
    return cache.values;
  } catch {
    emitReleaseEvent("feature_flag_override_read_failed", { surface: "overrides" });
    return cache?.values ?? new Map();
  }
}

export function clearFlagOverrideCache() {
  cache = null;
}

export async function resolveFlag(key: FeatureFlagKey): Promise<FlagResolution> {
  const overrides = await loadStaffOverrides();
  const stored = overrides.get(key);
  const staffOverride = stored === false ? false : stored === true ? true : null;
  return resolveFlagSync(key, staffOverride === false ? false : null);
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  return (await resolveFlag(key)).enabled;
}

export async function resolveAllFlags(): Promise<FlagResolution[]> {
  const overrides = await loadStaffOverrides();
  return FEATURE_FLAG_KEYS.map((key) => {
    const stored = overrides.get(key);
    return resolveFlagSync(key, stored === false ? false : null);
  });
}

export class FlagOverrideError extends Error {
  readonly status: number;
  readonly code: "forbidden" | "validation_error";

  constructor(status: number, code: "forbidden" | "validation_error", message: string) {
    super(message);
    this.name = "FlagOverrideError";
    this.status = status;
    this.code = code;
  }
}

export async function setStaffFlagOverride(input: {
  actor: StaffActor;
  flagKey: string;
  enabled: boolean;
  reason: string;
  requestId?: string;
}) {
  if (!isFeatureFlagKey(input.flagKey)) {
    throw new FlagOverrideError(400, "validation_error", "That is not a recognised feature flag.");
  }
  if (isEnvOnlyFlag(input.flagKey)) {
    throw new FlagOverrideError(
      403,
      "forbidden",
      `${FLAG_ENV_NAMES[input.flagKey]} is env-only. Staff cannot enable or disable it from the portal. Change the environment and record the change in the release log.`,
    );
  }
  if (!isStaffControllable(input.flagKey)) {
    throw new FlagOverrideError(403, "forbidden", "This flag is not staff-controllable.");
  }
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new FlagOverrideError(400, "validation_error", "Record a reason of at least eight characters.");
  }
  if (input.enabled && !envFlagEnabled(input.flagKey)) {
    throw new FlagOverrideError(
      403,
      "forbidden",
      `${FLAG_ENV_NAMES[input.flagKey]} is not true. Staff cannot turn an env-disabled flag on.`,
    );
  }

  const prisma = getPrisma();
  const existing = await prisma.featureFlagOverride.findUnique({ where: { flagKey: input.flagKey } });
  const row = await prisma.featureFlagOverride.upsert({
    where: { flagKey: input.flagKey },
    create: {
      flagKey: input.flagKey,
      enabled: input.enabled,
      reason,
      updatedById: input.actor.id,
      updatedByRole: input.actor.role,
    },
    update: {
      enabled: input.enabled,
      reason,
      updatedById: input.actor.id,
      updatedByRole: input.actor.role,
    },
  });
  await writeAudit({
    actor: input.actor,
    action: "feature_flag.override",
    targetType: "feature_flag",
    targetId: input.flagKey,
    before: existing ? { enabled: existing.enabled, reason: existing.reason } : { enabled: null },
    after: { enabled: row.enabled, reason: row.reason, envName: FLAG_ENV_NAMES[input.flagKey] },
    requestId: input.requestId,
  });
  clearFlagOverrideCache();
  emitReleaseEvent("feature_flag_changed", {
    flag: input.flagKey,
    enabled: row.enabled,
    actorRole: input.actor.role,
  });
  return row;
}
