import {
  assertNonNegativeInt,
  BIGINT_ZERO,
  gstPaise,
  paiseFromKwhMilli,
  percentOffPaise,
  toIntPaise,
} from "./money";

export const TARIFF_ESTIMATE_DISCLAIMER =
  "This is an estimate, not a tax invoice. A later charging session will use the tariff version in force at session start; the invoice may differ.";

export type DiscountKindInput = "none" | "flat_paise" | "percent_bps";

export type EstimateLineCode =
  | "energy"
  | "service"
  | "parking"
  | "idle"
  | "reservation"
  | "custom"
  | "discount"
  | "gst";

export type TariffEstimateInput = {
  tariffVersionId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  currency?: "INR";
  energyPaisePerKwh: number;
  servicePaisePerKwh: number;
  parkingPaiseFlat: number;
  parkingPaisePerMin: number;
  idlePaisePerMin: number;
  idleGraceMinutes: number;
  reservationPaise: number;
  gstRateBps: number;
  discountKind: DiscountKindInput;
  discountName?: string | null;
  discountValue: number;
  extraLines?: Array<{
    code: "custom" | "parking" | "idle" | "reservation" | "service";
    label: string;
    calculation: "per_kwh" | "per_minute" | "flat";
    ratePaise: number;
  }>;
  energyKwhMilli: number;
  idleMinutes?: number;
  parkingMinutes?: number;
  includeReservation?: boolean;
  disclaimer?: string;
};

export type EstimateLine = {
  code: EstimateLineCode;
  label: string;
  amountPaise: number;
};

export type TariffEstimate = {
  isEstimate: true;
  isInvoice: false;
  currency: "INR";
  tariffVersionId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  energyKwhMilli: number;
  lines: EstimateLine[];
  subtotalPaise: number;
  discountPaise: number;
  gstPaise: number;
  totalPaise: number;
  disclaimer: string;
};

function line(
  code: EstimateLineCode,
  label: string,
  amount: bigint,
): EstimateLine | null {
  if (amount === BIGINT_ZERO && code !== "energy") {
    return null;
  }
  return { code, label, amountPaise: toIntPaise(amount) };
}

export function estimateTariff(input: TariffEstimateInput): TariffEstimate {
  const energyKwhMilli = assertNonNegativeInt(input.energyKwhMilli, "energyKwhMilli");
  const idleMinutes = assertNonNegativeInt(input.idleMinutes ?? 0, "idleMinutes");
  const parkingMinutes = assertNonNegativeInt(input.parkingMinutes ?? 0, "parkingMinutes");
  const energyRate = assertNonNegativeInt(input.energyPaisePerKwh, "energyPaisePerKwh");
  const serviceRate = assertNonNegativeInt(input.servicePaisePerKwh, "servicePaisePerKwh");
  const parkingFlat = assertNonNegativeInt(input.parkingPaiseFlat, "parkingPaiseFlat");
  const parkingPerMin = assertNonNegativeInt(input.parkingPaisePerMin, "parkingPaisePerMin");
  const idlePerMin = assertNonNegativeInt(input.idlePaisePerMin, "idlePaisePerMin");
  const idleGrace = assertNonNegativeInt(input.idleGraceMinutes, "idleGraceMinutes");
  const reservation = assertNonNegativeInt(input.reservationPaise, "reservationPaise");
  const gstBps = assertNonNegativeInt(input.gstRateBps, "gstRateBps");
  const discountValue = assertNonNegativeInt(input.discountValue, "discountValue");

  const energy = paiseFromKwhMilli(energyRate, energyKwhMilli);
  const service = paiseFromKwhMilli(serviceRate, energyKwhMilli);
  const parking = parkingFlat + parkingPerMin * parkingMinutes;
  const billableIdle =
    idleMinutes > idleGrace ? idleMinutes - idleGrace : BIGINT_ZERO;
  const idle = idlePerMin * billableIdle;
  const reservationAmt = input.includeReservation ? reservation : BIGINT_ZERO;

  const lines: EstimateLine[] = [];
  const push = (item: EstimateLine | null) => {
    if (item) lines.push(item);
  };

  push(line("energy", "Energy charge", energy));
  push(line("service", "Service charge", service));
  push(line("parking", "Parking fee", parking));
  push(line("idle", "Idle fee", idle));
  push(line("reservation", "Reservation fee", reservationAmt));

  let extras = BIGINT_ZERO;
  for (const extra of input.extraLines ?? []) {
    const rate = assertNonNegativeInt(extra.ratePaise, extra.label);
    let amount = BIGINT_ZERO;
    if (extra.calculation === "flat") amount = rate;
    else if (extra.calculation === "per_kwh") amount = paiseFromKwhMilli(rate, energyKwhMilli);
    else amount = rate * parkingMinutes;
    extras += amount;
    push(line("custom", extra.label, amount));
  }

  const subtotal = energy + service + parking + idle + reservationAmt + extras;

  let discount = BIGINT_ZERO;
  if (input.discountKind === "flat_paise") {
    discount = discountValue > subtotal ? subtotal : discountValue;
  } else if (input.discountKind === "percent_bps") {
    discount = percentOffPaise(subtotal, discountValue);
    if (discount > subtotal) discount = subtotal;
  }

  const taxable = subtotal - discount;
  const gst = gstPaise(taxable, gstBps);
  const total = taxable + gst;

  if (discount > BIGINT_ZERO) {
    const name = input.discountName?.trim() || "Discount";
    lines.push({
      code: "discount",
      label: name,
      amountPaise: -toIntPaise(discount),
    });
  }

  if (gst > BIGINT_ZERO || gstBps > BIGINT_ZERO) {
    lines.push({
      code: "gst",
      label: `GST (${(Number(gstBps) / 100).toFixed(2)}%)`,
      amountPaise: toIntPaise(gst),
    });
  }

  return {
    isEstimate: true,
    isInvoice: false,
    currency: "INR",
    tariffVersionId: input.tariffVersionId,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    energyKwhMilli: input.energyKwhMilli,
    lines,
    subtotalPaise: toIntPaise(subtotal),
    discountPaise: toIntPaise(discount),
    gstPaise: toIntPaise(gst),
    totalPaise: toIntPaise(total),
    disclaimer: input.disclaimer?.trim() || TARIFF_ESTIMATE_DISCLAIMER,
  };
}
