import { describe, expect, it } from "vitest";
import { parseVehicleInput } from "./vehicle-input";

describe("parseVehicleInput", () => {
  it("accepts a real make, model, and connector", () => {
    const result = parseVehicleInput({
      make: "Tata",
      model: "Nexon EV",
      connectorType: "ccs2",
      batteryKwh: 40,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a symbol-only make and an out-of-range battery", () => {
    const result = parseVehicleInput({
      make: "***",
      model: "Nexon",
      connectorType: "ccs2",
      batteryKwh: 900,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.make).toBeTruthy();
      expect(result.errors.batteryKwh).toBeTruthy();
    }
  });
});
