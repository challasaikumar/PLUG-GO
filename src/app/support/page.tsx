import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { GuideCrumbs } from "@/components/marketing/GuideChrome";
import { SupportPathIcon } from "@/components/marketing/SupportPathIcon";
import { copy } from "@/content/copy";
import { hasPublished, siteConfig, unpublished } from "@/content/siteConfig";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { pageMeta } from "@/lib/metadata";
import Link from "next/link";

export const metadata = pageMeta({
  title: copy.support.title,
  description: copy.support.description,
  path: "/support",
});

type PageProps = {
  searchParams: Promise<{ topic?: string; stationId?: string }>;
};

const RELATED = [
  { href: "/how-to-charge", label: "How to charge" },
  { href: "/safety", label: "Safe charging" },
  { href: "/pricing", label: "How pricing is shown" },
  { href: "/contact", label: "Contact desk" },
] as const;

export default async function SupportPage({ searchParams }: PageProps) {
  const { topic, stationId } = await searchParams;
  const configured = isEnquiryConfigured();
  const support = copy.support;
  const selected = support.paths.find((path) => path.id === topic);
  const email = siteConfig.contact.supportEmail;
  const phone = siteConfig.contact.supportPhone;
  const hours = siteConfig.contact.supportHours;

  return (
    <div className="support-desk">
      <GuideCrumbs current="Get help" />

      <header className="support-mast">
        <p className="support-mast__kicker">Support</p>
        <h1>{support.h1}</h1>
        <p className="support-mast__lead">{support.lead}</p>
        <p className="support-mast__jump">
          <a href="#form-heading">Skip to the enquiry form</a>
        </p>
      </header>

      <aside className="support-priority" role="status">
        <div className="support-priority__head">
          <p>Safety first</p>
          <h2>{support.emergencyTitle}</h2>
        </div>
        <p className="support-priority__body">{support.emergency}</p>
      </aside>

      <section className="support-index" aria-labelledby="paths-heading">
        <header className="support-index__head">
          <h2 id="paths-heading">Help paths</h2>
          <p>Choose the path that matches. It fills the form below. Live ticketing is not on this website yet.</p>
        </header>
        <ol className="support-index__list">
          {support.paths.map((path) => {
            const isOn = topic === path.id;
            return (
              <li key={path.id}>
                <a
                  className={
                    path.id === "unsafe_fault"
                      ? `support-path support-path--alert${isOn ? " is-selected" : ""}`
                      : `support-path${isOn ? " is-selected" : ""}`
                  }
                  href={`/support?topic=${path.id}${stationId ? `&stationId=${encodeURIComponent(stationId)}` : ""}#form-heading`}
                  aria-current={isOn ? "true" : undefined}
                >
                  <SupportPathIcon id={path.id} />
                  <span className="support-path__copy">
                    <span className="support-path__title">{path.title}</span>
                    <span className="support-path__body">{path.body}</span>
                  </span>
                  <span className="support-path__go">{isOn ? "Writing this" : "Write about this"}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="support-atelier" id="form-heading" aria-labelledby="form-title">
        <header className="support-atelier__intro">
          <p className="support-atelier__kicker">Enquiry</p>
          <h2 id="form-title">Send a support enquiry</h2>
          <p className="support-atelier__lead">
            This is not a live ticket queue. Optional station or session fields help a person find the right site later.
            Payment and charging sessions are not operated from this website yet.
          </p>
          {selected ? (
            <p className="support-atelier__picked">
              Writing about <strong>{selected.title}</strong>
            </p>
          ) : (
            <p className="support-atelier__picked support-atelier__picked--empty">
              No path selected yet. Pick one above, or choose a help path in the form.
            </p>
          )}
        </header>
        <div className="support-atelier__body">
          <dl className="support-ledger">
            <div className="support-ledger__item">
              <dt>This form can</dt>
              <dd>Send a written enquiry, with a station or session reference only if you already have one.</dd>
            </div>
            <div className="support-ledger__item support-ledger__item--not">
              <dt>This form cannot</dt>
              <dd>Dispatch emergency services, start or stop a charge, or promise a reply time. Hours are unpublished.</dd>
            </div>
          </dl>
          <aside className="support-atelier__form" aria-label="Support enquiry form">
            <p className="support-atelier__form-note">
              Required fields are marked. Station and session references are optional — add them only if you already have one.
            </p>
            <EnquiryForm
              kind="support"
              deliveryConfigured={configured}
              defaultReason={topic ?? ""}
              defaultStationId={stationId ?? ""}
              submitLabel="Send support enquiry"
            />
          </aside>
        </div>
      </section>

      <section className="support-contacts" aria-labelledby="support-contacts-heading">
        <h2 id="support-contacts-heading">Published contacts</h2>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>
              {hasPublished(email) && email ? (
                <a className="png-link" href={`mailto:${email}`}>
                  {email}
                </a>
              ) : (
                unpublished(email)
              )}
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{unpublished(phone)}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{unpublished(hours)}</dd>
          </div>
        </dl>
      </section>

      <nav className="support-more" aria-label="Related pages">
        <p>If you are still deciding</p>
        <ul>
          {RELATED.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
