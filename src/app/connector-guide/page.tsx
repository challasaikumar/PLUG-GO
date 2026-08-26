import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { GuideCrumbs, GuidePage, GuideSiblings } from "@/components/marketing/GuideChrome";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ProductIcon, varyIconKind } from "@/components/marketing/ProductIcon";
import { connectorGuide } from "@/content/guides";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { CONNECTOR_TYPES } from "@/lib/catalogue/validation";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { breadcrumbListJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { pageMeta } from "@/lib/metadata";

const AC_TYPES = new Set(["type2_ac", "gbt_ac", "bharat_ac_001"]);
const DC_TYPES = new Set(["ccs2", "chademo", "gbt_dc", "bharat_dc_001"]);

const breadcrumbs = [
  { name: "Home", path: "/" },
  { name: "Connector guide", path: "/connector-guide" },
];

export const metadata = pageMeta({
  title: connectorGuide.title,
  description: connectorGuide.description,
  path: "/connector-guide",
});

function currentKind(type: string): "AC" | "DC" | "Unclassified" {
  if (AC_TYPES.has(type)) return "AC";
  if (DC_TYPES.has(type)) return "DC";
  return "Unclassified";
}

export default function ConnectorGuidePage() {
  const faqSchema = faqPageJsonLd(connectorGuide.faq.map(({ question, answer }) => ({ question, answer })));

  return (
    <GuidePage variant="connectors">
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <ViewTracker event={ANALYTICS_EVENTS.guide_viewed} payload={{ guide: "connector-guide" }} />
      <GuideCrumbs current="Connector guide" />
      <PageIntro title={connectorGuide.h1} lead={connectorGuide.lead} eyebrow="Compatibility" />

      <section className="guide-block" aria-labelledby="acdc-heading">
        <h2 id="acdc-heading">{connectorGuide.acDcTitle}</h2>
        <div className="current-pair">
          {connectorGuide.acDc.map((item) => (
            <article
              key={item.title}
              className={item.title.startsWith("DC") ? "current-card is-dc" : "current-card is-ac"}
            >
              <p className="current-card__kind">{item.title.startsWith("DC") ? "DC" : "AC"}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-block" aria-labelledby="types-heading">
        <h2 id="types-heading">{connectorGuide.typesTitle}</h2>
        <p className="guide-block__lead">{connectorGuide.typesIntro}</p>
        <ul className="spec-grid">
          {CONNECTOR_TYPES.map((type) => {
            const kind = currentKind(type);
            return (
              <li key={type} className={`spec-plate is-${kind.toLowerCase()}`}>
                <span className="spec-plate__kind">{kind === "Unclassified" ? "Incomplete" : kind}</span>
                <strong>{connectorTypeLabel(type)}</strong>
                <span className="font-mono spec-plate__code">{type}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="formula-board" aria-labelledby="kw-heading">
        <h2 id="kw-heading">{connectorGuide.kwTitle}</h2>
        <p>{connectorGuide.kwBody}</p>
        <p className="formula-board__sum" aria-hidden="true">
          <span>40 kWh</span>
          <span>÷</span>
          <span>40 kW</span>
          <span>≈</span>
          <span>60 min</span>
        </p>
        <p className="formula-board__note">
          Illustration only: 40 kWh at a steady 40 kW is about 60 minutes. Real sessions vary.
        </p>
      </section>

      <section className="guide-block" aria-labelledby="vary-heading">
        <h2 id="vary-heading">{connectorGuide.varyTitle}</h2>
        <ul className="reason-stack">
          {connectorGuide.vary.map((item, index) => (
            <li key={item}>
              <ProductIcon kind={varyIconKind(index)} className="reason-stack__icon" size={48} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="guide-note" aria-labelledby="vehicles-heading">
        <h2 id="vehicles-heading">{connectorGuide.vehiclesTitle}</h2>
        <p>{connectorGuide.vehiclesBody}</p>
      </section>

      <section className="guide-faq" aria-labelledby="connector-faq-heading">
        <h2 id="connector-faq-heading">Questions</h2>
        <Accordion
          items={connectorGuide.faq.map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
          }))}
        />
      </section>

      <div className="content-cta-row">
        <Button href="/find-charger">Find compatible stations</Button>
        <Button href="/pricing" variant="outline">
          How pricing is shown
        </Button>
      </div>
      <GuideSiblings current="/connector-guide" />
    </GuidePage>
  );
}
