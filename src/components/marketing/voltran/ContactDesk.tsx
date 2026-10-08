import { VoltranContactForm } from "@/components/marketing/voltran/VoltranContactForm";
import { hasPublished, siteConfig } from "@/content/siteConfig";
import { voltran } from "@/content/voltran";

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.6 2.8c.5-.5 1.3-.6 1.9-.3l2.6 1.1c.6.2 1 .8 1 1.4v2.3c0 .5-.3 1-.7 1.3-.6.4-1.3.9-1.3.9s.7 1.5 2.5 3.3 3.3 2.5 3.3 2.5.5-.7.9-1.3c.3-.4.8-.7 1.3-.7h2.3c.6 0 1.2.4 1.4 1l1.1 2.6c.3.6.2 1.4-.3 1.9-1.9 1.9-6.4 2.2-11.1-2.5S4.7 4.7 6.6 2.8Z" />
    </svg>
  );
}

function IconAt() {
  return <span aria-hidden="true">@</span>;
}

export function ContactDesk({
  deliveryConfigured,
  defaultEmail = "",
  headingLevel = "h2",
}: {
  deliveryConfigured: boolean;
  defaultEmail?: string;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const phone = siteConfig.contact.supportPhone;
  const email = siteConfig.contact.supportEmail;
  const hours = siteConfig.contact.supportHours;

  return (
    <div className="vt-contact-desk">
      <div className="vt-contact-card">
        <div className="vt-contact-card__top">
          <p className="vt-kicker">Contact us</p>
          {hasPublished(hours) && hours ? <span className="vt-contact-hours">{hours}</span> : null}
        </div>
        <Heading id="contact-heading">
          Drop us <em>a line</em>
        </Heading>
        <VoltranContactForm deliveryConfigured={deliveryConfigured} defaultEmail={defaultEmail} />
      </div>

      <div className="vt-contact-desk__aside">
        <div className="vt-contact-map">
          <div className="vt-contact-map__frame">
            <iframe
              title="PLUG & GO Hyderabad office"
              src={voltran.officeEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        <div className="vt-contact-reach">
          {hasPublished(phone) && phone ? (
            <a className="vt-contact-chip" href={`tel:${phone.replace(/\s/g, "")}`}>
              <span className="vt-contact-chip__icon">
                <IconPhone />
              </span>
              <span>
                <span className="vt-contact-chip__label">Reach out</span>
                <span className="vt-contact-chip__value">{phone}</span>
              </span>
            </a>
          ) : null}
          {hasPublished(email) && email ? (
            <a className="vt-contact-chip" href={`mailto:${email}`}>
              <span className="vt-contact-chip__icon">
                <IconAt />
              </span>
              <span>
                <span className="vt-contact-chip__label">Email address</span>
                <span className="vt-contact-chip__value">{email}</span>
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
