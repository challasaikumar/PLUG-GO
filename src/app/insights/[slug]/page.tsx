import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightArticleView } from "@/components/content/InsightArticleView";
import { JsonLd } from "@/components/seo/JsonLd";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { getPublicStationBySlug } from "@/lib/catalogue/station-service";
import { getPublicInsightBySlug } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isValidStationRouteParam, stationCanonicalPath } from "@/lib/geo";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { pageMeta } from "@/lib/metadata";
import { articleJsonLd, breadcrumbListJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isDatabaseConfigured()) notFound();
  const slug = decodeParam((await params).slug);
  if (!isValidStationRouteParam(slug, 96)) notFound();
  const article = await getPublicInsightBySlug(slug);
  if (!article) notFound();
  return pageMeta({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    path: `/insights/${article.slug}`,
  });
}

export default async function InsightArticlePage({ params }: PageProps) {
  if (!isDatabaseConfigured()) notFound();
  const slug = decodeParam((await params).slug);
  if (!isValidStationRouteParam(slug, 96)) notFound();
  const article = await getPublicInsightBySlug(slug);
  if (!article) notFound();

  const relatedStations = [];
  for (const stationSlug of article.relatedStationSlugs) {
    const station = await getPublicStationBySlug(stationSlug);
    if (!station) continue;
    relatedStations.push({
      href: stationCanonicalPath(station),
      name: station.name,
      city: station.city,
    });
  }

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Insights", path: "/insights" },
    { name: article.title, path: `/insights/${article.slug}` },
  ];
  const faqSchema = faqPageJsonLd(article.faqs);

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <JsonLd
        data={articleJsonLd({
          headline: article.title,
          description: article.excerpt,
          path: `/insights/${article.slug}`,
          datePublished: article.publishedAt,
          dateModified: article.lastReviewedAt ?? article.updatedAt,
          authorName: article.authorName,
        })}
      />
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <ViewTracker event={ANALYTICS_EVENTS.guide_viewed} payload={{ guide: `insight:${article.slug}` }} />
      <InsightArticleView article={{ ...article, relatedStations }} />
    </div>
  );
}
