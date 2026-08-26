/**
 * Shared public-form field rules. Server and client use the same checks
 * so submitted values are trimmed, typed, and rejected when incomplete.
 */

import { parseMobileNumber } from "@/lib/auth/phone";

export const FIELD_LIMITS = {
  name: 80,
  email: 120,
  phone: 16,
  city: 60,
  organisation: 120,
  messageMin: 12,
  messageMax: 2000,
  vehicleOrBays: 20,
  stationRef: 64,
  slug: 72,
  otp: 6,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME = /^[\p{L}][\p{L}\s.'’-]*$/u;
const CITY = /^[\p{L}][\p{L}\s.'’-]*$/u;
const ORGANISATION = /[\p{L}]/u;
const BAYS = /^\d{1,4}(?:\s*[-–]\s*\d{1,4})?$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export function trimField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validatePersonName(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Enter your name.";
  if (value.length < 2) return "Enter a full name (at least 2 characters).";
  if (value.length > FIELD_LIMITS.name) return `Name must be ${FIELD_LIMITS.name} characters or fewer.`;
  if (!NAME.test(value)) return "Use letters in the name. Numbers and symbols are not accepted.";
  return undefined;
}

export function validateEmail(raw: unknown): string | undefined {
  const value = trimField(raw).toLowerCase();
  if (!value) return "Enter your email address.";
  if (value.length > FIELD_LIMITS.email) return `Email must be ${FIELD_LIMITS.email} characters or fewer.`;
  if (!EMAIL.test(value)) return "Enter a valid email address, for example name@domain.com.";
  return undefined;
}

export function validateIndianMobile(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Enter a 10-digit Indian mobile number.";
  const parsed = parseMobileNumber(value);
  return parsed.ok ? undefined : parsed.error;
}

export function validateOtpCode(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Enter the 6-digit code.";
  if (!/^\d{6}$/.test(value)) return "Enter the 6-digit code.";
  return undefined;
}

export function validateMinText(raw: unknown, min: number, emptyMessage: string): string | undefined {
  const value = trimField(raw);
  if (!value) return emptyMessage;
  if (value.length < min) return `Enter at least ${min} characters.`;
  if (value.length > FIELD_LIMITS.messageMax) {
    return `Must be ${FIELD_LIMITS.messageMax} characters or fewer.`;
  }
  return undefined;
}

export function validateDeleteConfirmation(raw: unknown): string | undefined {
  if (trimField(raw) !== "DELETE") return "Type DELETE in capital letters to confirm.";
  return undefined;
}

export function validateFutureDateTimeLocal(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Choose a date and time.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Enter a valid date and time.";
  if (date.getTime() < Date.now() - 60_000) return "Choose a start time that is still ahead.";
  return undefined;
}

export function validateCity(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Enter the city.";
  if (value.length < 2) return "Enter a city name (at least 2 characters).";
  if (value.length > FIELD_LIMITS.city) return `City must be ${FIELD_LIMITS.city} characters or fewer.`;
  if (!CITY.test(value)) return "Use letters in the city name.";
  return undefined;
}

export function validateOrganisation(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Enter the organisation or property name.";
  if (value.length < 2) return "Enter a name (at least 2 characters).";
  if (value.length > FIELD_LIMITS.organisation) {
    return `Name must be ${FIELD_LIMITS.organisation} characters or fewer.`;
  }
  if (!ORGANISATION.test(value)) return "Enter a real organisation or property name.";
  return undefined;
}

export function validateMessage(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return "Enter a message.";
  if (value.length < FIELD_LIMITS.messageMin) {
    return `Add a short description (at least ${FIELD_LIMITS.messageMin} characters).`;
  }
  if (value.length > FIELD_LIMITS.messageMax) {
    return `Message must be ${FIELD_LIMITS.messageMax} characters or fewer.`;
  }
  return undefined;
}

export function validateOptionalBays(raw: unknown): string | undefined {
  const value = trimField(raw);
  if (!value) return undefined;
  if (value.length > FIELD_LIMITS.vehicleOrBays) {
    return `Keep this to ${FIELD_LIMITS.vehicleOrBays} characters or fewer.`;
  }
  if (!BAYS.test(value)) return "Enter a number or range, for example 8 or 4-12.";
  return undefined;
}

export function validateOptionalSlug(raw: unknown): string | undefined {
  const value = trimField(raw).toLowerCase();
  if (!value) return undefined;
  if (value.length > FIELD_LIMITS.slug) return `Slug must be ${FIELD_LIMITS.slug} characters or fewer.`;
  if (!SLUG.test(value)) return "Use a published station slug, lowercase letters, numbers, and hyphens only.";
  return undefined;
}

export function validateOptionalRef(raw: unknown, label: string): string | undefined {
  const value = trimField(raw);
  if (!value) return undefined;
  if (value.length > FIELD_LIMITS.stationRef) {
    return `${label} must be ${FIELD_LIMITS.stationRef} characters or fewer.`;
  }
  if (!REF.test(value)) return `Enter a real ${label.toLowerCase()} only if you have one. Do not invent it.`;
  return undefined;
}

export function normalizeEmail(raw: unknown): string {
  return trimField(raw).toLowerCase();
}
