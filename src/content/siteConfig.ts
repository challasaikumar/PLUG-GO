/**
 * Central Plug and Go site configuration.
 * Empty strings / null mean “not published yet” — never invent values.
 * Runtime enablement is `src/lib/release/flags.ts`. The object below is not a feature switch.
 */

export const siteConfig = {
  name: "Plug and Go",
  promise:
    "Find a compatible charger. Know the price. Charge with confidence.",
  locale: "en-IN",
  featureFlags: {
    finderLive: false,
    liveAvailability: false,
    payments: false,
    accounts: false,
  },
  identity: {
    legalEntity: null as string | null,
    registeredAddress: null as string | null,
    gstin: null as string | null,
    brandTagline: "India-focused EV charging network",
  },
  contact: {
    supportEmail: null as string | null,
    supportPhone: null as string | null,
    supportHours: null as string | null,
    grievanceName: null as string | null,
    grievanceEmail: null as string | null,
    grievancePhone: null as string | null,
  },
  social: {
    // Publish only when a real, approved profile exists.
    twitter: null as string | null,
    linkedin: null as string | null,
    instagram: null as string | null,
    facebook: null as string | null,
    youtube: null as string | null,
  },
  apps: {
    // Publish only when a real Plug and Go listing exists. Do not invent store URLs.
    playStore: null as string | null,
    appStore: null as string | null,
  },
  legal: {
    policyVersion: "draft-0",
    effectiveDate: null as string | null,
    draftNotice:
      "This page is a structured draft for legal and business review. It is not a final policy until the legal entity, contacts, and counsel approval are confirmed.",
  },
} as const;

export const navigation = {
  primary: [
    { href: "/find-charger", label: "Find a charger" },
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/host-a-charger", label: "Host a charger" },
    { href: "/support", label: "Support" },
    { href: "/contact", label: "Contact" },
  ],
  solutions: [
    { href: "/solutions/fleets", label: "Fleets" },
    { href: "/solutions/workplace", label: "Workplace" },
    { href: "/host-a-charger", label: "Host a charger" },
  ],
  help: [
    { href: "/how-to-charge", label: "How to charge" },
    { href: "/support", label: "Support" },
    { href: "/safety", label: "Safety" },
    { href: "/contact", label: "Contact" },
  ],
  footer: {
    drivers: [
      { href: "/find-charger", label: "Find a charger" },
      { href: "/how-to-charge", label: "How to charge" },
      { href: "/connector-guide", label: "Connector guide" },
      { href: "/pricing", label: "Pricing" },
      { href: "/insights", label: "Insights" },
      { href: "/support", label: "Support" },
      { href: "/safety", label: "Safety" },
      { href: "/account", label: "Account" },
    ],
    company: [
      { href: "/about", label: "About Us" },
      { href: "/host-a-charger", label: "Host a charger" },
      { href: "/solutions/fleets", label: "Fleets" },
      { href: "/solutions/workplace", label: "Workplace" },
      { href: "/find-charger", label: "Locate charger" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
    ],
    support: [
      { href: "/how-to-charge", label: "How to charge" },
      { href: "/support", label: "Support" },
      { href: "/safety", label: "Safety" },
      { href: "/insights", label: "Insights" },
      { href: "/contact", label: "Contact us" },
    ],
    legal: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/account/privacy", label: "Privacy centre" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/refunds", label: "Refunds" },
      { href: "/legal/grievance", label: "Grievance" },
      { href: "/legal/accessibility", label: "Accessibility" },
    ],
  },
} as const;

export const publicRoutes = [
  "/",
  "/find-charger",
  "/how-to-charge",
  "/connector-guide",
  "/insights",
  "/about",
  "/contact",
  "/support",
  "/safety",
  "/pricing",
  "/solutions/fleets",
  "/solutions/workplace",
  "/host-a-charger",
  "/legal/privacy",
  "/legal/terms",
  "/legal/refunds",
  "/legal/accessibility",
  "/legal/grievance",
] as const;

export function unpublished(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not published yet";
}

export function hasPublished(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}
