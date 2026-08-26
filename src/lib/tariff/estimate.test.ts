import { describe, expect, it } from "vitest";
import { estimateTariff } from "./estimate";
import { gstPaise, mulDivRoundHalfUp, paiseFromKwhMilli } from "./money";

describe("integer paise helpers", () => {
  it("rounds half up on energy", () => {
    // 1250 paise/kWh * 333 milli-kWh (0.333 kWh) = 416.25 → 416
    expect(Number(paiseFromKwhMilli(BigInt(1250), BigInt(333)))).toBe(416);
    expect(Number(paiseFromKwhMilli(BigInt(1250), BigInt(334)))).toBe(418);
    expect(Number(mulDivRoundHalfUp(BigInt(1), BigInt(1), BigInt(2)))).toBe(1);
  });

  it("computes 18% GST in paise", () => {
    expect(Number(gstPaise(BigInt(10000), BigInt(1800)))).toBe(1800);
    expect(Number(gstPaise(BigInt(1), BigInt(1800)))).toBe(0);
    expect(Number(gstPaise(BigInt(3), BigInt(1800)))).toBe(1);
  });
});

describe("estimateTariff", () => {
  const base = {
    tariffVersionId: "tv_test",
    effectiveFrom: "2026-08-01T00:00:00.000Z",
    energyPaisePerKwh: 1200,
    servicePaisePerKwh: 100,
    parkingPaiseFlat: 0,
    parkingPaisePerMin: 0,
    idlePaisePerMin: 0,
    idleGraceMinutes: 0,
    reservationPaise: 0,
    gstRateBps: 1800,
    discountKind: "none" as const,
    discountValue: 0,
    energyKwhMilli: 10000,
  };

  it("breaks down energy, service, GST, and total", () => {
    const result = estimateTariff(base);
    expect(result.isEstimate).toBe(true);
    expect(result.isInvoice).toBe(false);
    expect(result.currency).toBe("INR");
    expect(result.tariffVersionId).toBe("tv_test");
    expect(result.subtotalPaise).toBe(13000);
    expect(result.gstPaise).toBe(2340);
    expect(result.totalPaise).toBe(15340);
    expect(result.lines.map((line) => line.code)).toEqual(["energy", "service", "gst"]);
  });

  it("applies a named percent discount before GST", () => {
    const result = estimateTariff({
      ...base,
      discountKind: "percent_bps",
      discountName: "Staff trial",
      discountValue: 1000,
    });
    expect(result.discountPaise).toBe(1300);
    expect(result.gstPaise).toBe(2106);
    expect(result.totalPaise).toBe(13806);
    expect(result.lines.some((line) => line.code === "discount" && line.amountPaise === -1300)).toBe(
      true,
    );
  });

  it("applies a flat discount without going negative", () => {
    const result = estimateTariff({
      ...base,
      energyKwhMilli: 1000,
      discountKind: "flat_paise",
      discountName: "Cap",
      discountValue: 999_999,
    });
    expect(result.subtotalPaise).toBe(1300);
    expect(result.discountPaise).toBe(1300);
    expect(result.totalPaise).toBe(0);
  });

  it("charges idle only after grace and includes extra line items", () => {
    const result = estimateTariff({
      ...base,
      idlePaisePerMin: 50,
      idleGraceMinutes: 10,
      idleMinutes: 25,
      extraLines: [
        { code: "custom", label: "Bay lighting", calculation: "flat", ratePaise: 200 },
      ],
    });
    expect(result.lines.find((line) => line.code === "idle")?.amountPaise).toBe(750);
    expect(result.lines.find((line) => line.label === "Bay lighting")?.amountPaise).toBe(200);
    expect(result.subtotalPaise).toBe(13000 + 750 + 200);
  });

  it("never claims the estimate is an invoice", () => {
    const result = estimateTariff(base);
    expect(result.disclaimer.toLowerCase()).toContain("not a tax invoice");
    expect(result.isInvoice).toBe(false);
  });
});
