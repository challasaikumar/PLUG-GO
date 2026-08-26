/**
 * Consent-aware analytics abstraction.
 * `track()` is a no-op until a consent policy and vendor exist.
 * Payloads must not include precise location, phone, or payment fields.
 */

export const ANALYTICS_EVENTS = {
  location_search: "location_search",
  filter_applied: "filter_applied",
  station_viewed: "station_viewed",
  directions_clicked: "directions_clicked",
  guide_viewed: "guide_viewed",
  city_page_viewed: "city_page_viewed",
  route_page_viewed: "route_page_viewed",
  lead_started: "lead_started",
  lead_qualified: "lead_qualified",
  support_opened: "support_opened",
  ticket_created: "ticket_created",
  host_lead_started: "host_lead_started",
  host_lead_qualified: "host_lead_qualified",
  fleet_lead_started: "fleet_lead_started",
  workplace_lead_started: "workplace_lead_started",
  otp_requested: "otp_requested",
  otp_verified: "otp_verified",
  signup_completed: "signup_completed",
  vehicle_added: "vehicle_added",
  station_saved: "station_saved",
  privacy_export_requested: "privacy_export_requested",
  deletion_requested: "deletion_requested",
  pwa_install_prompt_shown: "pwa_install_prompt_shown",
  pwa_installed: "pwa_installed",
  booking_started: "booking_started",
  booking_hold_created: "booking_hold_created",
  payment_started: "payment_started",
  payment_processing: "payment_processing",
  payment_succeeded: "payment_succeeded",
  payment_failed: "payment_failed",
  booking_confirmed: "booking_confirmed",
  booking_cancelled: "booking_cancelled",
  refund_requested: "refund_requested",
  refund_completed: "refund_completed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

const FORBIDDEN_KEY =
  /^(lat|lng|latitude|longitude|phone|mobile|msisdn|payment|card|pan|cvv|otp|code|token|precise_?location|registration|nickname)$/i;

export function sanitizeAnalyticsPayload(payload?: AnalyticsPayload): AnalyticsPayload {
  if (!payload) return {};
  const clean: AnalyticsPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_KEY.test(key)) continue;
    clean[key] = value;
  }
  return clean;
}

export function track(
  event: AnalyticsEventName,
  payload?: AnalyticsPayload,
): void {
  const safe = sanitizeAnalyticsPayload(payload);
  // Intentionally empty until a consent policy and vendor exist.
  void event;
  void safe;
}
