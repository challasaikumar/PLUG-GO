import { ACCESS_TYPES, CONNECTOR_TYPES } from "@/lib/catalogue/validation";

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

export function isConnectorType(value: string): value is (typeof CONNECTOR_TYPES)[number] {
  return (CONNECTOR_TYPES as readonly string[]).includes(value);
}

export function isAccessType(value: string): value is (typeof ACCESS_TYPES)[number] {
  return (ACCESS_TYPES as readonly string[]).includes(value);
}
