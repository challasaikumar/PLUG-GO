import { GalleryGrid } from "@/components/marketing/GalleryGrid";
import { HeroFieldPage } from "@/components/marketing/HeroFieldPage";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { JsonLd } from "@/components/seo/JsonLd";
import { galleryItems } from "@/content/gallery";
import { pageMeta } from "@/lib/metadata";
import { breadcrumbListJsonLd, collectionPageJsonLd } from "@/lib/seo/jsonld";

export const metadata = pageMeta({
  title: "Gallery",
  description:
    "Photos of PLUG & GO EV charge hubs, DC fast chargers, manned sites, and the find–arrive–charge app.",
  path: "/gallery",
  keywords: ["EV charging photos", "DC fast charger", "manned charge hub"],
});

export default function GalleryPage() {
  return (
    <HeroFieldPage>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          path: "/gallery",
          name: "PLUG & GO gallery",
          description: "Photos from PLUG & GO charging sites, the app, and the charge journey.",
          numberOfItems: galleryItems.length,
        })}
      />
      <div className="vt vt-gallery">
        <div className="vt-wrap vt-wrap--wide">
          <SectionHead id="gallery-heading" kicker="Gallery" as="h1">
            Charge hubs in the frame
          </SectionHead>
          <p className="vt-lead">Site photos, the app, and the find–arrive–charge journey.</p>
          <GalleryGrid />
        </div>
      </div>
    </HeroFieldPage>
  );
}
