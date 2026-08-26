import type { Metadata } from "next";
import { siteConfig } from "@/content/siteConfig";
import { canonicalUrl } from "@/lib/env";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function pageMeta({
  title,
  description,
  path,
  index = true,
}: PageMetaInput): Metadata {
  const url = canonicalUrl(path);
  const isHome = path === "/";
  const brandedTitle = isHome ? siteConfig.name : `${title} · ${siteConfig.name}`;

  return {
    title: isHome ? { absolute: siteConfig.name } : title,
    description,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
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
  };
}
