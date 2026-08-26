import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo/jsonld";

export function ContentBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="station-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.path}-${item.name}`} aria-current={last ? "page" : undefined}>
              {last ? (
                item.name
              ) : (
                <Link className="png-link" href={item.path}>
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ArticleParagraphs({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <div className="content-prose">
      {blocks.map((block) => (
        <p key={block.slice(0, 80)} className="type-body">
          {block}
        </p>
      ))}
    </div>
  );
}

export function ReviewedNote({
  reviewedAt,
  reviewerName,
}: {
  reviewedAt?: Date | string | null;
  reviewerName?: string | null;
}) {
  if (!reviewedAt) return null;
  const date = new Date(reviewedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <p className="type-caption" style={{ color: "var(--color-text-tertiary)" }}>
      Last reviewed {date}
      {reviewerName ? ` · ${reviewerName}` : ""}
    </p>
  );
}
