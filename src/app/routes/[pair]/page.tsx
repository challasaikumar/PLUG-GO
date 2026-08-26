import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteGuideView } from "@/components/content/RouteGuideView";
import { JsonLd } from "@/components/seo/JsonLd";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { getPublicRouteBySlug } from "@/lib/content/editorial";
import { parseRoutePairParam } from "@/lib/content/paths";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/release/overrides";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { pageMeta } from "@/lib/metadata";
import { breadcrumbListJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ pair: string }>;
};

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isDatabaseConfigured() || !(await isFeatureEnabled("publishedCityRouteContent"))) notFound();
  const pair = decodeParam((await params).pair);
  if (!parseRoutePairParam(pair)) notFound();
  const route = await getPublicRouteBySlug(pair);
  if (!route) notFound();
  return pageMeta({
    title: route.seoTitle || `${route.originName} to ${route.destinationName} charging`,
    description:
      route.seoDescription ||
      `A researched Plug and Go charging plan from ${route.originName} to ${route.destinationName}.`,
    path: `/routes/${route.slug}`,
  });
}

export default async function RouteGuidePage({ params }: PageProps) {
  if (!isDatabaseConfigured() || !(await isFeatureEnabled("publishedCityRouteContent"))) notFound();
  const pair = decodeParam((await params).pair);
  if (!parseRoutePairParam(pair)) notFound();
  const route = await getPublicRouteBySlug(pair);
  if (!route) notFound();

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Find a charger", path: "/find-charger" },
    { name: `${route.originName} to ${route.destinationName}`, path: `/routes/${route.slug}` },
  ];
  const faqSchema = faqPageJsonLd(route.faqs);

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <ViewTracker
        event={ANALYTICS_EVENTS.route_page_viewed}
        payload={{ route: route.slug }}
      />
      <RouteGuideView route={route} />
    </div>
  );
}
