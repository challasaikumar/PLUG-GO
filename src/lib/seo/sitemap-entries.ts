import type { MetadataRoute } from "next";
import { publicRoutes } from "@/content/siteConfig";
import { listPublishedStationPaths } from "@/lib/catalogue/station-service";
import { listEditorialSitemapEntries } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { canonicalUrl } from "@/lib/env";
import { isFeatureEnabled } from "@/lib/release/overrides";

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

export function staticPublicSitemapEntries(now = new Date()): SitemapPathEntry[] {
  return publicRoutes.filter(isSitemapEligiblePath).map((path) => ({
    path,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : path === "/find-charger" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/find-charger" ? 0.9 : 0.7,
  }));
}

export async function collectSitemapEntries(now = new Date()): Promise<SitemapPathEntry[]> {
  const includeFinder = await isFeatureEnabled("publicStationFinder");
  const includeEditorial = await isFeatureEnabled("publishedCityRouteContent");
  const entries = staticPublicSitemapEntries(now).filter((entry) => {
    if (entry.path === "/find-charger" && !includeFinder) return false;
    return true;
  });
  if (!isDatabaseConfigured()) return entries.filter((entry) => isSitemapEligiblePath(entry.path));

  try {
    const [stations, editorial] = await Promise.all([
      includeFinder ? listPublishedStationPaths() : Promise.resolve([]),
      listEditorialSitemapEntries(),
    ]);
    for (const station of stations) {
      if (isSitemapEligiblePath(station.path)) {
        entries.push({
          path: station.path,
          lastModified: station.lastModified,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    }
    if (includeEditorial) {
      for (const city of editorial.cities) {
        if (isSitemapEligiblePath(city.path)) {
          entries.push({
            path: city.path,
            lastModified: city.lastModified,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
      for (const route of editorial.routes) {
        if (isSitemapEligiblePath(route.path)) {
          entries.push({
            path: route.path,
            lastModified: route.lastModified,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
    for (const insight of editorial.insights) {
      if (isSitemapEligiblePath(insight.path)) {
        entries.push({
          path: insight.path,
          lastModified: insight.lastModified,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    return entries.filter((entry) => isSitemapEligiblePath(entry.path));
  }

  return entries.filter((entry) => isSitemapEligiblePath(entry.path));
}

export function toMetadataSitemap(entries: SitemapPathEntry[]): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: canonicalUrl(entry.path),
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
