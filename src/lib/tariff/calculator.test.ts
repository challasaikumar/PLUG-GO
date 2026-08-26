import { describe, expect, it } from "vitest";
import {
  EDUCATIONAL_EXAMPLE_LABEL,
  educationalEstimate,
  parseCalculatorInput,
} from "./calculator";

describe("pricing calculator validation", () => {
  it("rejects missing, negative, and out-of-range inputs", () => {
    expect(parseCalculatorInput({}).ok).toBe(false);
    expect(parseCalculatorInput({ energyKwh: -1, idleMinutes: 0, parkingMinutes: 0 }).ok).toBe(false);
    expect(parseCalculatorInput({ energyKwh: 10, idleMinutes: 1.5, parkingMinutes: 0 }).ok).toBe(false);
    expect(parseCalculatorInput({ energyKwh: 10, idleMinutes: 0, parkingMinutes: 9999 }).ok).toBe(false);
  });

  it("returns an educational estimate that is not an invoice or exact cost", () => {
    const parsed = parseCalculatorInput({ energyKwh: 10, idleMinutes: 0, parkingMinutes: 0 });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const estimate = educationalEstimate(parsed.value);
    expect(estimate.isEstimate).toBe(true);
    expect(estimate.isInvoice).toBe(false);
    expect(estimate.disclaimer).toContain(EDUCATIONAL_EXAMPLE_LABEL);
    expect(estimate.totalPaise).toBeGreaterThan(0);
  });
});
