import { describe, expect, it } from "vitest";
import {
  isPubliclyAvailable,
  statusLabel,
  statusTone,
  type PublicStatus,
} from "./status";

describe("public availability display", () => {
  it("never treats stale or unknown as available", () => {
    const forbidden: PublicStatus[] = ["stale", "unknown", "offline", "faulted", "in_use"];
    for (const status of forbidden) {
      expect(isPubliclyAvailable(status)).toBe(false);
      expect(statusLabel(status)).not.toBe("Available");
      expect(statusTone(status)).not.toBe("available");
    }
  });

  it("labels available only for the available status", () => {
    expect(isPubliclyAvailable("available")).toBe(true);
    expect(statusLabel("available")).toBe("Available");
    expect(statusTone("available")).toBe("available");
  });

  it("uses grey tone for offline, unknown, and stale", () => {
    expect(statusTone("offline")).toBe("offline");
    expect(statusTone("unknown")).toBe("offline");
    expect(statusTone("stale")).toBe("offline");
    expect(statusLabel("stale")).toBe("Stale");
    expect(statusLabel("unknown")).toBe("Unknown");
  });
});
