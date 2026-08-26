/**
 * Display formatting for integer paise. Arithmetic stays in money.ts.
 */

export function formatInrFromPaise(paise: number): string {
  const sign = paise < 0 ? "−" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}₹${rupees.toLocaleString("en-IN")}.${remainder.toString().padStart(2, "0")}`;
}

export function formatPaisePerKwh(paise: number): string {
  return `${formatInrFromPaise(paise)}/kWh`;
}

export function startingPriceLabel(energyPaisePerKwh: number | null | undefined): string | null {
  if (energyPaisePerKwh == null || !Number.isInteger(energyPaisePerKwh) || energyPaisePerKwh < 0) {
    return null;
  }
  return `From ${formatPaisePerKwh(energyPaisePerKwh)}`;
}
