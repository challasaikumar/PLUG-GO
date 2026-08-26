import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { GuideCrumbs, GuidePage, GuideSiblings } from "@/components/marketing/GuideChrome";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ProductIcon, howToIconKind } from "@/components/marketing/ProductIcon";
import { howToCharge } from "@/content/guides";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { breadcrumbListJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { pageMeta } from "@/lib/metadata";

const breadcrumbs = [
  { name: "Home", path: "/" },
  { name: "How to charge", path: "/how-to-charge" },
];

export const metadata = pageMeta({
  title: howToCharge.title,
  description: howToCharge.description,
  path: "/how-to-charge",
});

export default function HowToChargePage() {
  const faqSchema = faqPageJsonLd(howToCharge.faq.map(({ question, answer }) => ({ question, answer })));

  return (
    <GuidePage variant="howto">
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <ViewTracker event={ANALYTICS_EVENTS.guide_viewed} payload={{ guide: "how-to-charge" }} />
      <GuideCrumbs current="How to charge" />
      <PageIntro title={howToCharge.h1} lead={howToCharge.lead} eyebrow="First-time drivers" />

      <ol className="charge-rail">
        {howToCharge.steps.map((step, index) => (
          <li key={step.title} className="charge-step">
            <ProductIcon kind={howToIconKind(index)} className="charge-step__icon" size={88} />
            <div className="charge-step__body">
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="guide-panel" aria-labelledby="howto-safety-heading">
        <p className="guide-panel__kicker">Before you plug in</p>
        <h2 id="howto-safety-heading">{howToCharge.safetyTitle}</h2>
        <ul className="check-list">
          {howToCharge.safety.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a className="png-link" href="/safety">
          Full safe charging guidance
        </a>
      </section>

      <section className="guide-faq" aria-labelledby="howto-faq-heading">
        <h2 id="howto-faq-heading">Questions</h2>
        <Accordion
          items={howToCharge.faq.map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
          }))}
        />
      </section>

      <div className="content-cta-row">
        <Button href="/find-charger">Find a charger</Button>
        <Button href="/connector-guide" variant="outline">
          Connector guide
        </Button>
      </div>
      <GuideSiblings current="/how-to-charge" />
    </GuidePage>
  );
}
