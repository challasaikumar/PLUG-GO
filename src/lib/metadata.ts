import type { Metadata } from "next";
import { siteConfig } from "@/content/siteConfig";
import { canonicalUrl } from "@/lib/env";
import { SITE_KEYWORDS } from "@/lib/site";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  keywords?: string[];
};

export function pageMeta({
  title,
  description,
  path,
  index = true,
  keywords,
}: PageMetaInput): Metadata {
  const url = canonicalUrl(path);
  const isHome = path === "/";
  const brandedTitle = isHome
    ? `${siteConfig.name} | EV charging hubs in AP & TG`
    : `${title} · ${siteConfig.name}`;
  const keywordList = [...SITE_KEYWORDS, ...(keywords ?? [])];

  return {
    title: isHome ? { absolute: brandedTitle } : title,
    description,
    keywords: keywordList,
    authors: [{ name: siteConfig.name, url: canonicalUrl("/") }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "automotive",
    alternates: { canonical: url },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      title: brandedTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
    },
    other: {
      "geo.region": "IN-AP",
      "geo.placename": "Vijayawada",
      "content-language": "en-IN",
    },
  };
}
