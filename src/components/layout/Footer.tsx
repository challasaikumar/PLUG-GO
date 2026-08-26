"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconFacebook,
  IconFooterMail,
  IconFooterPhone,
  IconFooterPlug,
  IconInstagram,
  IconLinkedIn,
  IconYouTube,
} from "@/components/layout/footerIcons";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";
import { marketingAssets } from "@/content/marketingAssets";
import { hasPublished, navigation, siteConfig, unpublished } from "@/content/siteConfig";

const socials = [
  { id: "facebook", href: siteConfig.social.facebook, label: "Facebook", Icon: IconFacebook, className: "footer-social--facebook" },
  { id: "instagram", href: siteConfig.social.instagram, label: "Instagram", Icon: IconInstagram, className: "footer-social--instagram" },
  { id: "youtube", href: siteConfig.social.youtube, label: "YouTube", Icon: IconYouTube, className: "footer-social--youtube" },
  { id: "linkedin", href: siteConfig.social.linkedin, label: "LinkedIn", Icon: IconLinkedIn, className: "footer-social--linkedin" },
] as const;

function FooterLinkList({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="footer-heading">{title}</h2>
      <ul className="footer-links">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialMark({
  href,
  label,
  className,
  children,
}: {
  href: string | null;
  label: string;
  className: string;
  children: ReactNode;
}) {
  const classes = `footer-social ${className}${hasPublished(href) ? "" : " footer-social--unpublished"}`;
  if (hasPublished(href) && href) {
    return (
      <a className={classes} href={href} rel="noreferrer noopener" target="_blank">
        {children}
        <span className="visually-hidden">{label}</span>
      </a>
    );
  }
  return (
    <span className={classes} title={`${label} is not published yet`}>
      {children}
      <span className="visually-hidden">{label} is not published yet</span>
    </span>
  );
}

function FooterBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
          return;
        }
        video.pause();
      },
      { threshold: 0.12 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [reduceMotion]);

  return (
    <div className="footer__media" aria-hidden="true">
      {reduceMotion ? (
        <img src={marketingAssets.footerVideoPoster} alt="" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          poster={marketingAssets.footerVideoPoster}
        >
          <source src={marketingAssets.footerVideo} type="video/mp4" />
        </video>
      )}
    </div>
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
          <p className="footer-note">Internal Plug and Go workspace. Not indexed. Not a public driver page.</p>
        </div>
      </footer>
    );
  }

  const email = siteConfig.contact.supportEmail;
  const phone = siteConfig.contact.supportPhone;
  const owner = hasPublished(siteConfig.identity.legalEntity)
    ? siteConfig.identity.legalEntity
    : siteConfig.name;

  return (
    <footer className="footer">
      <FooterBackdrop />
      <div className="footer-shell">
        <div className="footer-columns">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <span className="footer-logo__mark" aria-hidden="true">
                <IconFooterPlug />
              </span>
              <span className="footer-logo__text">
                <span className="footer-logo__name">
                  Plug and <em>Go</em>
                </span>
                <span className="footer-logo__tag">{siteConfig.identity.brandTagline}</span>
              </span>
            </Link>
            <p className="footer-blurb">{siteConfig.promise}</p>
            <FooterNewsletter />
          </div>

          <FooterLinkList title="Company" links={navigation.footer.company} />
          <FooterLinkList title="Support" links={navigation.footer.support} />

          <div className="footer-touch">
            <h2 className="footer-heading">Get in touch</h2>
            <p className="footer-touch__entity">
              {hasPublished(siteConfig.identity.legalEntity)
                ? siteConfig.identity.legalEntity
                : "Legal entity not published yet"}
            </p>
            <p className="footer-touch__address">
              {hasPublished(siteConfig.identity.registeredAddress)
                ? siteConfig.identity.registeredAddress
                : "Registered address not published yet"}
            </p>
            <p className="footer-touch__line">
              <IconFooterMail />
              {hasPublished(email) && email ? (
                <a href={`mailto:${email}`}>{email}</a>
              ) : (
                <span>{unpublished(email)}</span>
              )}
            </p>
            <p className="footer-touch__line">
              <IconFooterPhone />
              {hasPublished(phone) && phone ? (
                <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
              ) : (
                <span>{unpublished(phone)}</span>
              )}
            </p>
            <div className="footer-socials" aria-label="Social profiles">
              {socials.map((item) => (
                <SocialMark key={item.id} href={item.href} label={item.label} className={item.className}>
                  <item.Icon />
                </SocialMark>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-base">
        <div className="footer-shell">
          <p className="footer-copy">
            © 2026, All rights reserved by {owner}. Search published stations without an account.
          </p>
          <ul className="footer-legal">
            <li>
              <Link href="/legal/terms">Terms of service</Link>
            </li>
            <li>
              <Link href="/legal/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/legal/refunds">Refunds</Link>
            </li>
            <li>
              <Link href="/legal/grievance">Grievance</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
