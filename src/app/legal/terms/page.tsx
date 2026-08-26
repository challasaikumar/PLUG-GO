import { LegalDocument, legalSlotsFrom } from "@/components/legal/LegalDocument";
import { legalCopy } from "@/content/copy";
import { siteConfig } from "@/content/siteConfig";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: legalCopy.terms.title,
  description: legalCopy.terms.description,
  path: "/legal/terms",
});

export default function TermsPage() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <LegalDocument
        h1={legalCopy.terms.h1}
        draftNotice={siteConfig.legal.draftNotice}
        sections={legalCopy.terms.sections}
        slots={legalSlotsFrom(siteConfig)}
      />
    </div>
  );
}
