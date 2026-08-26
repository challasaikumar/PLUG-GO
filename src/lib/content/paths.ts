export const ALLOWED_RELATED_GUIDES = [
  "/how-to-charge",
  "/connector-guide",
  "/pricing",
  "/safety",
  "/find-charger",
  "/support",
] as const;

export type AllowedRelatedGuide = (typeof ALLOWED_RELATED_GUIDES)[number];

export function cityLandingPath(slug: string): string {
  return `/ev-charging/${slug}`;
}

export function insightPath(slug: string): string {
  return `/insights/${slug}`;
}

export function routeGuidePath(slug: string): string {
  return `/routes/${slug}`;
}

export function routePairSlug(originSlug: string, destinationSlug: string): string {
  return `${originSlug}-to-${destinationSlug}`;
}

const ROUTE_PAIR = /^([a-z0-9]+(?:-[a-z0-9]+)*)-to-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function parseRoutePairParam(pair: string): { origin: string; destination: string } | null {
  const match = ROUTE_PAIR.exec(pair);
  if (!match) return null;
  return { origin: match[1], destination: match[2] };
}

export function isAllowedGuideHref(href: string): href is AllowedRelatedGuide {
  return (ALLOWED_RELATED_GUIDES as readonly string[]).includes(href);
}
