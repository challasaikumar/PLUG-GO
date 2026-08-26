import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ConnectorBadge } from "@/components/ui/ConnectorBadge";
import { SupportEscalationCard } from "@/components/ui/SupportEscalationCard";
import { HeroStoreCta } from "@/components/marketing/HeroStoreCta";
import { HeroVideo } from "@/components/marketing/HeroVideo";
import { HomeBoard } from "@/components/marketing/HomeBoard";
import { IconAppStore, IconGooglePlay } from "@/components/marketing/storeIcons";
import { JourneyStepIcon, journeyStepKind } from "@/components/marketing/JourneyStepIcon";
import { OfferCards } from "@/components/marketing/OfferCards";
import { CoverageBand } from "@/components/marketing/CoverageBand";
import { TariffSchematic } from "@/components/marketing/TariffSchematic";
import { copy } from "@/content/copy";
import { siteConfig } from "@/content/siteConfig";
import { listPublishedCitySummaries } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { getPublicMapConfig } from "@/lib/maps/config";
import { isFeatureEnabled } from "@/lib/release/overrides";
import { pageMeta } from "@/lib/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: siteConfig.name,
  description: copy.home.description,
  path: "/",
});

export default async function HomePage() {
  const home = copy.home;
  const cities =
    isDatabaseConfigured() && (await isFeatureEnabled("publishedCityRouteContent"))
      ? await listPublishedCitySummaries()
      : [];
  const mapConfig = getPublicMapConfig();

  return (
    <div className="home-page">
      <HeroVideo>
        <h1 className="home-hero__title">
          Find a compatible <em>charger</em>.
          <span className="home-hero__title-rest">
            Know the <em className="home-hero__gold">price</em>. <em>Charge</em> with confidence.
          </span>
        </h1>
        <p className="home-hero__journey">
          Find <span aria-hidden="true">|</span> Arrive <span aria-hidden="true">|</span> Charge
        </p>
        <div className="home-hero__actions" role="group" aria-label="Get started">
          <Button href="/find-charger" variant="outline" className="png-btn--pill">
            Find a charger
          </Button>
          <Button href="/contact" variant="outline" className="png-btn--pill">
            Talk to us
          </Button>
          <Button href="/host-a-charger" variant="outline" className="png-btn--pill">
            Host a charger
          </Button>
          <HeroStoreCta href={siteConfig.apps.playStore} label="Google play">
            <IconGooglePlay />
            Google play
          </HeroStoreCta>
          <HeroStoreCta href={siteConfig.apps.appStore} label="App store">
            <IconAppStore />
            App store
          </HeroStoreCta>
        </div>
      </HeroVideo>

      <div className="home-rest">
      <HomeBoard />

      <CoverageBand mapConfig={mapConfig} />

      <OfferCards />

      <div className="home-ledger">
        <section className="ledger" aria-labelledby="how-detail-heading">
          <header className="ledger__head">
            <p className="ledger__kicker">The three steps</p>
            <h2 id="how-detail-heading" className="ledger__title">
              What each step means
            </h2>
            <p className="ledger__lead">{home.howIntro}</p>
          </header>
          <div className="step-rail">
            {home.howSteps.map((step) => (
              <article key={step.title} className={step.now ? "step-card is-now" : "step-card"}>
                <div className="step-card__top">
                  <JourneyStepIcon kind={journeyStepKind(step.title)} />
                  <p className="step-card__status">{step.now ? "On this site" : "Later"}</p>
                </div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__body">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ledger ledger--split" aria-labelledby="compat-heading">
          <div className="ledger__copy">
            <p className="ledger__kicker">Connectors and cost</p>
            <h2 id="compat-heading" className="ledger__title">
              {home.compatibilityTitle}
            </h2>
            <p className="ledger__lead">{home.compatibilityBody}</p>
            <p className="ledger__note">
              Connector labels the product can display — not a live Plug and Go inventory.
            </p>
            <div className="ledger__badges">
              <ConnectorBadge type="CCS2" maxKw={60} />
              <ConnectorBadge type="Type 2" maxKw={22} />
            </div>
            <p className="ledger__link-wrap">
              <a className="png-link" href="/pricing">
                How pricing will be shown
              </a>
            </p>
          </div>
          <TariffSchematic />
        </section>

        <section className="ledger ledger--safety" aria-labelledby="safety-heading">
          <div className="ledger__copy">
            <p className="ledger__kicker">If a bay looks wrong</p>
            <h2 id="safety-heading" className="ledger__title">
              {home.safetyTitle}
            </h2>
            <p className="ledger__lead">{home.safetyBody}</p>
            <p className="ledger__link-wrap">
              <a className="png-link" href="/safety">
                Read safe charging guidance
              </a>
            </p>
          </div>
          <SupportEscalationCard
            phone={siteConfig.contact.supportPhone ?? undefined}
            email={siteConfig.contact.supportEmail ?? undefined}
            hours={siteConfig.contact.supportHours ?? undefined}
          />
        </section>

        <section className="ledger" aria-labelledby="learn-heading">
          <header className="ledger__head">
            <p className="ledger__kicker">Guides</p>
            <h2 id="learn-heading" className="ledger__title">
              {home.learnTitle}
            </h2>
          </header>
          {cities.length > 0 ? (
            <div className="learn-cities">
              <h3 className="learn-cities__title">City charging guides</h3>
              <ul className="learn-grid">
                {cities.map((city) => (
                  <li key={city.slug}>
                    <a className="learn-tile" href={city.href}>
                      <span className="learn-tile__label">EV charging in {city.cityName}</span>
                      <span className="learn-tile__detail">
                        {city.stationCount} published station{city.stationCount === 1 ? "" : "s"} in {city.stateName}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ul className="learn-grid">
            {home.learnLinks.map((item) => (
              <li key={item.href}>
                <a className="learn-tile" href={item.href}>
                  <span className="learn-tile__label">{item.label}</span>
                  <span className="learn-tile__detail">{item.detail}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="ledger ledger--faq" aria-labelledby="faq-heading">
          <header className="ledger__head">
            <p className="ledger__kicker">Before you go</p>
            <h2 id="faq-heading" className="ledger__title">
              Questions
            </h2>
          </header>
          <Accordion
            items={home.faq.map((item) => ({
              id: item.id,
              question: item.question,
              answer: item.answer,
            }))}
          />
        </section>
      </div>

      <div className="home-sticky-cta">
        <div className="container-png">
          <Button href="/find-charger" block>
            Find a charger
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
