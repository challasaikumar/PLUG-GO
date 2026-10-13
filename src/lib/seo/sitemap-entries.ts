import type { MetadataRoute } from "next";
import { publicRoutes } from "@/content/siteConfig";
import { canonicalUrl } from "@/lib/env";

export type SitemapPathEntry = {
  path: string;
  lastModified?: Date;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const DISALLOWED_PREFIXES = [
  "/admin",
  "/api",
  "/design-system",
  "/account",
  "/vehicles",
  "/saved-stations",
  "/login",
  "/scan",
  "/offline",
  "/bookings",
  "/payments",
  "/invoices",
  "/session",
  "/ops",
  "/technician",
  "/partner",
  "/fleet",
  "/status",
];

export function isSitemapEligiblePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("?")) return false;
  if (path.includes("#")) return false;
  return !DISALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function sitemapCadence(path: string): Pick<SitemapPathEntry, "changeFrequency" | "priority"> {
  if (path === "/") return { changeFrequency: "weekly", priority: 1 };
  if (path === "/find-charger") return { changeFrequency: "daily", priority: 0.9 };
  if (path === "/contact" || path === "/gallery" || path === "/blogs") {
    return { changeFrequency: "weekly", priority: 0.85 };
  }
  if (path === "/how-to-charge" || path === "/connector-guide") {
    return { changeFrequency: "monthly", priority: 0.8 };
  }
  return { changeFrequency: "monthly", priority: 0.7 };
}

export function staticPublicSitemapEntries(now = new Date()): SitemapPathEntry[] {
  return publicRoutes.filter(isSitemapEligiblePath).map((path) => ({
    path,
    lastModified: now,
    ...sitemapCadence(path),
  }));
}

export async function collectSitemapEntries(now = new Date()): Promise<SitemapPathEntry[]> {
  return staticPublicSitemapEntries(now).filter((entry) => isSitemapEligiblePath(entry.path));
}

export function toMetadataSitemap(entries: SitemapPathEntry[]): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: canonicalUrl(entry.path),
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
