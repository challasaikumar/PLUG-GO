import {
  normalizeEmail,
  trimField,
  validateCity,
  validateEmail,
  validateIndianMobile,
  validateMessage,
  validateOptionalBays,
  validateOptionalRef,
  validateOrganisation,
  validatePersonName,
} from "@/lib/fields";

export const CONTACT_REASONS = [
  "driver_support",
  "station_issue",
  "fleet_enquiry",
  "host_enquiry",
  "general_enquiry",
] as const;

export const SUPPORT_TOPICS = [
  "charging_not_started",
  "connector_issue",
  "payment_issue",
  "refund_billing",
  "unsafe_fault",
  "general_support",
] as const;

export const ENQUIRY_KINDS = [
  "contact",
  "support",
  "fleet",
  "workplace",
  "host",
] as const;

export type ContactReason = (typeof CONTACT_REASONS)[number];
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];
export type EnquiryKind = (typeof ENQUIRY_KINDS)[number];

export type EnquiryInput = {
  kind: EnquiryKind;
  reason?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  organisation?: string;
  city?: string;
  vehicleOrBays?: string;
  stationId?: string;
  sessionId?: string;
  consent: boolean;
  website?: string;
};

export type EnquiryFieldErrors = Partial<Record<keyof EnquiryInput, string>>;

export type EnquiryValidation =
  | { ok: true; value: EnquiryInput }
  | { ok: false; errors: EnquiryFieldErrors; formError: string };

export function contactReasonLabel(reason: ContactReason): string {
  switch (reason) {
    case "driver_support":
      return "Driver support";
    case "station_issue":
      return "Station issue";
    case "fleet_enquiry":
      return "Fleet enquiry";
    case "host_enquiry":
      return "Host enquiry";
    case "general_enquiry":
      return "General enquiry";
  }
}

export function supportTopicLabel(topic: SupportTopic): string {
  switch (topic) {
    case "charging_not_started":
      return "Charging has not started";
    case "connector_issue":
      return "Connector issue";
    case "payment_issue":
      return "Payment issue";
    case "refund_billing":
      return "Refund or billing";
    case "unsafe_fault":
      return "Unsafe or fault report";
    case "general_support":
      return "General support";
  }
}

export function validateEnquiry(raw: unknown): EnquiryValidation {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      errors: {},
      formError: "The form could not be read. Try again.",
    };
  }

  const data = raw as Record<string, unknown>;
  const kind = trimField(data.kind) as EnquiryKind;
  const website = trimField(data.website);
  const consent = data.consent === true || data.consent === "true" || data.consent === "on";

  const value: EnquiryInput = {
    kind,
    reason: trimField(data.reason) || undefined,
    name: trimField(data.name),
    email: normalizeEmail(data.email),
    phone: trimField(data.phone),
    message: trimField(data.message),
    organisation: trimField(data.organisation) || undefined,
    city: trimField(data.city) || undefined,
    vehicleOrBays: trimField(data.vehicleOrBays) || undefined,
    stationId: trimField(data.stationId) || undefined,
    sessionId: trimField(data.sessionId) || undefined,
    consent,
    website: website || undefined,
  };

  if (website) {
    return {
      ok: false,
      errors: {},
      formError: "Could not send this enquiry.",
    };
  }

  const errors: EnquiryFieldErrors = {};

  if (!ENQUIRY_KINDS.includes(kind)) {
    errors.kind = "Choose a valid enquiry type.";
  }

  if (kind === "contact") {
    if (!CONTACT_REASONS.includes(value.reason as ContactReason)) {
      errors.reason = "Select a reason.";
    }
  }

  if (kind === "support") {
    if (!SUPPORT_TOPICS.includes(value.reason as SupportTopic)) {
      errors.reason = "Select a help path.";
    }
  }

  const nameError = validatePersonName(value.name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(value.email);
  if (emailError) errors.email = emailError;

  if (kind === "contact") {
    if (value.phone) {
      const phoneError = validateIndianMobile(value.phone);
      if (phoneError) errors.phone = phoneError;
    }
  } else {
    const phoneError = validateIndianMobile(value.phone);
    if (phoneError) errors.phone = phoneError;
  }

  if (kind === "fleet" || kind === "workplace" || kind === "host") {
    const organisationError = validateOrganisation(value.organisation);
    if (organisationError) errors.organisation = organisationError;
    const cityError = validateCity(value.city);
    if (cityError) errors.city = cityError;
  }

  const baysError = validateOptionalBays(value.vehicleOrBays);
  if (baysError) errors.vehicleOrBays = baysError;

  const stationError = validateOptionalRef(value.stationId, "Station ID");
  if (stationError) errors.stationId = stationError;

  const sessionError = validateOptionalRef(value.sessionId, "Session reference");
  if (sessionError) errors.sessionId = sessionError;

  const messageError = validateMessage(value.message);
  if (messageError) errors.message = messageError;

  if (!consent) {
    errors.consent = "Please confirm you agree to be contacted about this enquiry.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      formError: "Please correct the highlighted fields.",
    };
  }

  return { ok: true, value };
}

export function isEnquiryConfigured(): boolean {
  return Boolean(process.env.ENQUIRY_WEBHOOK_URL?.trim());
}
