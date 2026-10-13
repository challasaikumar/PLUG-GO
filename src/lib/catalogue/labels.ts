export const CONNECTOR_TYPES = [
  "ccs2",
  "type2_ac",
  "chademo",
  "gbt_dc",
  "gbt_ac",
  "bharat_dc_001",
  "bharat_ac_001",
  "other",
  "unknown",
] as const;

export const ACCESS_TYPES = [
  "public",
  "restricted",
  "guest_only",
  "hotel_guest",
  "members",
  "private",
  "unknown",
] as const;

export const PUBLIC_STATUSES = [
  "available",
  "occupied",
  "unavailable",
  "unknown",
  "stale",
] as const;

export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export function connectorTypeLabel(type: string): string {
  switch (type) {
    case "ccs2":
      return "CCS2";
    case "type2_ac":
      return "Type 2";
    case "chademo":
      return "CHAdeMO";
    case "gbt_dc":
      return "GB/T DC";
    case "gbt_ac":
      return "GB/T AC";
    case "bharat_dc_001":
      return "Bharat DC-001";
    case "bharat_ac_001":
      return "Bharat AC-001";
    case "other":
      return "Other";
    case "unknown":
      return "Unknown";
    default:
      return type;
  }
}

export function accessTypeLabel(type: string): string {
  switch (type) {
    case "public":
      return "Public";
    case "restricted":
      return "Restricted";
    case "guest_only":
      return "Guest only";
    case "hotel_guest":
      return "Hotel guests";
    case "members":
      return "Members";
    case "private":
      return "Private";
    case "unknown":
      return "Access unpublished";
    default:
      return type;
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "available":
      return "Available";
    case "occupied":
      return "In use";
    case "unavailable":
      return "Unavailable";
    case "stale":
      return "Status unpublished";
    case "unknown":
      return "Status unpublished";
    default:
      return "Status unpublished";
  }
}

export function isConnectorType(value: string): value is (typeof CONNECTOR_TYPES)[number] {
  return (CONNECTOR_TYPES as readonly string[]).includes(value);
}

export function isAccessType(value: string): value is (typeof ACCESS_TYPES)[number] {
  return (ACCESS_TYPES as readonly string[]).includes(value);
}
