/**
 * Staff / partner / fleet authorization adapter.
 *
 * Driver OTP auth is a separate identity. Never mix cookies or role headers.
 * No identity provider is wired yet. Production always denies until an IdP
 * with MFA is configured and requireStaffRole() is connected to it.
 * Development may use server-only env roles. Never trust client-supplied roles.
 */

export const STAFF_ROLES = [
  "content_manager",
  "station_operator",
  "support",
  "finance",
  "technician",
  "super_admin",
  "host_admin",
  "host_viewer",
  "fleet_admin",
  "fleet_viewer",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const INTERNAL_OPS_ROLES = [
  "station_operator",
  "technician",
  "support",
  "finance",
  "super_admin",
] as const;

export const HOST_PORTAL_ROLES = ["host_admin", "host_viewer", "super_admin"] as const;
export const FLEET_PORTAL_ROLES = ["fleet_admin", "fleet_viewer", "super_admin"] as const;
export const TECHNICIAN_PORTAL_ROLES = ["technician", "super_admin"] as const;

export type StaffActor = {
  id: string;
  role: StaffRole;
  source: "disabled" | "unconfigured" | "dev_env" | "identity_provider";
};

export class StaffAuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "StaffAuthError";
    this.status = status;
    this.code = code;
  }
}

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function isAdminEnabled(): boolean {
  return process.env.ADMIN_ENABLED === "true";
}

export function staffIdentityConfigured(): boolean {
  return Boolean(process.env.STAFF_IDENTITY_PROVIDER?.trim());
}

/** Production portals stay off until MFA is explicitly enforced with an IdP. */
export function staffMfaEnforced(): boolean {
  return process.env.STAFF_MFA_ENFORCED?.trim().toLowerCase() === "true";
}

export function staffProductionPortalsReady(): boolean {
  return staffIdentityConfigured() && staffMfaEnforced();
}

export function resolveStaffActor(): StaffActor | null {
  if (!isAdminEnabled()) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    // Identity provider is not wired. Do not honour STAFF_DEV_* here.
    return null;
  }

  const role = process.env.STAFF_DEV_ROLE?.trim();
  const id = process.env.STAFF_DEV_ACTOR_ID?.trim();
  if (!role || !id || !isStaffRole(role)) {
    return null;
  }

  return { id, role, source: "dev_env" };
}

export function roleAllows(actor: StaffActor, allowed: readonly StaffRole[]): boolean {
  if (actor.role === "super_admin") return true;
  return allowed.includes(actor.role);
}

export function requireStaffRole(allowed: readonly StaffRole[]): StaffActor {
  if (!isAdminEnabled()) {
    throw new StaffAuthError(
      403,
      "admin_disabled",
      "Staff admin is disabled. Set ADMIN_ENABLED=true only in a trusted environment after reviewing docs/phase-4-station-data-and-admin.md and docs/phase-10-operations-portals.md.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    if (!staffIdentityConfigured()) {
      throw new StaffAuthError(
        403,
        "staff_identity_unconfigured",
        "Staff identity is not configured. Operations portals stay denied in production until an identity provider is wired into requireStaffRole().",
      );
    }
    if (!staffMfaEnforced()) {
      throw new StaffAuthError(
        403,
        "staff_mfa_required",
        "Staff MFA is not enforced. Production operations portals stay disabled until STAFF_MFA_ENFORCED=true and the identity provider requires MFA for staff, host, and fleet roles.",
      );
    }
    throw new StaffAuthError(
      403,
      "staff_identity_unconfigured",
      "A staff identity provider name is set, but requireStaffRole() is not wired to that provider yet. Production portals remain disabled.",
    );
  }

  const actor = resolveStaffActor();
  if (!actor) {
    throw new StaffAuthError(
      403,
      "staff_unauthenticated",
      "Development staff adapter is not configured. Set STAFF_DEV_ROLE and STAFF_DEV_ACTOR_ID (server-only, non-production).",
    );
  }

  if (!roleAllows(actor, allowed)) {
    throw new StaffAuthError(
      403,
      "staff_forbidden",
      "This role cannot perform that action.",
    );
  }

  return actor;
}

export const ROLE_MATRIX = {
  readCatalogue: [
    "content_manager",
    "station_operator",
    "support",
    "finance",
    "technician",
  ] as const,
  writeStationFacts: ["content_manager", "station_operator"] as const,
  publishStation: ["station_operator"] as const,
  writeHardware: ["station_operator", "technician"] as const,
  writeMedia: ["content_manager", "station_operator"] as const,
  writeTariffDraft: ["finance", "station_operator"] as const,
  approveTariff: ["finance"] as const,
  statusOverride: ["station_operator", "technician"] as const,
  readAudit: ["station_operator", "support", "finance", "technician"] as const,
  writeEditorial: ["content_manager"] as const,
  publishEditorial: ["content_manager"] as const,
  writeBookingPolicy: ["station_operator", "finance"] as const,
  approveBookingPolicy: ["finance"] as const,
  readFinance: ["finance", "support"] as const,
  initiateRefund: ["finance"] as const,
  commissionChargePoint: ["technician", "station_operator"] as const,
  remoteCommandStaff: ["technician", "station_operator"] as const,
  readCsms: ["technician", "station_operator", "support"] as const,
  readOps: ["station_operator", "technician", "support", "finance"] as const,
  readOpsStations: ["station_operator", "technician", "support", "finance"] as const,
  readOpsRawDevice: ["station_operator", "technician"] as const,
  readOpsSessions: ["station_operator", "support", "finance"] as const,
  readOpsCustomerContext: ["support", "finance"] as const,
  writeIncidents: ["station_operator", "technician", "support"] as const,
  assignTechnician: ["station_operator", "support"] as const,
  verifyIncident: ["station_operator"] as const,
  readCommands: ["station_operator", "technician", "support"] as const,
  requestCommand: ["station_operator", "technician"] as const,
  approveCommand: ["station_operator"] as const,
  breakGlassCommand: ["station_operator", "technician"] as const,
  readSupportQueue: ["support", "station_operator"] as const,
  assignSupport: ["support"] as const,
  readFinanceOps: ["finance"] as const,
  requestExportFinance: ["finance"] as const,
  requestExportOps: ["station_operator", "finance"] as const,
  requestExportHost: ["host_admin", "station_operator", "finance"] as const,
  requestExportFleet: ["fleet_admin", "finance"] as const,
  readHostPortal: ["host_admin", "host_viewer"] as const,
  readFleetPortal: ["fleet_admin", "fleet_viewer"] as const,
  technicianField: ["technician"] as const,
  manageReleaseFlags: ["super_admin"] as const,
} as const;
