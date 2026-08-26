import { describe, expect, it } from "vitest";
import { isLivePath, isPrivatePath, isStaticShellPath } from "./cache-rules";

describe("PWA cache rules", () => {
  it("keeps private account and auth paths out of the shell cache", () => {
    expect(isPrivatePath("/account")).toBe(true);
    expect(isPrivatePath("/account/privacy")).toBe(true);
    expect(isPrivatePath("/vehicles")).toBe(true);
    expect(isPrivatePath("/saved-stations")).toBe(true);
    expect(isPrivatePath("/bookings")).toBe(true);
    expect(isPrivatePath("/payments/return")).toBe(true);
    expect(isPrivatePath("/invoices")).toBe(true);
    expect(isPrivatePath("/session/abc")).toBe(true);
    expect(isPrivatePath("/api/sessions")).toBe(true);
    expect(isPrivatePath("/ops")).toBe(true);
    expect(isPrivatePath("/ops/stations/abc")).toBe(true);
    expect(isPrivatePath("/technician/incidents/x")).toBe(true);
    expect(isPrivatePath("/partner")).toBe(true);
    expect(isPrivatePath("/fleet")).toBe(true);
    expect(isPrivatePath("/api/ops/incidents")).toBe(true);
    expect(isPrivatePath("/status")).toBe(true);
    expect(isPrivatePath("/api/health")).toBe(true);
    expect(isPrivatePath("/api/bookings")).toBe(true);
    expect(isPrivatePath("/api/auth/otp/request")).toBe(true);
    expect(isPrivatePath("/api/account/vehicles")).toBe(true);
    expect(isPrivatePath("/find-charger")).toBe(false);
  });

  it("treats live station and public APIs as network-only", () => {
    expect(isLivePath("/api/public/stations")).toBe(true);
    expect(isLivePath("/stations/telangana/hyderabad/hub")).toBe(true);
    expect(isLivePath("/scan/st_abc/cn_def")).toBe(true);
    expect(isStaticShellPath("/offline")).toBe(true);
    expect(isStaticShellPath("/_next/static/chunks/app.js")).toBe(true);
  });
});
