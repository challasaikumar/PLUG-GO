import { LegalDocument, legalSlotsFrom } from "@/components/legal/LegalDocument";
import { legalCopy } from "@/content/copy";
import { siteConfig } from "@/content/siteConfig";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: legalCopy.privacy.title,
  description: legalCopy.privacy.description,
  path: "/legal/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <LegalDocument
        h1={legalCopy.privacy.h1}
        draftNotice={siteConfig.legal.draftNotice}
        sections={legalCopy.privacy.sections}
        slots={legalSlotsFrom(siteConfig)}
      />
    </div>
  );
}
