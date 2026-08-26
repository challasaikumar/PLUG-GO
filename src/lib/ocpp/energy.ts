/**
 * Energy conversion without IEEE floating-point currency.
 * Stored energy is integer milliWh. Unknown units stay raw-only.
 */

export function decimalToScaledInt(raw: string, extraScale: number): bigint | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match || extraScale < 0 || extraScale > 12) return null;
  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2] ?? "0";
  const frac = (match[3] ?? "").padEnd(extraScale, "0").slice(0, extraScale);
  const digits = `${whole}${frac}` || "0";
  if (!/^\d+$/.test(digits)) return null;
  return sign * BigInt(digits);
}

export function energyMilliWhFromRaw(rawValue: string, rawUnit: string): bigint | null {
  const unit = rawUnit.trim().toUpperCase().replaceAll(".", "");
  if (unit === "WH" || unit === "WATTHOUR") {
    return decimalToScaledInt(rawValue, 3);
  }
  if (unit === "KWH" || unit === "KILOWATTHOUR") {
    return decimalToScaledInt(rawValue, 6);
  }
  if (unit === "MWH") {
    return decimalToScaledInt(rawValue, 9);
  }
  if (unit === "MILLIWH" || unit === "MWH_MILLI") {
    return decimalToScaledInt(rawValue, 0);
  }
  return null;
}

export function formatKwhFromMilliWh(milliWh: bigint): string {
  const negative = milliWh < 0n;
  const abs = negative ? -milliWh : milliWh;
  const whole = abs / 1_000_000n;
  const frac = (abs % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  const body = frac ? `${whole.toString()}.${frac}` : whole.toString();
  return negative ? `-${body}` : body;
}
