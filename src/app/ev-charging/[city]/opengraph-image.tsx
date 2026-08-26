import { notFound } from "next/navigation";
import { getPublicCityBySlug } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isValidStationRouteParam } from "@/lib/geo";
import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go city charging guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  if (!isDatabaseConfigured()) notFound();
  const slug = (await params).city;
  if (!isValidStationRouteParam(slug)) notFound();
  const city = await getPublicCityBySlug(slug);
  if (!city) notFound();
  return ogImageResponse({
    kicker: `${city.cityName}, ${city.stateName}`,
    title: `EV charging in ${city.cityName}`,
    fact: `${city.stationCount} published station${city.stationCount === 1 ? "" : "s"}`,
  });
}
