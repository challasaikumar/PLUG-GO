import type { StaffActor, StaffRole } from "@/lib/auth/staff";
import { roleAllows, ROLE_MATRIX } from "@/lib/auth/staff";

export class OpsError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "OpsError";
    this.status = status;
    this.code = code;
  }
}

export function opsLayoutMode(widthPx: number): "phone" | "tablet" | "desktop" {
  if (widthPx < 768) return "phone";
  if (widthPx < 1280) return "tablet";
  return "desktop";
}

export function isInternalOpsRole(role: StaffRole): boolean {
  return (
    role === "station_operator" ||
    role === "technician" ||
    role === "support" ||
    role === "finance" ||
    role === "super_admin"
  );
}

export function isHostPortalRole(role: StaffRole): boolean {
  return role === "host_admin" || role === "host_viewer" || role === "super_admin";
}

export function isFleetPortalRole(role: StaffRole): boolean {
  return role === "fleet_admin" || role === "fleet_viewer" || role === "super_admin";
}

export function canSeeRawDeviceIdentity(actor: StaffActor): boolean {
  return roleAllows(actor, ROLE_MATRIX.readOpsRawDevice);
}

export function canSeeCustomerContext(actor: StaffActor): boolean {
  return roleAllows(actor, ROLE_MATRIX.readOpsCustomerContext);
}

export function canSeeFinance(actor: StaffActor): boolean {
  return roleAllows(actor, ROLE_MATRIX.readFinanceOps);
}

export function canSeeSessions(actor: StaffActor): boolean {
  return roleAllows(actor, ROLE_MATRIX.readOpsSessions);
}

export const INCIDENT_TRANSITIONS: Record<string, readonly string[]> = {
  new: ["acknowledged"],
  acknowledged: ["diagnosing"],
  diagnosing: ["technician_assigned", "waiting_on_vendor"],
  technician_assigned: ["diagnosing", "waiting_on_vendor", "resolved"],
  waiting_on_vendor: ["diagnosing", "resolved"],
  resolved: ["verification_required", "diagnosing"],
  verification_required: ["closed", "diagnosing"],
  closed: [],
};

export const DEFAULT_MAINTENANCE_CHECKLIST = [
  { code: "ppe", label: "PPE on and site safety confirmed", sortOrder: 0 },
  { code: "access", label: "Access, isolation, and arrival notes checked", sortOrder: 1 },
  { code: "visual", label: "Visual inspection of EVSE, cable, and mount", sortOrder: 2 },
  { code: "connector", label: "Connector lock, pins, and shutter", sortOrder: 3 },
  { code: "display", label: "Display / fault code recorded", sortOrder: 4 },
  { code: "restore", label: "Left safe — restored or isolated", sortOrder: 5 },
] as const;

export function commandRiskNote(action: string): string {
  switch (action) {
    case "remote_stop":
      return "Stops an in-progress charge. The charger may already have executed a previous command. Not retried automatically.";
    case "remote_start":
      return "Staff remote start is not a driver session. Operations does not impersonate a driver. Use the driver session flow.";
    case "reset":
      return "Hardware reset is not implemented in this phase. Do not send OCPP Reset from the website.";
    case "change_configuration":
      return "Remote configuration is not implemented in this phase. Do not send ChangeConfiguration from the website.";
    default:
      return "Sensitive charger action. Requires station scope, MFA assertion, reason, and approval or break-glass.";
  }
}

export function opsStaffRemoteCommandsEnabled(): boolean {
  return process.env.OPS_STAFF_REMOTE_COMMANDS_ENABLED?.trim().toLowerCase() === "true";
}

export function exportSyncRowLimit(): number {
  return 500;
}

export function evidenceStoragePrefix(): string | null {
  return process.env.OPS_EVIDENCE_STORAGE_PREFIX?.trim() || null;
}

export function isApprovedEvidenceUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.protocol === "http:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    return false;
  }
  const prefix = evidenceStoragePrefix();
  if (prefix) return url.startsWith(prefix);
  return true;
}

export function maskDriverRef(driverId: string): string {
  if (driverId.length <= 8) return `driver:${driverId}`;
  return `driver:…${driverId.slice(-6)}`;
}
