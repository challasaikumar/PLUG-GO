import Link from "next/link";
import { ContentBreadcrumbs, ReviewedNote } from "@/components/content/ContentChrome";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { StationCard } from "@/components/ui/StationCard";
import { listItemToCard } from "@/components/finder/listItemToCard";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import { connectorTypeLabel } from "@/lib/catalogue/labels";

type CityView = {
  slug: string;
  cityName: string;
  stateName: string;
  intro: string;
  accessGuidance: string;
  connectorGuidance: string;
  localNotes?: string | null;
  showFleetModule: boolean;
  lastReviewedAt?: Date | string | null;
  reviewerName?: string | null;
  faqs: Array<{ question: string; answer: string }>;
  stationCount: number;
};

export function CityLanding({
  city,
  stations,
  preview = false,
}: {
  city: CityView;
  stations: PublicStationListItem[];
  preview?: boolean;
}) {
  const connectorLabels = Array.from(
    new Set(
      stations.flatMap((station) =>
        station.connectors.map((connector) => connectorTypeLabel(connector.connectorType)),
      ),
    ),
  );
  const finderHref = `/find-charger?city=${encodeURIComponent(city.cityName)}`;

  return (
    <article className="content-article">
      {preview ? (
        <p className="type-caption admin-preview-banner">Staff preview — this page is not public.</p>
      ) : null}
      <ContentBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Find a charger", path: "/find-charger" },
          { name: city.cityName, path: `/ev-charging/${city.slug}` },
        ]}
      />
      <header className="page-intro" style={{ paddingTop: 0 }}>
        <p className="type-caption" style={{ color: "var(--color-action-primary)", margin: "0 0 12px" }}>
          EV charging in {city.stateName}
        </p>
        <h1 className="type-h1" style={{ margin: "0 0 16px" }}>
          EV charging in {city.cityName}
        </h1>
        <p className="type-body-lg" style={{ margin: "0 0 16px", maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
          {city.intro}
        </p>
        <ReviewedNote reviewedAt={city.lastReviewedAt} reviewerName={city.reviewerName} />
        <div className="content-cta-row">
          <Button href={finderHref}>Find chargers in {city.cityName}</Button>
          <Button href="/how-to-charge" variant="outline">
            How to charge
          </Button>
        </div>
      </header>

      <section className="page-section" aria-labelledby="city-stations-heading">
        <h2 id="city-stations-heading" className="type-h2">
          Published Plug and Go stations
        </h2>
        <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
          {city.stationCount} published station{city.stationCount === 1 ? "" : "s"} in {city.cityName}. These are
          catalogue records, not a live occupancy feed.
        </p>
        <div className="station-nearby-grid">
          {stations.map((station) => (
            <StationCard key={station.stationId} station={listItemToCard(station)} compact />
          ))}
        </div>
      </section>

      <section className="page-section" aria-labelledby="city-access-heading">
        <h2 id="city-access-heading" className="type-h2">
          Access and local charging notes
        </h2>
        <p className="type-body" style={{ color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
          {city.accessGuidance}
        </p>
        {city.localNotes ? (
          <p className="type-body" style={{ marginTop: 16, maxWidth: "40rem" }}>
            {city.localNotes}
          </p>
        ) : null}
      </section>

      <section className="page-section" aria-labelledby="city-connectors-heading">
        <h2 id="city-connectors-heading" className="type-h2">
          Connectors in this city
        </h2>
        <p className="type-body" style={{ color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
          {city.connectorGuidance}
        </p>
        {connectorLabels.length ? (
          <p className="type-small" style={{ marginTop: 12, color: "var(--color-text-tertiary)" }}>
            Recorded on published stations: {connectorLabels.join(", ")}. See the{" "}
            <Link className="png-link" href="/connector-guide">
              connector guide
            </Link>{" "}
            for AC/DC and kW caveats.
          </p>
        ) : null}
      </section>

      {city.showFleetModule ? (
        <section className="page-section paper-card" style={{ padding: 32 }} aria-labelledby="city-fleet-heading">
          <h2 id="city-fleet-heading" className="type-h2">
            Fleets and hosts in {city.cityName}
          </h2>
          <p className="type-body" style={{ color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
            If you run vehicles or a parking site here, start a conversation. We will not quote coverage, uptime, or
            rates that are not approved.
          </p>
          <div className="content-cta-row">
            <Button href="/solutions/fleets" variant="outline">
              Fleet charging
            </Button>
            <Button href="/host-a-charger" variant="secondary">
              Host a charger
            </Button>
          </div>
        </section>
      ) : null}

      {city.faqs.length ? (
        <section className="page-section" aria-labelledby="city-faq-heading">
          <h2 id="city-faq-heading" className="type-h2">
            {city.cityName} charging questions
          </h2>
          <Accordion
            items={city.faqs.map((faq, index) => ({
              id: `city-faq-${index}`,
              question: faq.question,
              answer: faq.answer,
            }))}
          />
        </section>
      ) : null}
    </article>
  );
}
