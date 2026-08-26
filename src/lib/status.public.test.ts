import { describe, expect, it } from "vitest";
import { computePublicStatus, isPubliclyAvailable } from "./status";

describe("computePublicStatus", () => {
  const now = new Date("2026-08-25T12:00:00.000Z");

  it("never returns available when freshness is unconfigured", () => {
    const available = computePublicStatus({
      recordedStatus: "available",
      statusUpdatedAt: new Date("2026-08-25T11:59:00.000Z"),
      now,
      freshnessMinutes: null,
    });
    expect(available.publicStatus).toBe("unknown");
    expect(isPubliclyAvailable(available.publicStatus)).toBe(false);

    const inUse = computePublicStatus({
      recordedStatus: "in_use",
      statusUpdatedAt: new Date("2026-08-25T11:59:00.000Z"),
      now,
      freshnessMinutes: null,
    });
    expect(inUse.publicStatus).toBe("stale");
  });

  it("returns available only for a fresh available event with a threshold", () => {
    const fresh = computePublicStatus({
      recordedStatus: "available",
      statusUpdatedAt: new Date("2026-08-25T11:50:00.000Z"),
      now,
      freshnessMinutes: 15,
    });
    expect(fresh.publicStatus).toBe("available");

    const old = computePublicStatus({
      recordedStatus: "available",
      statusUpdatedAt: new Date("2026-08-25T11:00:00.000Z"),
      now,
      freshnessMinutes: 15,
    });
    expect(old.publicStatus).toBe("stale");
    expect(isPubliclyAvailable(old.publicStatus)).toBe(false);
  });

  it("treats missing events and expired overrides as unknown", () => {
    expect(
      computePublicStatus({
        recordedStatus: null,
        statusUpdatedAt: null,
        now,
        freshnessMinutes: 15,
      }).publicStatus,
    ).toBe("unknown");

    expect(
      computePublicStatus({
        recordedStatus: "available",
        statusUpdatedAt: new Date("2026-08-25T11:59:00.000Z"),
        overrideExpiresAt: new Date("2026-08-25T11:00:00.000Z"),
        now,
        freshnessMinutes: 15,
      }).publicStatus,
    ).toBe("unknown");
  });
});
