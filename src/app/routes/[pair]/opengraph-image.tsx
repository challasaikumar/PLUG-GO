import { notFound } from "next/navigation";
import { getPublicRouteBySlug } from "@/lib/content/editorial";
import { parseRoutePairParam } from "@/lib/content/paths";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go route charging guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image({ params }: { params: Promise<{ pair: string }> }) {
  if (!isDatabaseConfigured()) notFound();
  const pair = (await params).pair;
  if (!parseRoutePairParam(pair)) notFound();
  const route = await getPublicRouteBySlug(pair);
  if (!route) notFound();
  return ogImageResponse({
    kicker: "Route charging plan",
    title: `${route.originName} to ${route.destinationName}`,
    fact: `${route.stops.length} published stop${route.stops.length === 1 ? "" : "s"}`,
  });
}
