import type {
  AccessType,
  AvailabilitySource,
  ConnectorType,
  DataSource,
  DiscountKind,
  HostType,
  InstallationStatus,
  OperationalLifecycle,
  PowerType,
  RecordedStatus,
  TimeBand,
} from "@prisma/client";

export const DATA_SOURCES = [
  "staff_survey",
  "host_report",
  "operator_admin",
  "csms_ocpp",
  "photo_evidence",
  "other",
] as const;

export const PUBLICATION_STATUSES = [
  "draft",
  "pending_approval",
  "published",
  "archived",
] as const;

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

export const HOST_TYPES = [
  "mall",
  "hotel",
  "workplace",
  "fuel_station",
  "depot",
  "residential",
  "highway",
  "other",
] as const;

export const LIFECYCLES = [
  "planned",
  "commissioning",
  "open",
  "temporarily_closed",
  "decommissioned",
] as const;

export const POWER_TYPES = ["ac", "dc", "unknown"] as const;
export const INSTALLATION = ["installed", "planned", "removed"] as const;
export const TIME_BANDS = [
  "all_hours",
  "solar",
  "non_solar",
  "peak",
  "off_peak",
  "custom",
] as const;
export const DISCOUNT_KINDS = ["none", "flat_paise", "percent_bps"] as const;
export const RECORDED_STATUSES = [
  "available",
  "in_use",
  "faulted",
  "offline",
  "unknown",
] as const;
export const AVAILABILITY_SOURCES = [
  "csms_ocpp",
  "operator_override",
  "technician",
  "heartbeat_timeout",
  "manual_import",
] as const;

export type FieldErrors = Record<string, string>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalTrim(value: unknown): string | undefined {
  const text = trim(value);
  return text ? text : undefined;
}

export function intField(value: unknown, label: string, errors: FieldErrors, min = 0): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < min) {
    errors[label] = `${label} must be an integer ≥ ${min}.`;
    return undefined;
  }
  return parsed;
}

