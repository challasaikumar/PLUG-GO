import { describe, expect, it } from "vitest";
import { estimateTariff } from "./estimate";
import { formatInrFromPaise, startingPriceLabel } from "./format";

describe("tariff estimate display", () => {
  it("formats integer paise without dropping the timestamped breakdown", () => {
    expect(formatInrFromPaise(123456)).toBe("₹1,234.56");
    expect(startingPriceLabel(1200)).toBe("From ₹12.00/kWh");
    expect(startingPriceLabel(null)).toBeNull();
  });

  it("shows energy, service, parking/idle/reservation, GST, and discount, and is not an invoice", () => {
    const estimate = estimateTariff({
      tariffVersionId: "tv_display",
      effectiveFrom: "2026-08-01T00:00:00.000Z",
      energyPaisePerKwh: 1200,
      servicePaisePerKwh: 100,
      parkingPaiseFlat: 500,
      parkingPaisePerMin: 0,
      idlePaisePerMin: 50,
      idleGraceMinutes: 0,
      reservationPaise: 200,
      gstRateBps: 1800,
      discountKind: "flat_paise",
      discountName: "Intro",
      discountValue: 100,
      energyKwhMilli: 10_000,
      idleMinutes: 2,
      includeReservation: true,
    });

    expect(estimate.isEstimate).toBe(true);
    expect(estimate.isInvoice).toBe(false);
    expect(estimate.lines.map((line) => line.code)).toEqual([
      "energy",
      "service",
      "parking",
      "idle",
      "reservation",
      "discount",
      "gst",
    ]);
    expect(estimate.disclaimer.toLowerCase()).toContain("not a tax invoice");
    expect(formatInrFromPaise(estimate.totalPaise)).toMatch(/^₹/);
  });
});
