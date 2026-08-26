import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityLanding } from "@/components/content/CityLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { listPublicStations } from "@/lib/catalogue/station-service";
import { getPublicCityBySlug } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/release/overrides";
import { isValidStationRouteParam } from "@/lib/geo";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { pageMeta } from "@/lib/metadata";
import { breadcrumbListJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ city: string }>;
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
  const { city: raw } = await params;
  const slug = decodeParam(raw);
  if (!isValidStationRouteParam(slug)) notFound();
  const city = await getPublicCityBySlug(slug);
  if (!city) notFound();
  return pageMeta({
    title: city.seoTitle || `EV charging in ${city.cityName}`,
    description:
      city.seoDescription ||
      `${city.intro.slice(0, 150)} Published Plug and Go stations in ${city.cityName}, ${city.stateName}.`,
    path: `/ev-charging/${city.slug}`,
  });
}

export default async function CityChargingPage({ params }: PageProps) {
  if (!isDatabaseConfigured() || !(await isFeatureEnabled("publishedCityRouteContent"))) notFound();
  const slug = decodeParam((await params).city);
  if (!isValidStationRouteParam(slug)) notFound();
  const city = await getPublicCityBySlug(slug);
  if (!city) notFound();

  const listed = await listPublicStations({
    page: 1,
    pageSize: 50,
    city: city.cityName,
  });

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Find a charger", path: "/find-charger" },
    { name: city.cityName, path: `/ev-charging/${city.slug}` },
  ];
  const faqSchema = faqPageJsonLd(city.faqs);

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <ViewTracker event={ANALYTICS_EVENTS.city_page_viewed} payload={{ city: city.slug }} />
      <CityLanding city={city} stations={listed.stations} />
    </div>
  );
}
