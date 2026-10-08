import { Button } from "@/components/ui/Button";
import { HeroFieldPage } from "@/components/marketing/HeroFieldPage";
import { HeroStoreCta } from "@/components/marketing/HeroStoreCta";
import { HeroVideo } from "@/components/marketing/HeroVideo";
import { IconAppStore, IconGooglePlay } from "@/components/marketing/storeIcons";
import { BackToTop } from "@/components/marketing/BackToTop";
import { ChargeMarquee } from "@/components/marketing/ChargeMarquee";
import { VoltranHome } from "@/components/marketing/voltran/VoltranHome";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/content/siteConfig";
import { isEnquiryConfigured } from "@/lib/enquiry";
import { normalizeEmail, validateEmail } from "@/lib/fields";
import { pageMeta } from "@/lib/metadata";
import { homeDiscoveryJsonLd } from "@/lib/seo/jsonld";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata = pageMeta({
  title: siteConfig.name,
  description: SITE_DESCRIPTION,
  path: "/",
  keywords: ["Rajahmundry EV charging", "Jio-bp", "Tata Power Charging Station"],
});

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  const defaultEmail = email && !validateEmail(email) ? normalizeEmail(email) : "";

  return (
    <>
    <JsonLd data={homeDiscoveryJsonLd()} />
    <HeroFieldPage className="home-page">
      <HeroVideo>
        <h1 className="home-hero__title">
          Find a compatible <em>charger</em>.
          <span className="home-hero__title-rest">
            Know the <em className="home-hero__gold">price</em>. <em>Charge</em> with confidence.
          </span>
        </h1>
        <p className="home-hero__journey">
          Find <span aria-hidden="true">|</span> Arrive <span aria-hidden="true">|</span> Charge
        </p>
        <div className="home-hero__actions" role="group" aria-label="Get started">
          <Button href="/find-charger" variant="primary" className="png-btn--pill">
            Find a charger
          </Button>
          <Button href="/gallery" variant="outline" className="png-btn--pill">
            Gallery
          </Button>
          <Button href="/contact" variant="outline" className="png-btn--pill">
            Talk to us
          </Button>
          <HeroStoreCta href={siteConfig.apps.playStore} label="Google play">
            <IconGooglePlay />
            Google play
          </HeroStoreCta>
          <HeroStoreCta href={siteConfig.apps.appStore} label="App store">
            <IconAppStore />
            App store
          </HeroStoreCta>
        </div>
      </HeroVideo>

      <ChargeMarquee />

      <div className="home-rest">
        <VoltranHome deliveryConfigured={isEnquiryConfigured()} defaultEmail={defaultEmail} />
      </div>
    </HeroFieldPage>
    <BackToTop />
    </>
  );
}