export function requiredString(value: unknown, key: string, errors: FieldErrors, min = 2): string {
  const text = trim(value);
  if (text.length < min) {
    errors[key] = `Enter ${key}.`;
  }
  return text;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function slugify(name: string, city: string): string {
  const base = `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "station";
}

export type StationWriteInput = {
  organisationId: string;
  hostId: string;
  name: string;
  slug?: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  addressLine1: string;
  addressLine2?: string;
  locality?: string;
  district?: string;
  pincode: string;
  landmark?: string;
  arrivalInstructions?: string;
  accessType: AccessType;
  accessHoursSummary: string;
  accessHoursStructured?: unknown;
  accessRestrictions?: string;
  is24_7?: boolean | null;
  parkingDetails?: string;
  parkingFeeApplies?: boolean | null;
  bookingRequired?: boolean | null;
  amenities: string[];
  accessibilityNotes?: string;
  accessibleBayCount?: number;
  supportPhoneOverride?: string;
  supportEmailOverride?: string;
  emergencyInstructions?: string;
  operationalLifecycle: OperationalLifecycle;
  paymentMethods: string[];
  authenticationMethods: string[];
  compatibleVehicleNotes?: string;
  internalNotes?: string;
  dataSource: DataSource;
};

export function parseStationWrite(
  raw: unknown,
): { ok: true; value: StationWriteInput } | { ok: false; errors: FieldErrors } {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) {
    return { ok: false, errors: { form: "Expected a JSON object." } };
  }

  const value: StationWriteInput = {
    organisationId: requiredString(data.organisationId, "organisationId", errors, 1),
    hostId: requiredString(data.hostId, "hostId", errors, 1),
    name: requiredString(data.name, "name", errors),
    slug: optionalTrim(data.slug),
    city: requiredString(data.city, "city", errors),
    state: requiredString(data.state, "state", errors),
    latitude: trim(data.latitude),
    longitude: trim(data.longitude),
    addressLine1: requiredString(data.addressLine1, "addressLine1", errors),
    addressLine2: optionalTrim(data.addressLine2),
    locality: optionalTrim(data.locality),
    district: optionalTrim(data.district),
    pincode: requiredString(data.pincode, "pincode", errors, 6),
    landmark: optionalTrim(data.landmark),
    arrivalInstructions: optionalTrim(data.arrivalInstructions),
    accessType: oneOf(data.accessType, ACCESS_TYPES, "unknown") as AccessType,
    accessHoursSummary: requiredString(data.accessHoursSummary, "accessHoursSummary", errors),
    accessHoursStructured: data.accessHoursStructured,
    accessRestrictions: optionalTrim(data.accessRestrictions),
    is24_7: data.is24_7 === true ? true : data.is24_7 === false ? false : null,
    parkingDetails: optionalTrim(data.parkingDetails),
    parkingFeeApplies:
      data.parkingFeeApplies === true ? true : data.parkingFeeApplies === false ? false : null,
    bookingRequired:
      data.bookingRequired === true ? true : data.bookingRequired === false ? false : null,
    amenities: Array.isArray(data.amenities)
      ? data.amenities.filter((item): item is string => typeof item === "string")
      : [],
    accessibilityNotes: optionalTrim(data.accessibilityNotes),
    accessibleBayCount: intField(data.accessibleBayCount, "accessibleBayCount", errors),
    supportPhoneOverride: optionalTrim(data.supportPhoneOverride),
    supportEmailOverride: optionalTrim(data.supportEmailOverride),
    emergencyInstructions: optionalTrim(data.emergencyInstructions),
    operationalLifecycle: oneOf(data.operationalLifecycle, LIFECYCLES, "planned") as OperationalLifecycle,
    paymentMethods: Array.isArray(data.paymentMethods)
      ? data.paymentMethods.filter((item): item is string => typeof item === "string")
      : [],
    authenticationMethods: Array.isArray(data.authenticationMethods)
      ? data.authenticationMethods.filter((item): item is string => typeof item === "string")
      : [],
    compatibleVehicleNotes: optionalTrim(data.compatibleVehicleNotes),
    internalNotes: optionalTrim(data.internalNotes),
    dataSource: oneOf(data.dataSource, DATA_SOURCES, "operator_admin") as DataSource,
  };

  const lat = Number.parseFloat(value.latitude);
  const lng = Number.parseFloat(value.longitude);
  if (!Number.isFinite(lat) || lat < 6 || lat > 38) {
    errors.latitude = "Enter a latitude in India (WGS84).";
  }
  if (!Number.isFinite(lng) || lng < 68 || lng > 98) {
    errors.longitude = "Enter a longitude in India (WGS84).";
  }
  if (!/^\d{6}$/.test(value.pincode)) {
    errors.pincode = "Enter a 6-digit Indian pincode.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value };
}

export type EvseWriteInput = {
  evseLabel: string;
  maxPowerWatts: number;
  powerType: PowerType;
  installationStatus: InstallationStatus;
  ocppChargePointId?: string;
  ocppEvseId?: string;
  dataSource: DataSource;
};

export function parseEvseWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const maxPowerWatts = intField(data.maxPowerWatts, "maxPowerWatts", errors, 1) ?? 0;
  const value: EvseWriteInput = {
    evseLabel: requiredString(data.evseLabel, "evseLabel", errors, 1),
    maxPowerWatts,
    powerType: oneOf(data.powerType, POWER_TYPES, "unknown") as PowerType,
    installationStatus: oneOf(data.installationStatus, INSTALLATION, "installed") as InstallationStatus,
    ocppChargePointId: optionalTrim(data.ocppChargePointId),
    ocppEvseId: optionalTrim(data.ocppEvseId),
    dataSource: oneOf(data.dataSource, DATA_SOURCES, "operator_admin") as DataSource,
  };
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, value };
}

export type ConnectorWriteInput = {
  connectorIndex: number;
  connectorType: ConnectorType;
  maxPowerWatts: number;
  installationStatus: InstallationStatus;
  vehicleCompatibilityNotes?: string;
  cableAttached?: boolean | null;
  dataSource: DataSource;
};

export function parseConnectorWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const value: ConnectorWriteInput = {
    connectorIndex: intField(data.connectorIndex, "connectorIndex", errors, 1) ?? 0,
    connectorType: oneOf(data.connectorType, CONNECTOR_TYPES, "unknown") as ConnectorType,
    maxPowerWatts: intField(data.maxPowerWatts, "maxPowerWatts", errors, 1) ?? 0,
    installationStatus: oneOf(data.installationStatus, INSTALLATION, "installed") as InstallationStatus,
    vehicleCompatibilityNotes: optionalTrim(data.vehicleCompatibilityNotes),
    cableAttached: data.cableAttached === true ? true : data.cableAttached === false ? false : null,
    dataSource: oneOf(data.dataSource, DATA_SOURCES, "operator_admin") as DataSource,
  };
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, value };
}

export type TariffWriteInput = {
  connectorId?: string;
  connectorType?: ConnectorType;
  timeBand: TimeBand;
  timeBandNotes?: string;
  energyPaisePerKwh: number;
  servicePaisePerKwh: number;
  parkingPaiseFlat: number;
  parkingPaisePerMin: number;
  idlePaisePerMin: number;
  idleGraceMinutes: number;
  reservationPaise: number;
  gstRateBps: number;
  discountKind: DiscountKind;
  discountName?: string;
  discountValue: number;
  effectiveFrom: string;
  effectiveTo?: string;
};

export function parseTariffWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const effectiveFrom = trim(data.effectiveFrom);
  if (!effectiveFrom || Number.isNaN(Date.parse(effectiveFrom))) {
    errors.effectiveFrom = "Enter an effective start date.";
  }
  const value: TariffWriteInput = {
    connectorId: optionalTrim(data.connectorId),
    connectorType: data.connectorType
      ? (oneOf(data.connectorType, CONNECTOR_TYPES, "unknown") as ConnectorType)
      : undefined,
    timeBand: oneOf(data.timeBand, TIME_BANDS, "all_hours") as TimeBand,
    timeBandNotes: optionalTrim(data.timeBandNotes),
    energyPaisePerKwh: intField(data.energyPaisePerKwh, "energyPaisePerKwh", errors) ?? 0,
    servicePaisePerKwh: intField(data.servicePaisePerKwh, "servicePaisePerKwh", errors) ?? 0,
    parkingPaiseFlat: intField(data.parkingPaiseFlat, "parkingPaiseFlat", errors) ?? 0,
    parkingPaisePerMin: intField(data.parkingPaisePerMin, "parkingPaisePerMin", errors) ?? 0,
    idlePaisePerMin: intField(data.idlePaisePerMin, "idlePaisePerMin", errors) ?? 0,
    idleGraceMinutes: intField(data.idleGraceMinutes, "idleGraceMinutes", errors) ?? 0,
    reservationPaise: intField(data.reservationPaise, "reservationPaise", errors) ?? 0,
    gstRateBps: intField(data.gstRateBps, "gstRateBps", errors) ?? 0,
    discountKind: oneOf(data.discountKind, DISCOUNT_KINDS, "none") as DiscountKind,
    discountName: optionalTrim(data.discountName),
    discountValue: intField(data.discountValue, "discountValue", errors) ?? 0,
    effectiveFrom,
    effectiveTo: optionalTrim(data.effectiveTo),
  };
  if (value.gstRateBps > 10000) errors.gstRateBps = "GST basis points cannot exceed 10000 (100%).";
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, value };
}

export type OverrideWriteInput = {
  connectorId: string;
  recordedStatus: RecordedStatus;
  reason: string;
  expiresAt: string;
  source: AvailabilitySource;
};

export function parseOverrideWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const expiresAt = trim(data.expiresAt);
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) {
    errors.expiresAt = "Enter an expiry timestamp.";
  }
  const value: OverrideWriteInput = {
    connectorId: requiredString(data.connectorId, "connectorId", errors, 1),
    recordedStatus: oneOf(data.recordedStatus, RECORDED_STATUSES, "unknown") as RecordedStatus,
    reason: requiredString(data.reason, "reason", errors, 8),
    expiresAt,
    source: oneOf(data.source, AVAILABILITY_SOURCES, "operator_override") as AvailabilitySource,
  };
  if (value.recordedStatus === "available" && value.source === "manual_import") {
    errors.recordedStatus = "A manual import cannot be recorded as Available.";
  }
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, value };
}

export type OrgWriteInput = {
  legalName: string;
  brandName: string;
  registeredAddress: string;
  gstin?: string;
  supportPhone?: string;
  supportEmail?: string;
};

export function parseOrgWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const value: OrgWriteInput = {
    legalName: requiredString(data.legalName, "legalName", errors),
    brandName: requiredString(data.brandName, "brandName", errors),
    registeredAddress: requiredString(data.registeredAddress, "registeredAddress", errors),
    gstin: optionalTrim(data.gstin),
    supportPhone: optionalTrim(data.supportPhone),
    supportEmail: optionalTrim(data.supportEmail),
  };
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, value };
}

export type HostWriteInput = {
  organisationId: string;
  hostLegalName: string;
  hostDisplayName: string;
  hostType: HostType;
};

export function parseHostWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const value: HostWriteInput = {
    organisationId: requiredString(data.organisationId, "organisationId", errors, 1),
    hostLegalName: requiredString(data.hostLegalName, "hostLegalName", errors),
    hostDisplayName: requiredString(data.hostDisplayName, "hostDisplayName", errors),
    hostType: oneOf(data.hostType, HOST_TYPES, "other") as HostType,
  };
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, value };
}

export function parseMediaWrite(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const storageUrl = requiredString(data.storageUrl, "storageUrl", errors, 8);
  const altText = requiredString(data.altText, "altText", errors);
  const rightsConfirmed = data.rightsConfirmed === true;
  if (!rightsConfirmed) errors.rightsConfirmed = "Confirm image rights before saving.";
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      storageUrl,
      altText,
      caption: optionalTrim(data.caption),
      kind: trim(data.kind) || "other",
      rightsConfirmed,
    },
  };
}
