import { notFound } from "next/navigation";
import { getPublicInsightBySlug } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isValidStationRouteParam } from "@/lib/geo";
import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go insight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  if (!isDatabaseConfigured()) notFound();
  const slug = (await params).slug;
  if (!isValidStationRouteParam(slug, 96)) notFound();
  const article = await getPublicInsightBySlug(slug);
  if (!article) notFound();
  return ogImageResponse({
    kicker: "Insights",
    title: article.title,
    fact: article.authorName ? `By ${article.authorName}` : "Reviewed editorial",
  });
}
