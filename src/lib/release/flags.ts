/**
 * Typed, fail-closed feature flags for Plug and Go.
 *
 * Unset, empty, or any value other than the string "true" means disabled.
 * Dependency gates (payment adapter, OTP delivery, OCPP, staff IdP) still apply.
 * Staff overrides can only turn staff-controllable flags OFF. They cannot turn
 * an env-disabled flag ON, and they cannot enable safety-critical flags.
 */

import { driverLoginAvailable } from "@/lib/auth/config";
import { isAdminEnabled } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { paymentConfigured } from "@/lib/payments/config";

export const FEATURE_FLAG_KEYS = [
  "publicStationFinder",
  "publishedCityRouteContent",
  "driverOtpLogin",
  "pwaInstallPrompt",
  "booking",
  "paymentCheckout",
  "refunds",
  "publicLiveAvailability",
  "pilotRemoteCharging",
  "productionRemoteCharging",
  "opsPortal",
  "hostPortal",
  "fleetPortal",
  "publicStatusPage",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export const FLAG_ENV_NAMES: Record<FeatureFlagKey, string> = {
  publicStationFinder: "FLAG_PUBLIC_FINDER",
  publishedCityRouteContent: "FLAG_PUBLISHED_CONTENT",
  driverOtpLogin: "FLAG_DRIVER_OTP",
  pwaInstallPrompt: "FLAG_PWA_PROMPT",
  booking: "FLAG_BOOKING",
  paymentCheckout: "FLAG_PAYMENT_CHECKOUT",
  refunds: "FLAG_REFUNDS",
  publicLiveAvailability: "FLAG_PUBLIC_LIVE_AVAILABILITY",
  pilotRemoteCharging: "FLAG_PILOT_REMOTE_CHARGING",
  productionRemoteCharging: "FLAG_PRODUCTION_REMOTE_CHARGING",
  opsPortal: "FLAG_OPS_PORTAL",
  hostPortal: "FLAG_HOST_PORTAL",
  fleetPortal: "FLAG_FLEET_PORTAL",
  publicStatusPage: "FLAG_PUBLIC_STATUS_PAGE",
};

/** Staff may disable these when the matching env flag is already true. Cannot enable env-off flags. */
export const STAFF_CONTROLLABLE_FLAGS: readonly FeatureFlagKey[] = [
  "publicStationFinder",
  "publishedCityRouteContent",
  "pwaInstallPrompt",
  "publicLiveAvailability",
  "opsPortal",
  "hostPortal",
  "fleetPortal",
  "publicStatusPage",
];

/** Env-only. Database overrides are rejected. Defaults remain disabled. */
export const ENV_ONLY_FLAGS: readonly FeatureFlagKey[] = [
  "driverOtpLogin",
  "booking",
  "paymentCheckout",
  "refunds",
  "pilotRemoteCharging",
  "productionRemoteCharging",
];

export const PUBLIC_SNAPSHOT_FLAGS = [
  "publicStationFinder",
  "publishedCityRouteContent",
  "driverOtpLogin",
  "pwaInstallPrompt",
  "booking",
  "paymentCheckout",
  "publicLiveAvailability",
  "publicStatusPage",
] as const;

export type PublicSnapshotFlag = (typeof PUBLIC_SNAPSHOT_FLAGS)[number];

export type DependencyBlock =
  | "env"
  | "staff_override"
  | "payment_gateway"
  | "booking_requires_payment"
  | "otp_delivery"
  | "ocpp"
  | "ocpp_live_updates"
  | "ocpp_remote_commands"
  | "production_control_approval"
  | "staff_admin"
  | "database"
  | null;

export type FlagResolution = {
  key: FeatureFlagKey;
  envName: string;
  envEnabled: boolean;
  staffOverride: boolean | null;
  dependencyBlock: DependencyBlock;
  enabled: boolean;
};

export function explicitTrue(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

export function envFlagEnabled(key: FeatureFlagKey): boolean {
  return explicitTrue(FLAG_ENV_NAMES[key]);
}

export function isStaffControllable(key: FeatureFlagKey): boolean {
  return (STAFF_CONTROLLABLE_FLAGS as readonly string[]).includes(key);
}

export function isEnvOnlyFlag(key: FeatureFlagKey): boolean {
  return (ENV_ONLY_FLAGS as readonly string[]).includes(key);
}

export function isFeatureFlagKey(value: string): value is FeatureFlagKey {
  return (FEATURE_FLAG_KEYS as readonly string[]).includes(value);
}

function ocppRemoteOn(): boolean {
  return explicitTrue("OCPP_ENABLED") && explicitTrue("OCPP_REMOTE_COMMANDS_ENABLED");
}

function productionControlOn(): boolean {
  return explicitTrue("OCPP_PRODUCTION_CONTROL_APPROVED") && explicitTrue("OCPP_HARDWARE_INVENTORY_COMPLETE");
}

function dependencyBlock(key: FeatureFlagKey): DependencyBlock {
  switch (key) {
    case "paymentCheckout":
      return paymentConfigured() ? null : "payment_gateway";
    case "booking":
      if (!envFlagEnabled("paymentCheckout") || !paymentConfigured()) return "booking_requires_payment";
      return null;
    case "refunds":
      return paymentConfigured() ? null : "payment_gateway";
    case "driverOtpLogin":
      return driverLoginAvailable().ok ? null : "otp_delivery";
    case "publicLiveAvailability":
      if (!explicitTrue("OCPP_ENABLED")) return "ocpp";
      if (!explicitTrue("OCPP_PUBLIC_LIVE_UPDATES")) return "ocpp_live_updates";
      return null;
    case "pilotRemoteCharging":
      return ocppRemoteOn() ? null : "ocpp_remote_commands";
    case "productionRemoteCharging":
      if (!ocppRemoteOn()) return "ocpp_remote_commands";
      if (!productionControlOn()) return "production_control_approval";
      return null;
    case "opsPortal":
    case "hostPortal":
    case "fleetPortal":
      if (!isDatabaseConfigured()) return "database";
      return isAdminEnabled() ? null : "staff_admin";
    default:
      return null;
  }
}

/**
 * Env + dependency gates only. Staff kill-switches are applied in `resolveFlag`.
 * Safety-critical flags stay disabled unless both the flag and the verified config exist.
 */
export function featureEnabledSync(key: FeatureFlagKey): boolean {
  if (!envFlagEnabled(key)) return false;
  return dependencyBlock(key) === null;
}

export function resolveFlagSync(key: FeatureFlagKey, staffOverride: boolean | null = null): FlagResolution {
  const envEnabled = envFlagEnabled(key);
  let enabled = envEnabled;
  let block: DependencyBlock = envEnabled ? null : "env";
  if (enabled && staffOverride === false) {
    enabled = false;
    block = "staff_override";
  }
  if (enabled) {
    const dep = dependencyBlock(key);
    if (dep) {
      enabled = false;
      block = dep;
    }
  }
  return {
    key,
    envName: FLAG_ENV_NAMES[key],
    envEnabled,
    staffOverride,
    dependencyBlock: block,
    enabled,
  };
}

export function publicFlagSnapshot(
  resolutions: FlagResolution[],
): Record<PublicSnapshotFlag, boolean> {
  const map = Object.fromEntries(resolutions.map((row) => [row.key, row.enabled]));
  return {
    publicStationFinder: Boolean(map.publicStationFinder),
    publishedCityRouteContent: Boolean(map.publishedCityRouteContent),
    driverOtpLogin: Boolean(map.driverOtpLogin),
    pwaInstallPrompt: Boolean(map.pwaInstallPrompt),
    booking: Boolean(map.booking),
    paymentCheckout: Boolean(map.paymentCheckout),
    publicLiveAvailability: Boolean(map.publicLiveAvailability),
    publicStatusPage: Boolean(map.publicStatusPage),
  };
}
