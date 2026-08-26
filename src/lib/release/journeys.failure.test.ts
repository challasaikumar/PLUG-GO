import { afterEach, describe, expect, it } from "vitest";
import { evaluateStationBookingGate } from "@/lib/booking/eligibility";
import { remoteChargingPolicyGate, staffRemoteStopPolicyGate } from "@/lib/ocpp/pilot";
import { getPublicMapConfig } from "@/lib/maps/config";
import { computePublicStatus } from "@/lib/status";
import { isSameOriginMutation } from "@/lib/auth/csrf";
import { requestDriverOtp } from "@/lib/auth/otp";
import { requireStaffRole, StaffAuthError } from "@/lib/auth/staff";
import { isPrivatePath } from "@/lib/pwa/cache-rules";
import { featureEnabledSync } from "./flags";

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) Reflect.deleteProperty(process.env, key);
  }
  Object.assign(process.env, original);
});

describe("critical failure paths", () => {
  it("does not map stale or unknown charger status to available", () => {
    expect(
      computePublicStatus({
        recordedStatus: "available",
        statusUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
        overrideExpiresAt: null,
        freshnessMinutes: 15,
      }).publicStatus,
    ).toBe("stale");
    expect(
      computePublicStatus({
        recordedStatus: "available",
        statusUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
        overrideExpiresAt: null,
        freshnessMinutes: null,
      }).publicStatus,
    ).toBe("unknown");
    expect(
      computePublicStatus({
        recordedStatus: null,
        statusUpdatedAt: null,
        overrideExpiresAt: null,
      }).publicStatus,
    ).toBe("unknown");
  });

  it("states that the map is unavailable when no provider is configured", () => {
    setEnv("NEXT_PUBLIC_MAPS_PROVIDER", "none");
    setEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", undefined);
    setEnv("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY", undefined);
    const config = getPublicMapConfig();
    expect(config.enabled).toBe(false);
    expect(config.unavailableReason).toMatch(/map display is unavailable/i);
  });

  it("rejects booking when the feature flag is off even if a policy exists", () => {
    expect(
      evaluateStationBookingGate({
        station: { publicationStatus: "published", isDemo: false },
        policy: null,
        paymentReady: true,
        authenticated: true,
        bookingFeatureEnabled: false,
      }),
    ).toMatchObject({ offer: false, reason: "booking_disabled" });
  });

  it("denies remote start when pilot or production flags are off", () => {
    setEnv("OCPP_ENABLED", "true");
    setEnv("OCPP_REMOTE_COMMANDS_ENABLED", "true");
    setEnv("FLAG_PILOT_REMOTE_CHARGING", undefined);
    setEnv("FLAG_PRODUCTION_REMOTE_CHARGING", undefined);
    expect(
      remoteChargingPolicyGate({
        commissioningState: "pilot",
        stationId: "stn",
        connectorId: "cn",
        driverId: "drv",
        capabilityEnabled: true,
      }).ok,
    ).toBe(false);
    const production = remoteChargingPolicyGate({
      commissioningState: "production",
      stationId: "stn",
      connectorId: "cn",
      driverId: "drv",
      capabilityEnabled: true,
    });
    expect(production.ok).toBe(false);
    if (!production.ok) expect(production.reason).toMatch(/FLAG_PRODUCTION_REMOTE_CHARGING/);
  });

  it("denies staff remote stop without the ops command flag", () => {
    setEnv("OCPP_ENABLED", "true");
    setEnv("OCPP_REMOTE_COMMANDS_ENABLED", "true");
    setEnv("FLAG_PILOT_REMOTE_CHARGING", "true");
    setEnv("OPS_STAFF_REMOTE_COMMANDS_ENABLED", undefined);
    expect(
      staffRemoteStopPolicyGate({
        commissioningState: "pilot",
        stationId: "stn",
        connectorId: "cn",
        capabilityEnabled: true,
      }).ok,
    ).toBe(false);
  });

  it("fails OTP closed when the driver OTP flag is off", async () => {
    setEnv("FLAG_DRIVER_OTP", "false");
    setEnv("AUTH_SECRET", "phase11-test-secret-value");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("NODE_ENV", "test");
    await expect(requestDriverOtp({ phone: "9876543210", ip: "203.0.113.250" })).rejects.toThrow(/FLAG_DRIVER_OTP/);
  });

  it("rejects cross-origin cookie mutations", () => {
    const request = new Request("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { origin: "https://evil.example", host: "localhost:3000" },
    });
    expect(isSameOriginMutation(request)).toBe(false);
  });

  it("denies staff roles in production without IdP and MFA", () => {
    setEnv("NODE_ENV", "production");
    setEnv("ADMIN_ENABLED", "true");
    setEnv("STAFF_IDENTITY_PROVIDER", undefined);
    setEnv("STAFF_MFA_ENFORCED", undefined);
    expect(() => requireStaffRole(["super_admin"])).toThrow(StaffAuthError);
  });

  it("treats account, payment, and session routes as private offline", () => {
    expect(isPrivatePath("/account")).toBe(true);
    expect(isPrivatePath("/payments/return")).toBe(true);
    expect(isPrivatePath("/session/abc")).toBe(true);
    expect(isPrivatePath("/offline")).toBe(false);
  });

  it("does not enable public live availability from OCPP alone", () => {
    setEnv("OCPP_ENABLED", "true");
    setEnv("OCPP_PUBLIC_LIVE_UPDATES", "true");
    setEnv("FLAG_PUBLIC_LIVE_AVAILABILITY", undefined);
    expect(featureEnabledSync("publicLiveAvailability")).toBe(false);
  });
});
