import { siteConfig, hasPublished } from "@/content/siteConfig";
import { canonicalUrl, getSiteUrl } from "@/lib/env";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type VisibleFaq = {
  question: string;
  answer: string;
};

export function organizationJsonLd() {
  const url = getSiteUrl();
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name: siteConfig.name,
    url: `${url}/`,
    description: siteConfig.promise,
  };

  if (hasPublished(siteConfig.identity.registeredAddress)) {
    organization.address = {
      "@type": "PostalAddress",
      streetAddress: siteConfig.identity.registeredAddress,
      addressCountry: "IN",
    };
  }
  if (hasPublished(siteConfig.contact.supportPhone)) {
    organization.telephone = siteConfig.contact.supportPhone;
  }
  if (hasPublished(siteConfig.contact.supportEmail)) {
    organization.email = siteConfig.contact.supportEmail;
  }

  const sameAs = [
    siteConfig.social.twitter,
    siteConfig.social.linkedin,
    siteConfig.social.instagram,
    siteConfig.social.facebook,
    siteConfig.social.youtube,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  if (sameAs.length) organization.sameAs = sameAs;

  return {
    "@context": "https://schema.org",
    ...organization,
  };
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(faqs: VisibleFaq[]) {
  const visible = faqs.filter((faq) => faq.question.trim() && faq.answer.trim());
  if (visible.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visible.map((faq) => ({
      "@type": "Question",
      name: faq.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.trim(),
      },
    })),
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string | Date | null;
  dateModified?: string | Date | null;
  authorName?: string | null;
}) {
  const url = canonicalUrl(input.path);
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: `${getSiteUrl()}/`,
    },
  };
  if (input.authorName) {
    article.author = { "@type": "Person", name: input.authorName };
  }
  if (input.datePublished) {
    article.datePublished = new Date(input.datePublished).toISOString();
  }
  if (input.dateModified) {
    article.dateModified = new Date(input.dateModified).toISOString();
  }
  return article;
}

export function containsReviewSchema(value: unknown): boolean {
  const text = JSON.stringify(value);
  return /"@type"\s*:\s*"(AggregateRating|Review)"/.test(text) || /"aggregateRating"|"reviewRating"/.test(text);
}
