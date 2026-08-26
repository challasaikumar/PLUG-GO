import { LegalDocument, legalSlotsFrom } from "@/components/legal/LegalDocument";
import { legalCopy } from "@/content/copy";
import { siteConfig } from "@/content/siteConfig";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: legalCopy.refunds.title,
  description: legalCopy.refunds.description,
  path: "/legal/refunds",
});

export default function RefundsPage() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <LegalDocument
        h1={legalCopy.refunds.h1}
        draftNotice={siteConfig.legal.draftNotice}
        sections={legalCopy.refunds.sections}
        slots={legalSlotsFrom(siteConfig)}
      />
    </div>
  );
}
