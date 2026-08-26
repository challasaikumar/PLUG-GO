import { siteConfig, unpublished } from "@/content/siteConfig";
import { Alert } from "@/components/ui/Alert";

type LegalSection = { heading: string; body: string };

type LegalDocumentProps = {
  h1: string;
  draftNotice: string;
  sections: readonly LegalSection[];
  slots: {
    legalEntity: string | null;
    registeredAddress: string | null;
    supportEmail: string | null;
    grievanceName: string | null;
    grievanceEmail: string | null;
    effectiveDate: string | null;
    policyVersion: string;
  };
};

export function LegalDocument({ h1, draftNotice, sections, slots }: LegalDocumentProps) {
  return (
    <article className="legal-doc">
      <Alert variant="warning" title="Draft for legal review">
        {draftNotice}
      </Alert>
      <h1 className="type-h1" style={{ margin: "24px 0 16px" }}>
        {h1}
      </h1>
      <dl className="legal-slots">
        <div>
          <dt>Legal entity</dt>
          <dd>{unpublished(slots.legalEntity)}</dd>
        </div>
        <div>
          <dt>Registered address</dt>
          <dd>{unpublished(slots.registeredAddress)}</dd>
        </div>
        <div>
          <dt>Support email</dt>
          <dd>{unpublished(slots.supportEmail)}</dd>
        </div>
        <div>
          <dt>Grievance contact</dt>
          <dd>
            {unpublished(slots.grievanceName)}
            {slots.grievanceEmail ? ` · ${slots.grievanceEmail}` : " · email not published"}
          </dd>
        </div>
        <div>
          <dt>Effective date</dt>
          <dd>{unpublished(slots.effectiveDate)}</dd>
        </div>
        <div>
          <dt>Policy version</dt>
          <dd className="font-mono">{slots.policyVersion}</dd>
        </div>
      </dl>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="type-h3">{section.heading}</h2>
          <p className="type-body">{section.body}</p>
        </section>
      ))}
    </article>
  );
}

export function legalSlotsFrom(config: typeof siteConfig) {
  return {
    legalEntity: config.identity.legalEntity,
    registeredAddress: config.identity.registeredAddress,
    supportEmail: config.contact.supportEmail,
    grievanceName: config.contact.grievanceName,
    grievanceEmail: config.contact.grievanceEmail,
    effectiveDate: config.legal.effectiveDate,
    policyVersion: config.legal.policyVersion,
  };
}
