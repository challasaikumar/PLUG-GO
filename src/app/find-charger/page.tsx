import type { Metadata } from "next";
import { FinderShell } from "@/components/finder/FinderShell";
import { HeroFieldPage } from "@/components/marketing/HeroFieldPage";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { JsonLd } from "@/components/seo/JsonLd";
import { Alert } from "@/components/ui/Alert";
import { copy } from "@/content/copy";
import { listPublishedHubs } from "@/lib/catalogue/published-hubs";
import {
  defaultFinderQuery,
  finderShouldIndex,
  parseFinderQuery,
} from "@/lib/finder/query";
import { getPublicMapConfig } from "@/lib/maps/config";
import { pageMeta } from "@/lib/metadata";
import { breadcrumbListJsonLd } from "@/lib/seo/jsonld";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paramsFromRecord(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
    } else if (value) {
      params.set(key, value);
    }
  }
  return params;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const parsed = parseFinderQuery(paramsFromRecord(raw));
  const query = parsed.ok ? parsed.query : defaultFinderQuery();
  const index = parsed.ok && finderShouldIndex(query);
  return pageMeta({
    title: copy.findCharger.title,
    description: copy.findCharger.description,
    path: "/find-charger",
    index,
  });
}

export default async function FindChargerPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = parseFinderQuery(paramsFromRecord(raw));
  const query = parsed.ok ? parsed.query : defaultFinderQuery();
  const mapConfig = getPublicMapConfig();
  const initialResult = listPublishedHubs(query);

  return (
    <HeroFieldPage>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Find a charger", path: "/find-charger" },
        ])}
      />
      <div className="vt vt-finder">
        <div className="vt-wrap vt-wrap--wide">
          <SectionHead id="finder-heading" as="h1">
            Find a charger
          </SectionHead>
          <p className="vt-lead">{copy.findCharger.lead}</p>
          {!parsed.ok ? (
            <div className="find-alert">
              <Alert variant="warning" title="Filters were adjusted">
                {Object.values(parsed.errors).join(" ")} Search still works without those values.
              </Alert>
            </div>
          ) : null}
          <FinderShell
            initialQuery={query}
            initialResult={initialResult}
            initialError={null}
            mapConfig={mapConfig}
          />
        </div>
      </div>
    </HeroFieldPage>
  );
}
