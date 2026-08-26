import { notFound } from "next/navigation";
import { InsightArticleView } from "@/components/content/InsightArticleView";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getPublicStationBySlug } from "@/lib/catalogue/station-service";
import { getAdminInsightBySlug } from "@/lib/content/editorial";
import { isAllowedGuideHref } from "@/lib/content/paths";
import { stationCanonicalPath } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function PreviewInsightPage({ params }: { params: Promise<{ slug: string }> }) {
  requireStaffRole(ROLE_MATRIX.readCatalogue);
  const { slug } = await params;
  const article = await getAdminInsightBySlug(slug);
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

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <InsightArticleView
        preview
        article={{
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          authorName: article.author?.displayName ?? null,
          authorRole: article.author?.roleTitle ?? null,
          reviewerName: article.reviewer?.displayName ?? null,
          publishedAt: article.publishedAt,
          lastReviewedAt: article.lastReviewedAt,
          faqs: article.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
          relatedGuideHrefs: article.relatedGuideHrefs.filter((href) => isAllowedGuideHref(href)),
          relatedCitySlug: article.relatedCitySlug,
          relatedStations,
        }}
      />
    </div>
  );
}
