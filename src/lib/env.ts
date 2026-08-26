/**
 * Environment handling for Plug and Go.
 * Secrets must never be NEXT_PUBLIC_*. Validate in one place.
 */

import { getPngEnv } from "@/lib/release/env";

const LOCAL_FALLBACK = "http://localhost:3000";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return stripTrailingSlash(raw);
  }
  if (getPngEnv() === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required when PNG_ENV=production. Canonical URLs must not use localhost.");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[env] NEXT_PUBLIC_SITE_URL is not set. Canonical URLs will use localhost until it is configured.",
    );
  }
  return LOCAL_FALLBACK;
}

export function canonicalUrl(path = "/"): string {
  const base = getSiteUrl();
  if (path === "/" || path === "") {
    return `${base}/`;
  }
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalised}`;
}

/** Names reserved for later phases — do not read as if configured. */
export const LATER_ENV_KEYS = [
  "MAPS_API_KEY",
  "CRM_WEBHOOK_URL",
  "ANALYTICS_WRITE_KEY",
] as const;
