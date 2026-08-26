import { JsonLd } from "@/components/seo/JsonLd";
import { GuideCrumbs, GuidePage, GuideSiblings } from "@/components/marketing/GuideChrome";
import { PageIntro } from "@/components/marketing/PageIntro";
import { listPublishedInsights } from "@/lib/content/editorial";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { breadcrumbListJsonLd } from "@/lib/seo/jsonld";
import { pageMeta } from "@/lib/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const breadcrumbs = [
  { name: "Home", path: "/" },
  { name: "Insights", path: "/insights" },
];

export const metadata = pageMeta({
  title: "Insights",
  description:
    "Reviewed Plug and Go articles on charging, access, and local discovery. Only published, human-reviewed pieces appear here.",
  path: "/insights",
});

export default async function InsightsIndexPage() {
  const articles = isDatabaseConfigured() ? await listPublishedInsights() : [];

  return (
    <GuidePage variant="insights">
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      <GuideCrumbs current="Insights" />
      <PageIntro
        title="Insights"
        lead="Short, reviewed pieces tied to real Plug and Go operations. Drafts and placeholders stay off this index."
        eyebrow="Editorial"
      />
      {articles.length === 0 ? (
        <div className="folio">
          <p className="folio__issue">Issue 00</p>
          <h2>No published articles yet</h2>
          <p>
            Insights appear here after an editor reviews and publishes them. We do not generate filler city or keyword
            pages.
          </p>
        </div>
      ) : (
        <ul className="insight-index">
          {articles.map((article) => (
            <li key={article.slug}>
              <a className="insight-card" href={article.href}>
                <span className="insight-card__title">{article.title}</span>
                <span className="insight-card__excerpt">{article.excerpt}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <GuideSiblings current="/insights" />
    </GuidePage>
  );
}
