import { HeroFieldPage } from "@/components/marketing/HeroFieldPage";
import { ContactDesk } from "@/components/marketing/voltran/ContactDesk";
import { JsonLd } from "@/components/seo/JsonLd";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { normalizeEmail, validateEmail } from "@/lib/fields";
import { pageMeta } from "@/lib/metadata";
import { breadcrumbListJsonLd, contactPageJsonLd } from "@/lib/seo/jsonld";

export const metadata = pageMeta({
  title: "Contact Us",
  description:
    "Call +91 85559 66678 or email info@plugandgo.in. PLUG & GO offices in Vijayawada and Hyderabad. Support is open 24x7.",
  path: "/contact",
  keywords: ["contact PLUG & GO", "EV charging support", "Vijayawada office", "Hyderabad office"],
});

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ContactPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  const defaultEmail = email && !validateEmail(email) ? normalizeEmail(email) : "";

  return (
    <HeroFieldPage>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <JsonLd data={contactPageJsonLd()} />
      <div className="vt vt-contact-page">
        <div className="vt-wrap vt-wrap--wide">
          <ContactDesk
            deliveryConfigured={isEnquiryConfigured()}
            defaultEmail={defaultEmail}
            headingLevel="h1"
          />
        </div>
      </div>
    </HeroFieldPage>
  );
}
