import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const DISALLOW = [
  "/design-system",
  "/design-system/",
  "/admin",
  "/admin/",
  "/api/",
  "/api",
  "/account",
  "/account/",
  "/vehicles",
  "/vehicles/",
  "/saved-stations",
  "/saved-stations/",
  "/login",
  "/login/",
  "/scan",
  "/scan/",
  "/offline",
  "/bookings",
  "/bookings/",
  "/payments",
  "/payments/",
  "/invoices",
  "/invoices/",
  "/session",
  "/session/",
  "/ops",
  "/ops/",
  "/technician",
  "/technician/",
  "/partner",
  "/partner/",
  "/fleet",
  "/fleet/",
  "/status",
  "/status/",
];

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "Anthropic-AI",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
