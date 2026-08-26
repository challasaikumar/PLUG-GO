import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ProductIcon, processIconKind } from "@/components/marketing/ProductIcon";
import { copy } from "@/content/copy";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: copy.fleets.title,
  description: copy.fleets.description,
  path: "/solutions/fleets",
});

export default function FleetsPage() {
  const page = copy.fleets;
  const configured = isEnquiryConfigured();

  return (
    <div className="container-png" style={{ paddingBottom: 80 }}>
      <PageIntro title={page.h1} lead={page.lead} eyebrow="Fleets" />
      <div className="b2b-layout">
        <div>
          <h2 className="type-h2">{page.processTitle}</h2>
          <ol className="process-list">
            {page.process.map((step, index) => (
              <li key={step}>
                <ProductIcon kind={processIconKind(index)} className="process-icon" size={56} />
                <span className="type-body">{step}</span>
              </li>
            ))}
          </ol>
          <p className="type-small" style={{ marginTop: 24, color: "var(--color-text-tertiary)" }}>
            Looking for a charger for your own car?{" "}
            <a className="png-link" href="/find-charger">
              Find a charger
            </a>
          </p>
        </div>
        <div className="paper-card b2b-form-card">
          <h2 className="type-h3" style={{ marginTop: 0 }}>
            {page.cta}
          </h2>
          <EnquiryForm
            kind="fleet"
            deliveryConfigured={configured}
            compact
            submitLabel={page.cta}
          />
        </div>
      </div>
    </div>
  );
}
