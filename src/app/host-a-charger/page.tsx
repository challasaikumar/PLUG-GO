import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { GuideCrumbs } from "@/components/marketing/GuideChrome";
import { ProductIcon, processIconKind } from "@/components/marketing/ProductIcon";
import { copy } from "@/content/copy";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: copy.host.title,
  description: copy.host.description,
  path: "/host-a-charger",
});

export default function HostPage() {
  const page = copy.host;
  const configured = isEnquiryConfigured();

  return (
    <div className="host-page">
      <GuideCrumbs current="Host a charger" />
      <div className="host-split">
        <div className="host-copy">
          <header className="host-intro">
            <p className="host-intro__kicker">Hosts</p>
            <h1>{page.h1}</h1>
            <p className="host-intro__lead">{page.lead}</p>
          </header>

          <section aria-labelledby="host-ask-heading">
            <h2 id="host-ask-heading">{page.askTitle}</h2>
            <ul>
              {page.ask.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="host-process-heading">
            <h2 id="host-process-heading">{page.processTitle}</h2>
            <ol className="process-list">
              {page.process.map((step, index) => (
                <li key={step}>
                  <ProductIcon kind={processIconKind(index)} className="process-icon" size={56} />
                  <span className="type-body">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="host-form-wrap" aria-labelledby="host-form-heading">
          <h2 id="host-form-heading">{page.cta}</h2>
          <EnquiryForm kind="host" deliveryConfigured={configured} submitLabel={page.cta} />
        </aside>
      </div>
    </div>
  );
}
