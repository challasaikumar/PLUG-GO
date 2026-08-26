import { unpublished, siteConfig } from "@/content/siteConfig";
import { copy } from "@/content/copy";
import { pageMeta } from "@/lib/metadata";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ProductIcon, aboutIconKind } from "@/components/marketing/ProductIcon";

export const metadata = pageMeta({
  title: copy.about.title,
  description: copy.about.description,
  path: "/about",
});

export default function AboutPage() {
  const about = copy.about;
  const identity = [
    ["Legal entity", unpublished(siteConfig.identity.legalEntity)],
    ["Registered address", unpublished(siteConfig.identity.registeredAddress)],
    ["GSTIN", unpublished(siteConfig.identity.gstin)],
    ["Support email", unpublished(siteConfig.contact.supportEmail)],
  ];

  return (
    <div className="container-png" style={{ paddingBottom: 80 }}>
      <PageIntro title={about.h1} lead={about.lead} eyebrow="About" />

      <section className="page-section" style={{ paddingTop: 0 }}>
        <h2 className="type-h2">{about.missionTitle}</h2>
        <p className="type-body" style={{ maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
          {about.mission}
        </p>
      </section>

      <section className="page-section">
        <h2 className="type-h2">{about.principlesTitle}</h2>
        <div style={{ display: "grid", gap: 0 }}>
          {about.principles.map((item, index) => (
            <article
              key={item.title}
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr",
                gap: 16,
                alignItems: "center",
                padding: "24px 0",
                borderTop: "1px solid var(--color-border-default)",
              }}
            >
              <ProductIcon kind={aboutIconKind(index)} className="process-icon" size={56} />
              <div>
                <h3 className="type-h3" style={{ margin: "0 0 8px" }}>
                  {item.title}
                </h3>
                <p className="type-body" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section">
        <h2 className="type-h2">{about.trustTitle}</h2>
        <p className="type-body" style={{ maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
          {about.trust}
        </p>
      </section>

      <section className="page-section">
        <h2 className="type-h2">{about.identityTitle}</h2>
        <p className="type-small" style={{ margin: "0 0 16px", color: "var(--color-text-tertiary)" }}>
          {about.identityNote}
        </p>
        <dl className="legal-slots">
          {identity.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
