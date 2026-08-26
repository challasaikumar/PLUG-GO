import type { ReactNode } from "react";
import { hasPublished } from "@/content/siteConfig";

export function HeroStoreCta({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: ReactNode;
}) {
  const className = "png-btn png-btn--outline png-btn--pill home-hero__store";
  if (hasPublished(href) && href) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <span className={className} title={`${label} is not published yet`}>
      {children}
      <span className="visually-hidden"> is not published yet</span>
    </span>
  );
}
