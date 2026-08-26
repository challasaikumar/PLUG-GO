/**
 * Alert catalogue. Every alert has an owner role and a response instruction.
 * Do not create pages, tickets, or vendor incidents from this file automatically.
 */

export const ALERT_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export type AlertDefinition = {
  id: string;
  name: string;
  severity: AlertSeverity;
  owner: string;
  condition: string;
  response: string;
};

export const ALERT_CATALOGUE: AlertDefinition[] = [
  {
    id: "remote-control-safety",
    name: "Production remote-control safety",
    severity: "critical",
    owner: "Network operations lead",
    condition: "FLAG_PRODUCTION_REMOTE_CHARGING is true, or a production charger accepts a remote command, or unauthorized command volume > 0.",
    response:
      "Disable FLAG_PRODUCTION_REMOTE_CHARGING and OCPP_REMOTE_COMMANDS_ENABLED. Stop CSMS command dispatch. Reconcile sessions. Do not send further RemoteStart/Stop until the incident owner approves.",
  },
  {
    id: "payment-webhook-corruption",
    name: "Payment or webhook corruption",
    severity: "critical",
    owner: "Finance operations lead",
    condition: "Webhook signature failure rate > 5% in 10 minutes, duplicate unhandled events, or booking confirmed without a verified payment.",
    response:
      "Disable FLAG_PAYMENT_CHECKOUT and FLAG_BOOKING. Do not capture or refund from the website. Reconcile PaymentAttempt rows against the provider dashboard. Customer money movement stays with finance.",
  },
  {
    id: "major-outage",
    name: "Major web or database outage",
    severity: "critical",
    owner: "Platform on-call",
    condition: "Ready health failing, 5xx rate > 10% for 5 minutes, or database check error.",
    response:
      "Fail closed: keep payments, OTP, and remote charging disabled if dependencies are unknown. Publish /status if the flag is on. Restore from the last verified backup only with an explicit restore approval.",
  },
  {
    id: "station-network-offline",
    name: "Station network offline",
    severity: "high",
    owner: "Network operations lead",
    condition: "Offline or stale connector rate > 25% of published connectors for 15 minutes.",
    response:
      "Do not map stale/unknown to Available. Open incidents for affected stations. Tell support to quote Unknown/Stale, not Available.",
  },
  {
    id: "command-failures",
    name: "Repeated remote command failures",
    severity: "high",
    owner: "CSMS engineer",
    condition: "Remote command timeout or reject rate > 20% in 15 minutes on a pilot charger.",
    response:
      "Disable FLAG_PILOT_REMOTE_CHARGING if safety is unclear. Leave the connector in an honest pending/failed state. Reconcile CSMS sessions before retrying.",
  },
  {
    id: "otp-outage",
    name: "OTP or SMS provider outage",
    severity: "high",
    owner: "Identity on-call",
    condition: "SMS delivery errors > 10 in 10 minutes, or OTP request 503 rate elevated.",
    response: "Keep FLAG_DRIVER_OTP as configured. Do not invent codes. Show the existing unavailable message. Drivers can still search.",
  },
  {
    id: "payment-provider-outage",
    name: "Payment provider outage",
    severity: "high",
    owner: "Finance operations lead",
    condition: "Checkout create failures or webhook downtime > 10 minutes.",
    response: "Disable FLAG_PAYMENT_CHECKOUT. Holds expire. Do not treat browser return as success.",
  },
  {
    id: "stale-data-growth",
    name: "Stale availability growth",
    severity: "medium",
    owner: "Network operations lead",
    condition: "Stale connector share grows > 10 percentage points day over day.",
    response: "Investigate heartbeats and freshness minutes. Keep public status as Stale. Do not hide the station.",
  },
  {
    id: "support-backlog",
    name: "Support backlog",
    severity: "medium",
    owner: "Support lead",
    condition: "Open support issues older than the published SLA, or unassigned critical incidents > 1 hour.",
    response: "Assign an incident owner. Escalate using the published support route. Do not invent a phone number.",
  },
  {
    id: "integration-errors",
    name: "Non-critical integration errors",
    severity: "medium",
    owner: "Platform on-call",
    condition: "Enquiry webhook, observability webhook, or map tile errors without user-data loss.",
    response: "Log and repair the integration. Public search should keep working with degraded maps or forms.",
  },
  {
    id: "seo-metadata",
    name: "Content or SEO metadata issues",
    severity: "low",
    owner: "Content lead",
    condition: "Missing unique title/H1, empty city page published, or sitemap including a private path.",
    response: "Unpublish empty city/route pages. Fix metadata. Do not ship fake reviews or invented tariffs.",
  },
];

export function alertsMissingOwners(): AlertDefinition[] {
  return ALERT_CATALOGUE.filter((row) => !row.owner.trim() || !row.response.trim());
}
