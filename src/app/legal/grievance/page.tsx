import { LegalDocument, legalSlotsFrom } from "@/components/legal/LegalDocument";
import { legalCopy } from "@/content/copy";
import { siteConfig } from "@/content/siteConfig";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: legalCopy.grievance.title,
  description: legalCopy.grievance.description,
  path: "/legal/grievance",
});

export default function GrievancePage() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <LegalDocument
        h1={legalCopy.grievance.h1}
        draftNotice={siteConfig.legal.draftNotice}
        sections={legalCopy.grievance.sections}
        slots={legalSlotsFrom(siteConfig)}
      />
    </div>
  );
}
