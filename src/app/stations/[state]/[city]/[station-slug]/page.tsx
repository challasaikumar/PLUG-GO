import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { StationDetail } from "@/components/stations/StationDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { siteConfig } from "@/content/siteConfig";
import {
  estimatePublicTariff,
  getPublicStationBySlug,
  listNearbyPublicStations,
} from "@/lib/catalogue/station-service";
import { getPublishedCityHrefForCityName } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { pageMeta } from "@/lib/metadata";
import { isCanonicalStationPath, isValidStationRouteParam, stationCanonicalPath } from "@/lib/geo";
import { accessTypeLabel, connectorTypeLabel } from "@/lib/catalogue/labels";
import { stationJsonLd } from "@/lib/seo/station-jsonld";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { stationFaqs } from "@/lib/stations/faqs";
import { faqPageJsonLd } from "@/lib/seo/jsonld";
import { SaveStationButton } from "@/components/account/SaveStationButton";
import { isStationSaved } from "@/lib/account/saved-stations";
import { getOptionalDriver } from "@/lib/auth/driver";
import { getStationBookingOffer } from "@/lib/booking/offer";
import { getPilotChargeOffer } from "@/lib/ocpp/queries";
import { publicLiveUpdatesEnabled } from "@/lib/ocpp/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ state: string; city: string; "station-slug": string }>;
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
  const resolved = await params;
  const slug = decodeParam(resolved["station-slug"]);
  if (!isValidStationRouteParam(slug)) notFound();
  const station = await getPublicStationBySlug(slug);
  if (!station) notFound();
  const connectors = Array.from(
    new Set(station.connectors.map((connector) => connectorTypeLabel(connector.connectorType))),
  );
  const description = [
    `${station.name} in ${station.city}, ${station.state}.`,
    connectors.length ? `Connectors: ${connectors.join(", ")}.` : null,
    `Access: ${accessTypeLabel(station.access.type)}.`,
    station.access.hoursSummary,
    station.tariff ? "Approved tariff estimate on this page." : "Price not published.",
  ]
    .filter(Boolean)
    .join(" ");

  return pageMeta({
    title: station.name,
    description,
    path: stationCanonicalPath(station),
  });
}

export default async function StationPage({ params }: PageProps) {
  if (!isDatabaseConfigured()) notFound();
  const resolved = await params;
  const state = decodeParam(resolved.state);
  const cityParam = decodeParam(resolved.city);
  const slug = decodeParam(resolved["station-slug"]);

  if (
    !isValidStationRouteParam(state) ||
    !isValidStationRouteParam(cityParam) ||
    !isValidStationRouteParam(slug)
  ) {
    notFound();
  }

  const station = await getPublicStationBySlug(slug);
  if (!station) notFound();

  if (!isCanonicalStationPath({ state, city: cityParam, slug }, station)) {
    permanentRedirect(stationCanonicalPath(station));
  }

  const estimateResult = await estimatePublicTariff(slug, { energyKwhMilli: 10_000 });
  const estimate = estimateResult.ok ? estimateResult.estimate : null;
  const nearby = await listNearbyPublicStations({
    slug: station.slug,
    latitude: station.latitude,
    longitude: station.longitude,
    connectorTypes: station.connectors.map((connector) => connector.connectorType),
  });
  const cityPage = await getPublishedCityHrefForCityName(station.city);
  const driver = await getOptionalDriver();
  const saved = driver ? await isStationSaved(driver.id, station.slug) : false;
  const bookingOffer = await getStationBookingOffer({
    stationSlug: station.slug,
    authenticated: Boolean(driver),
  });
  const pilotOffer = await getPilotChargeOffer({
    stationSlug: station.slug,
    driverId: driver?.id ?? null,
  });
  const href = stationCanonicalPath(station);
  const jsonLd = stationJsonLd(station, cityPage ? { name: cityPage.cityName, path: cityPage.href } : null);
  const faqs = stationFaqs(station);
  const faqSchema = faqPageJsonLd(
    faqs.flatMap((item) => (typeof item.answer === "string" ? [{ question: item.question, answer: item.answer }] : [])),
  );

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <JsonLd data={jsonLd} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <ViewTracker event={ANALYTICS_EVENTS.station_viewed} payload={{ station_slug: station.slug }} />
      <StationDetail
        station={station}
        estimate={estimate}
        nearby={nearby}
        cityHref={cityPage?.href}
        saveAction={
          <SaveStationButton
            slug={station.slug}
            returnPath={href}
            signedIn={Boolean(driver)}
            initiallySaved={saved}
          />
        }
        bookingOffer={bookingOffer}
        stationPath={href}
        liveUpdatesEnabled={publicLiveUpdatesEnabled()}
        pilotOffer={pilotOffer.show ? { show: true, connectors: pilotOffer.connectors } : { show: false }}
      />
      <p className="type-caption" style={{ marginTop: 32, color: "var(--color-text-tertiary)" }}>
        {siteConfig.name} publishes only approved station facts. A website reservation appears only when a current
        booking policy can be honoured. Remote start appears only for authorised Test/Pilot drivers and connectors.
        A protocol response is never a charging invoice.
      </p>
    </div>
  );
}
