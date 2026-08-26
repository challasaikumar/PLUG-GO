import Link from "next/link";
import { ArticleParagraphs, ContentBreadcrumbs, ReviewedNote } from "@/components/content/ContentChrome";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ALLOWED_RELATED_GUIDES } from "@/lib/content/paths";

const GUIDE_LABELS: Record<(typeof ALLOWED_RELATED_GUIDES)[number], string> = {
  "/how-to-charge": "How to charge",
  "/connector-guide": "Connector guide",
  "/pricing": "Pricing",
  "/safety": "Safety",
  "/find-charger": "Find a charger",
  "/support": "Support",
};

type InsightView = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  authorName?: string | null;
  authorRole?: string | null;
  reviewerName?: string | null;
  publishedAt?: Date | string | null;
  lastReviewedAt?: Date | string | null;
  faqs: Array<{ question: string; answer: string }>;
  relatedGuideHrefs: string[];
  relatedCitySlug?: string | null;
  relatedStations: Array<{ href: string; name: string; city: string }>;
};

export function InsightArticleView({
  article,
  preview = false,
}: {
  article: InsightView;
  preview?: boolean;
}) {
  const published = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article className="content-article">
      {preview ? (
        <p className="type-caption admin-preview-banner">Staff preview — this article is not public.</p>
      ) : null}
      <ContentBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
          { name: article.title, path: `/insights/${article.slug}` },
        ]}
      />
      <header className="page-intro" style={{ paddingTop: 0 }}>
        <p className="type-caption" style={{ color: "var(--color-action-primary)", margin: "0 0 12px" }}>
          Insight
        </p>
        <h1 className="type-h1" style={{ margin: "0 0 16px" }}>
          {article.title}
        </h1>
        <p className="type-body-lg" style={{ margin: "0 0 12px", maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
          {article.excerpt}
        </p>
        <p className="type-caption" style={{ color: "var(--color-text-tertiary)" }}>
          {article.authorName
            ? `${article.authorName}${article.authorRole ? `, ${article.authorRole}` : ""}`
            : "Author not listed"}
          {published ? ` · Published ${published}` : ""}
        </p>
        <ReviewedNote reviewedAt={article.lastReviewedAt} reviewerName={article.reviewerName} />
      </header>

      <ArticleParagraphs text={article.body} />

      <div className="content-cta-row">
        <Button href="/find-charger">Find a charger</Button>
        {article.relatedCitySlug ? (
          <Button href={`/ev-charging/${article.relatedCitySlug}`} variant="outline">
            City charging guide
          </Button>
        ) : null}
      </div>

      {article.relatedGuideHrefs.length ? (
        <section className="page-section" aria-labelledby="insight-guides-heading">
          <h2 id="insight-guides-heading" className="type-h2">
            Related guides
          </h2>
          <ul className="learn-list">
            {article.relatedGuideHrefs.map((href) => (
              <li key={href}>
                <Link href={href}>
                  <span className="type-h3" style={{ fontSize: 20 }}>
                    {GUIDE_LABELS[href as keyof typeof GUIDE_LABELS] ?? href}
                  </span>
                  <span className="type-small" style={{ color: "var(--color-text-secondary)" }}>
                    Practical Plug and Go guidance
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {article.relatedStations.length ? (
        <section className="page-section" aria-labelledby="insight-stations-heading">
          <h2 id="insight-stations-heading" className="type-h2">
            Related published stations
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {article.relatedStations.map((station) => (
              <li key={station.href}>
                <Link className="png-link" href={station.href}>
                  {station.name}
                </Link>
                <span className="type-small" style={{ color: "var(--color-text-secondary)" }}>
                  {" "}
                  · {station.city}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {article.faqs.length ? (
        <section className="page-section" aria-labelledby="insight-faq-heading">
          <h2 id="insight-faq-heading" className="type-h2">
            Questions
          </h2>
          <Accordion
            items={article.faqs.map((faq, index) => ({
              id: `insight-faq-${index}`,
              question: faq.question,
              answer: faq.answer,
            }))}
          />
        </section>
      ) : null}
    </article>
  );
}
