import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENTS, sanitizeAnalyticsPayload, track } from "./analytics";

describe("analytics placeholder", () => {
  it("exposes Phase 0 and Phase 6 event names", () => {
    expect(ANALYTICS_EVENTS.location_search).toBe("location_search");
    expect(ANALYTICS_EVENTS.station_viewed).toBe("station_viewed");
    expect(ANALYTICS_EVENTS.directions_clicked).toBe("directions_clicked");
    expect(ANALYTICS_EVENTS.guide_viewed).toBe("guide_viewed");
    expect(ANALYTICS_EVENTS.city_page_viewed).toBe("city_page_viewed");
    expect(ANALYTICS_EVENTS.route_page_viewed).toBe("route_page_viewed");
    expect(ANALYTICS_EVENTS.lead_qualified).toBe("lead_qualified");
    expect(ANALYTICS_EVENTS.otp_requested).toBe("otp_requested");
    expect(ANALYTICS_EVENTS.otp_verified).toBe("otp_verified");
    expect(ANALYTICS_EVENTS.signup_completed).toBe("signup_completed");
    expect(ANALYTICS_EVENTS.vehicle_added).toBe("vehicle_added");
    expect(ANALYTICS_EVENTS.station_saved).toBe("station_saved");
    expect(ANALYTICS_EVENTS.privacy_export_requested).toBe("privacy_export_requested");
    expect(ANALYTICS_EVENTS.deletion_requested).toBe("deletion_requested");
    expect(ANALYTICS_EVENTS.pwa_install_prompt_shown).toBe("pwa_install_prompt_shown");
    expect(ANALYTICS_EVENTS.pwa_installed).toBe("pwa_installed");
    expect(ANALYTICS_EVENTS.booking_started).toBe("booking_started");
    expect(ANALYTICS_EVENTS.payment_succeeded).toBe("payment_succeeded");
    expect(ANALYTICS_EVENTS.booking_confirmed).toBe("booking_confirmed");
    expect(ANALYTICS_EVENTS.refund_completed).toBe("refund_completed");
  });

  it("strips precise location, phone, and payment fields", () => {
    const clean = sanitizeAnalyticsPayload({
      station_slug: "omr-hub",
      lat: 13.08,
      lng: 80.27,
      phone: "9999999999",
      payment: "card",
      otp: "123456",
      nickname: "KA01AB1234",
    });
    expect(clean.station_slug).toBe("omr-hub");
    expect(clean.lat).toBeUndefined();
    expect(clean.lng).toBeUndefined();
    expect(clean.phone).toBeUndefined();
    expect(clean.payment).toBeUndefined();
    expect(clean.otp).toBeUndefined();
    expect(clean.nickname).toBeUndefined();
  });

  it("track is a safe no-op", () => {
    expect(() => track("location_search", { lat: 1, q: "hyderabad" })).not.toThrow();
  });
});
