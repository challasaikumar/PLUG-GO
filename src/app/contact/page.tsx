import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { GuideCrumbs } from "@/components/marketing/GuideChrome";
import { ContactMap } from "@/components/marketing/ContactMap";
import { copy } from "@/content/copy";
import { unpublished, siteConfig, hasPublished } from "@/content/siteConfig";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { normalizeEmail, validateEmail } from "@/lib/fields";
import { getPublicMapConfig } from "@/lib/maps/config";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: copy.contact.title,
  description: copy.contact.description,
  path: "/contact",
});

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ContactPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  const defaultEmail = email && !validateEmail(email) ? normalizeEmail(email) : "";
  const configured = isEnquiryConfigured();
  const mapConfig = getPublicMapConfig();

  return (
    <div className="contact-desk">
      <GuideCrumbs current="Contact" />
      <header className="contact-desk__intro">
        <p>Contact</p>
        <h1>{copy.contact.h1}</h1>
        <p>{copy.contact.lead}</p>
      </header>

      <div className="contact-desk__grid">
        <ContactMap address={siteConfig.identity.registeredAddress} mapConfig={mapConfig} />

        <aside className="contact-desk__form" aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading">Send a message</h2>
          <EnquiryForm kind="contact" deliveryConfigured={configured} defaultEmail={defaultEmail} />
        </aside>
      </div>

      <section className="contact-readout" aria-labelledby="published-contacts-heading">
        <h2 id="published-contacts-heading">Published contacts</h2>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>
              {hasPublished(siteConfig.contact.supportEmail) ? (
                <a className="png-link" href={`mailto:${siteConfig.contact.supportEmail}`}>
                  {siteConfig.contact.supportEmail}
                </a>
              ) : (
                unpublished(siteConfig.contact.supportEmail)
              )}
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{unpublished(siteConfig.contact.supportPhone)}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{unpublished(siteConfig.contact.supportHours)}</dd>
          </div>
        </dl>
        <p className="contact-readout__note">
          We do not claim 24/7 coverage. Hours appear only when operations confirm them.
        </p>
      </section>
    </div>
  );
}
