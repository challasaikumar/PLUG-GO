import { LegalDocument, legalSlotsFrom } from "@/components/legal/LegalDocument";
import { legalCopy } from "@/content/copy";
import { siteConfig } from "@/content/siteConfig";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: legalCopy.accessibility.title,
  description: legalCopy.accessibility.description,
  path: "/legal/accessibility",
});

export default function AccessibilityPage() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <LegalDocument
        h1={legalCopy.accessibility.h1}
        draftNotice={siteConfig.legal.draftNotice}
        sections={legalCopy.accessibility.sections}
        slots={legalSlotsFrom(siteConfig)}
      />
    </div>
  );
}
