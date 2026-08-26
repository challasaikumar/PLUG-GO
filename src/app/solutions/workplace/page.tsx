import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ProductIcon, processIconKind } from "@/components/marketing/ProductIcon";
import { copy } from "@/content/copy";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: copy.workplace.title,
  description: copy.workplace.description,
  path: "/solutions/workplace",
});

export default function WorkplacePage() {
  const page = copy.workplace;
  const configured = isEnquiryConfigured();

  return (
    <div className="container-png" style={{ paddingBottom: 80 }}>
      <PageIntro title={page.h1} lead={page.lead} eyebrow="Workplace" />

      <ol
        className="how-steps"
        style={{ marginBottom: 48, listStyle: "none", padding: 0 }}
      >
        {page.process.map((step, index) => (
          <li key={step} className="how-step">
            <ProductIcon kind={processIconKind(index)} className="how-step__icon" size={72} />
            <p className="type-body" style={{ margin: 0 }}>
              {step}
            </p>
          </li>
        ))}
      </ol>

      <div className="paper-card" style={{ padding: 24, maxWidth: 560 }}>
        <h2 className="type-h3" style={{ marginTop: 0 }}>
          {page.cta}
        </h2>
        <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
          Facilities and property teams only. Drivers should use Find a charger.
        </p>
        <EnquiryForm
          kind="workplace"
          deliveryConfigured={configured}
          compact
          submitLabel={page.cta}
        />
      </div>
    </div>
  );
}
