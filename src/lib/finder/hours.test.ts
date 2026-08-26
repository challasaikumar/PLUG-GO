import { describe, expect, it } from "vitest";
import { hoursAreReliable, isOpenAt, parseStructuredHours } from "./hours";

describe("structured hours", () => {
  it("treats free-text-only hours as unreliable", () => {
    expect(hoursAreReliable({ hoursStructured: null, is24_7: null })).toBe(false);
    expect(isOpenAt({ hoursStructured: null, is24_7: null })).toBeNull();
  });

  it("treats is24_7 as always open", () => {
    expect(hoursAreReliable({ is24_7: true })).toBe(true);
    expect(isOpenAt({ is24_7: true }, new Date("2026-08-25T12:00:00.000Z"))).toBe(true);
  });

  it("parses weekly windows and evaluates India time", () => {
    const weekly = {
      weekly: [{ day: 2, open: "09:00", close: "18:00" }],
    };
    expect(parseStructuredHours(weekly)?.length).toBe(1);
    // 25 Aug 2026 is a Tuesday. 12:00 UTC = 17:30 IST, still before 18:00.
    expect(isOpenAt({ hoursStructured: weekly }, new Date("2026-08-25T12:00:00.000Z"))).toBe(true);
    expect(isOpenAt({ hoursStructured: weekly }, new Date("2026-08-25T13:00:00.000Z"))).toBe(false);
  });
});
