/**
 * Central Voltran site configuration.
 * Empty strings / null mean “not published yet” — never invent values.
 * Runtime enablement is `src/lib/release/flags.ts`. The object below is not a feature switch.
 */

export const siteConfig = {
  name: "PLUG & GO",
  promise: "Most reliable EV charging network in India",
  locale: "en-IN",
  featureFlags: {
    finderLive: false,
    liveAvailability: false,
    payments: false,
    accounts: false,
  },
  identity: {
    legalEntity: "PLUG & GO" as string | null,
    registeredAddress: "7-50/1, 3rd Floor, GNR Heights, Ramavarappadu, Vijayawada, Andhra Pradesh - 521108" as
      | string
      | null,
    gstin: null as string | null,
    brandTagline: "Hub Model, Multiple DC Fast Chargers, Manned, Open 24x7, Cafeteria & Clean Washroom Facility",
  },
  contact: {
    supportEmail: "info@plugandgo.in" as string | null,
    supportPhone: "+91 85559 66678" as string | null,
    supportHours: "Open 24x7" as string | null,
    grievanceName: null as string | null,
    grievanceEmail: null as string | null,
    grievancePhone: null as string | null,
  },
  social: {
    twitter: null as string | null,
    linkedin: null as string | null,
    instagram: null as string | null,
    facebook: null as string | null,
    youtube: null as string | null,
  },
  apps: {
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
    { href: "/", label: "Home" },
    { href: "/#team", label: "Team" },
    { href: "/#app", label: "Mobile App" },
    { href: "/#locations", label: "Locations" },
    { href: "/gallery", label: "Gallery" },
    { href: "/blogs", label: "Blogs" },
    { href: "/contact", label: "Contact" },
  ],
  solutions: [
    { href: "/#locations", label: "Locations" },
    { href: "/contact", label: "Contact" },
  ],
  help: [
    { href: "/gallery", label: "Gallery" },
    { href: "/blogs", label: "Blogs" },
    { href: "/contact", label: "Contact" },
  ],
  footer: {
    drivers: [
      { href: "/#locations", label: "Locations" },
      { href: "/gallery", label: "Gallery" },
      { href: "/#app", label: "Mobile App" },
      { href: "/blogs", label: "Blogs" },
      { href: "/contact", label: "Contact" },
    ],
    company: [
      { href: "/#team", label: "Team" },
      { href: "/#app", label: "Mobile App" },
      { href: "/#locations", label: "Locations" },
      { href: "/gallery", label: "Gallery" },
      { href: "/blogs", label: "Blogs" },
      { href: "/contact", label: "Contact Us" },
    ],
    support: [
      { href: "/contact", label: "Contact us" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms and Conditions" },
    ],
    legal: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms and Conditions" },
    ],
  },
} as const;

export const publicRoutes = [
  "/",
  "/find-charger",
  "/how-to-charge",
  "/connector-guide",
  "/insights",
  "/blogs",
  "/gallery",
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
