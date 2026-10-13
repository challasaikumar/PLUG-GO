/**
 * India-first mobile number normalisation to E.164.
 * Other country codes can be added later without changing stored E.164 values.
 */

export const DEFAULT_PHONE_COUNTRY = "IN";
export const INDIA_CALLING_CODE = "91";

const COUNTRY_RULES: Record<
  string,
  { callingCode: string; nationalLength: number; nationalPattern: RegExp }
> = {
  IN: {
    callingCode: INDIA_CALLING_CODE,
    nationalLength: 10,
    nationalPattern: /^[6-9]\d{9}$/,
  },
};

export type NormalisedPhone = {
  e164: string;
  country: string;
  nationalNumber: string;
};

export type PhoneParseResult =
  | { ok: true; value: NormalisedPhone }
  | { ok: false; error: string };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function supportedPhoneCountries(): string[] {
  return Object.keys(COUNTRY_RULES);
}

export function parseMobileNumber(
  input: string,
  country: string = DEFAULT_PHONE_COUNTRY,
): PhoneParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a mobile number." };
  }

  const rule = COUNTRY_RULES[country];
  if (!rule) {
    return { ok: false, error: "That country code is not available yet." };
  }

  const digits = digitsOnly(trimmed);
  let national = digits;

  if (digits.startsWith(rule.callingCode) && digits.length === rule.callingCode.length + rule.nationalLength) {
    national = digits.slice(rule.callingCode.length);
  } else if (digits.startsWith("0") && digits.length === rule.nationalLength + 1) {
    national = digits.slice(1);
  } else if (digits.length === rule.nationalLength) {
    national = digits;
  } else {
    return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };
  }

  if (!rule.nationalPattern.test(national)) {
    return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };
  }

  return {
    ok: true,
    value: {
      e164: `+${rule.callingCode}${national}`,
      country,
      nationalNumber: national,
    },
  };
}

export function maskE164(e164: string): string {
  const digits = digitsOnly(e164);
  if (digits.length < 6) return "••••";
  const last = digits.slice(-4);
  if (digits.startsWith(INDIA_CALLING_CODE) && digits.length === 12) {
    return `+91 ••••••${last}`;
  }
  return `+${"•".repeat(Math.max(2, digits.length - 4))}${last}`;
}

export function isE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}
