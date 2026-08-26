import { estimateTariff, type TariffEstimate, type TariffEstimateInput } from "./estimate";

export const EDUCATIONAL_EXAMPLE_LABEL =
  "Example values for education only — not a Plug and Go tariff and not a quote.";

export const EDUCATIONAL_EXAMPLE_TARIFF = {
  tariffVersionId: "example-educational-not-plug-and-go",
  effectiveFrom: "1970-01-01T00:00:00.000Z",
  energyPaisePerKwh: 1500,
  servicePaisePerKwh: 100,
  parkingPaiseFlat: 0,
  parkingPaisePerMin: 50,
  idlePaisePerMin: 200,
  idleGraceMinutes: 10,
  reservationPaise: 0,
  gstRateBps: 1800,
  discountKind: "none" as const,
  discountValue: 0,
  disclaimer: `${EDUCATIONAL_EXAMPLE_LABEL} ${"This is an estimate, not a tax invoice. A later charging session invoice may differ."}`,
};

export type CalculatorFieldErrors = Record<string, string>;

export type CalculatorInput = {
  energyKwh: number;
  idleMinutes: number;
  parkingMinutes: number;
};

const ENERGY_MIN = 0.1;
const ENERGY_MAX = 200;
const MINUTES_MAX = 480;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseCalculatorInput(raw: unknown):
  | { ok: true; value: CalculatorInput }
  | { ok: false; errors: CalculatorFieldErrors } {
  const data = asRecord(raw) ?? {};
  const errors: CalculatorFieldErrors = {};
  const energyKwh = parseNumber(data.energyKwh);
  const idleMinutes = parseNumber(data.idleMinutes ?? 0);
  const parkingMinutes = parseNumber(data.parkingMinutes ?? 0);

  if (energyKwh == null) errors.energyKwh = "Enter energy in kWh.";
  else if (energyKwh < ENERGY_MIN || energyKwh > ENERGY_MAX) {
    errors.energyKwh = `Energy must be between ${ENERGY_MIN} and ${ENERGY_MAX} kWh.`;
  }

  if (idleMinutes == null || !Number.isInteger(idleMinutes) || idleMinutes < 0 || idleMinutes > MINUTES_MAX) {
    errors.idleMinutes = `Idle minutes must be a whole number from 0 to ${MINUTES_MAX}.`;
  }
  if (
    parkingMinutes == null ||
    !Number.isInteger(parkingMinutes) ||
    parkingMinutes < 0 ||
    parkingMinutes > MINUTES_MAX
  ) {
    errors.parkingMinutes = `Parking minutes must be a whole number from 0 to ${MINUTES_MAX}.`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      energyKwh: energyKwh as number,
      idleMinutes: idleMinutes as number,
      parkingMinutes: parkingMinutes as number,
    },
  };
}

export function energyKwhToMilli(energyKwh: number): number {
  return Math.round(energyKwh * 1000);
}

export function educationalEstimate(input: CalculatorInput): TariffEstimate {
  return estimateTariff({
    ...EDUCATIONAL_EXAMPLE_TARIFF,
    energyKwhMilli: energyKwhToMilli(input.energyKwh),
    idleMinutes: input.idleMinutes,
    parkingMinutes: input.parkingMinutes,
    includeReservation: false,
  });
}

export function estimateFromApprovedTariff(
  tariff: Omit<TariffEstimateInput, "energyKwhMilli" | "idleMinutes" | "parkingMinutes" | "includeReservation">,
  input: CalculatorInput,
): TariffEstimate {
  return estimateTariff({
    ...tariff,
    energyKwhMilli: energyKwhToMilli(input.energyKwh),
    idleMinutes: input.idleMinutes,
    parkingMinutes: input.parkingMinutes,
    includeReservation: false,
  });
}
