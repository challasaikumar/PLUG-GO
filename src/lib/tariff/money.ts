/**
 * Integer-paise arithmetic. Never use number division for money.
 */

const ZERO = BigInt(0);
const TWO = BigInt(2);
const THOUSAND = BigInt(1000);
const TEN_THOUSAND = BigInt(10000);

export function assertNonNegativeInt(value: number, label: string): bigint {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return BigInt(value);
}

/** Round half up for positive amounts: floor((n + d/2) / d). */
export function mulDivRoundHalfUp(n: bigint, m: bigint, d: bigint): bigint {
  if (d <= ZERO) {
    throw new Error("Divisor must be positive.");
  }
  const product = n * m;
  if (product < ZERO) {
    throw new Error("Money amounts must not be negative.");
  }
  return (product + d / TWO) / d;
}

export function paiseFromKwhMilli(ratePaisePerKwh: bigint, energyKwhMilli: bigint): bigint {
  return mulDivRoundHalfUp(ratePaisePerKwh, energyKwhMilli, THOUSAND);
}

export function gstPaise(taxablePaise: bigint, gstRateBps: bigint): bigint {
  return mulDivRoundHalfUp(taxablePaise, gstRateBps, TEN_THOUSAND);
}

export function percentOffPaise(amountPaise: bigint, percentBps: bigint): bigint {
  return mulDivRoundHalfUp(amountPaise, percentBps, TEN_THOUSAND);
}

export function toIntPaise(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds safe integer range.");
  }
  return Number(value);
}

export { ZERO as BIGINT_ZERO };
