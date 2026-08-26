import { describe, expect, it } from "vitest";
import { freshnessCopy, statusGuidance } from "./status";

describe("freshness copy", () => {
  const now = new Date("2026-08-25T12:00:00.000Z");

  it("states last updated in minutes without hiding the timestamp", () => {
    expect(
      freshnessCopy({
        status: "available",
        statusUpdatedAt: "2026-08-25T11:57:00.000Z",
        now,
      }),
    ).toBe("Status last updated 3 min ago");
  });

  it("uses live-status-unavailable copy when unknown or missing", () => {
    expect(
      freshnessCopy({
        status: "unknown",
        statusUpdatedAt: null,
        now,
      }),
    ).toBe("Live status unavailable");
  });

  it("points drivers to nearby options when stale or offline", () => {
    expect(statusGuidance("stale")).toMatch(/offline/i);
    expect(statusGuidance("offline")).toMatch(/nearby/i);
    expect(statusGuidance("available")).toBeNull();
  });
});
