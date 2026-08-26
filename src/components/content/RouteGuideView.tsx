import Link from "next/link";
import { ContentBreadcrumbs, ReviewedNote } from "@/components/content/ContentChrome";
import { Accordion } from "@/components/ui/Accordion";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { appleMapsDirectionsUrl, googleMapsDirectionsUrl, stationCanonicalPath } from "@/lib/geo";

type RouteStopView = {
  stationSlug: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  stopNotes?: string | null;
  sortOrder: number;
};

type RouteView = {
  slug: string;
  originName: string;
  destinationName: string;
  routeNotes: string;
  accessCaveats: string;
  lastReviewedAt?: Date | string | null;
  reviewerName?: string | null;
  faqs: Array<{ question: string; answer: string }>;
  stops: RouteStopView[];
};

export function RouteGuideView({
  route,
  preview = false,
}: {
  route: RouteView;
  preview?: boolean;
}) {
  return (
    <article className="content-article">
      {preview ? (
        <p className="type-caption admin-preview-banner">Staff preview — this route guide is not public.</p>
      ) : null}
      <ContentBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Find a charger", path: "/find-charger" },
          { name: `${route.originName} to ${route.destinationName}`, path: `/routes/${route.slug}` },
        ]}
      />
      <header className="page-intro" style={{ paddingTop: 0 }}>
        <p className="type-caption" style={{ color: "var(--color-action-primary)", margin: "0 0 12px" }}>
          Researched charging plan
        </p>
        <h1 className="type-h1" style={{ margin: "0 0 16px" }}>
          {route.originName} to {route.destinationName}
        </h1>
        <ReviewedNote reviewedAt={route.lastReviewedAt} reviewerName={route.reviewerName} />
        <div className="content-cta-row">
          <Button href="/find-charger">Find chargers</Button>
          <Button href="/how-to-charge" variant="outline">
            How to charge
          </Button>
        </div>
      </header>

      <section className="page-section" aria-labelledby="route-notes-heading">
        <h2 id="route-notes-heading" className="type-h2">
          Charging plan
        </h2>
        <p className="type-body" style={{ color: "var(--color-text-secondary)", maxWidth: "40rem" }}>
          {route.routeNotes}
        </p>
      </section>

      <section className="page-section" aria-labelledby="route-caveats-heading">
        <h2 id="route-caveats-heading" className="type-h2">
          Access caveats
        </h2>
        <Alert variant="warning" title="Check each stop before you travel">
          {route.accessCaveats}
        </Alert>
      </section>

      <section className="page-section" aria-labelledby="route-stops-heading">
        <h2 id="route-stops-heading" className="type-h2">
          Compatible published stops
        </h2>
        <ol className="route-stop-list">
          {route.stops.map((stop, index) => {
            const href = stationCanonicalPath({
              state: stop.state,
              city: stop.city,
              slug: stop.stationSlug,
            });
            return (
              <li key={stop.stationSlug} className="paper-card" style={{ padding: 20 }}>
                <p className="type-caption" style={{ margin: "0 0 8px" }}>
                  Stop {index + 1}
                </p>
                <h3 className="type-h3" style={{ margin: "0 0 8px" }}>
                  <Link className="png-link" href={href}>
                    {stop.name}
                  </Link>
                </h3>
                <p className="type-small" style={{ margin: "0 0 12px", color: "var(--color-text-secondary)" }}>
                  {stop.city}, {stop.state}
                </p>
                {stop.stopNotes ? (
                  <p className="type-body" style={{ margin: "0 0 12px" }}>
                    {stop.stopNotes}
                  </p>
                ) : null}
                <div className="content-cta-row">
                  <Button href={googleMapsDirectionsUrl(stop.latitude, stop.longitude)} external size="sm">
                    Google Maps
                  </Button>
                  <Button href={appleMapsDirectionsUrl(stop.latitude, stop.longitude)} external variant="outline" size="sm">
                    Apple Maps
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {route.faqs.length ? (
        <section className="page-section" aria-labelledby="route-faq-heading">
          <h2 id="route-faq-heading" className="type-h2">
            Route questions
          </h2>
          <Accordion
            items={route.faqs.map((faq, index) => ({
              id: `route-faq-${index}`,
              question: faq.question,
              answer: faq.answer,
            }))}
          />
        </section>
      ) : null}
    </article>
  );
}
