"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconFooterMail,
  IconFooterPhone,
  IconSocGitHub,
  IconSocInstagram,
  IconSocLinkedIn,
  IconSocYouTube,
} from "@/components/layout/footerIcons";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";
import { hasPublished, navigation, siteConfig, unpublished } from "@/content/siteConfig";
import { voltran } from "@/content/voltran";

const socials = [
  { id: "linkedin", href: siteConfig.social.linkedin, label: "LinkedIn", Icon: IconSocLinkedIn },
  { id: "github", href: null, label: "GitHub", Icon: IconSocGitHub },
  { id: "instagram", href: siteConfig.social.instagram, label: "Instagram", Icon: IconSocInstagram },
  { id: "youtube", href: siteConfig.social.youtube, label: "YouTube", Icon: IconSocYouTube },
] as const;

function SocialHit({
  href,
  label,
  social,
  children,
}: {
  href: string | null;
  label: string;
  social: (typeof socials)[number]["id"];
  children: ReactNode;
}) {
  const inner = (
    <>
      <span className="footer-soc__fill" aria-hidden="true" />
      {children}
    </>
  );

  if (hasPublished(href) && href) {
    return (
      <a
        className="footer-soc__hit"
        data-social={social}
        href={href}
        rel="noreferrer noopener"
        target="_blank"
        aria-label={label}
      >
        {inner}
      </a>
    );
  }

  return (
    <span className="footer-soc__hit is-soon" data-social={social} aria-label={`${label} is not published yet`}>
      {inner}
    </span>
  );
}

export function Footer() {
  const pathname = usePathname();
  const internal =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/technician") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/fleet") ||
    pathname.startsWith("/design-system");

  if (internal) {
    return (
      <footer className="footer footer--internal">
        <div className="footer-shell">
          <p className="footer-note">Internal workspace. Not indexed. Not a public driver page.</p>
        </div>
      </footer>
    );
  }

  const email = siteConfig.contact.supportEmail;
  const phone = siteConfig.contact.supportPhone;
  const hours = siteConfig.contact.supportHours;
  const owner = hasPublished(siteConfig.identity.legalEntity)
    ? siteConfig.identity.legalEntity
    : siteConfig.name;

  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-dock">
          <div className="footer-columns">
            <div className="footer-brand">
              <Link href="/" className="footer-logo" aria-label={siteConfig.name}>
                <BrandLogo className="footer-logo__art" />
                <span className="footer-logo__mark">
                  <span className="footer-logo__name">{siteConfig.name}</span>
                  <span className="footer-logo__tag">Safe · smart · open 24×7</span>
                </span>
              </Link>

              <div className="footer-chips" aria-label="Contact">
                {hasPublished(hours) ? <span className="footer-chip footer-chip--live">{hours}</span> : null}
                {hasPublished(phone) && phone ? (
                  <a className="footer-chip" href={`tel:${phone.replace(/\s/g, "")}`}>
                    <IconFooterPhone />
                    {phone}
                  </a>
                ) : (
                  <span className="footer-chip footer-chip--muted">{unpublished(phone)}</span>
                )}
                {hasPublished(email) && email ? (
                  <a className="footer-chip" href={`mailto:${email}`}>
                    <IconFooterMail />
                    {email}
                  </a>
                ) : (
                  <span className="footer-chip footer-chip--muted">{unpublished(email)}</span>
                )}
              </div>

              <address className="footer-address">
                {voltran.offices.map((office) => (
                  <p key={office}>{office}</p>
                ))}
              </address>

              <FooterNewsletter />
            </div>

            <nav className="footer-nav" aria-labelledby="footer-quick-heading">
              <h2 id="footer-quick-heading" className="footer-heading">
                Quick Links
              </h2>
              <ul className="footer-links">
                {navigation.footer.company.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="footer-connect" aria-labelledby="footer-follow-heading">
              <h2 id="footer-follow-heading" className="footer-heading">
                Follow Us
              </h2>
              <ul className="footer-soc">
                {socials.map((item) => (
                  <li key={item.id} className="footer-soc__item">
                    <SocialHit href={item.href} label={item.label} social={item.id}>
                      <item.Icon />
                    </SocialHit>
                    <span className="footer-soc__tip">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-base">
          <p className="footer-copy">© 2026 {owner}. All rights reserved.</p>
          <ul className="footer-legal">
            <li>
              <Link href="/legal/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/legal/terms">Terms and Conditions</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
