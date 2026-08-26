import { notFound } from "next/navigation";
import { getPublicStationBySlug } from "@/lib/catalogue/station-service";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isValidStationRouteParam } from "@/lib/geo";
import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go charging station";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image({
  params,
}: {
  params: Promise<{ state: string; city: string; "station-slug": string }>;
}) {
  if (!isDatabaseConfigured()) notFound();
  const slug = (await params)["station-slug"];
  if (!isValidStationRouteParam(slug)) notFound();
  const station = await getPublicStationBySlug(slug);
  if (!station) notFound();
  return ogImageResponse({
    kicker: `${station.city}, ${station.state}`,
    title: station.name,
    fact: "Published Plug and Go station",
  });
}
