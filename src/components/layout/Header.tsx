"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { navigation, siteConfig } from "@/content/siteConfig";

function MenuGlyph() {
  return (
    <span className="header-burger" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function navIsCurrent(href: string, pathname: string, hash: string) {
  if (href === "/") return pathname === "/" && (hash === "" || hash === "#");
  if (href.includes("#")) {
    return pathname === "/" && hash === href.slice(href.indexOf("#"));
  }
  if (href === "/blogs") return pathname.startsWith("/blogs");
  if (href === "/gallery") return pathname.startsWith("/gallery");
  if (href === "/contact") return pathname.startsWith("/contact");
  return pathname === href;
}

export function Header({
  signedIn = false,
  finderEnabled: _finderEnabled = true,
  loginEnabled = true,
}: {
  signedIn?: boolean;
  finderEnabled?: boolean;
  loginEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [hash, setHash] = useState("");
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuLayerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const root = menuDialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function preventPageScroll(event: Event) {
      const root = menuDialogRef.current;
      if (root && event.target instanceof Node && root.contains(event.target)) {
        return;
      }
      event.preventDefault();
    }

    function pinLayerToViewport() {
      const layer = menuLayerRef.current;
      if (!layer) return;
      layer.style.position = "fixed";
      layer.style.inset = "0";
      layer.style.height = "100dvh";
      const top = layer.getBoundingClientRect().top;
      if (Math.abs(top) > 2) {
        layer.style.position = "absolute";
        layer.style.inset = "auto";
        layer.style.left = "0";
        layer.style.right = "0";
        layer.style.top = `${window.scrollY}px`;
        layer.style.height = `${window.innerHeight}px`;
      }
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("touchmove", preventPageScroll, { passive: false });
    document.addEventListener("wheel", preventPageScroll, { passive: false });
    requestAnimationFrame(pinLayerToViewport);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", preventPageScroll);
      document.removeEventListener("wheel", preventPageScroll);
    };
  }, [open]);

  const hidePublicNav =
    pathname.startsWith("/design-system") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ops") ||
    pathname.startsWith("/technician") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/fleet");
  const seenHrefs = new Set<string>();
  const mobileLinks = [...navigation.primary].filter((link) => {
    if (seenHrefs.has(link.href)) return false;
    seenHrefs.add(link.href);
    return true;
  });
  const useBar = !hidePublicNav;
  const overlay =
    useBar && (pathname === "/" || pathname === "/gallery" || pathname === "/blogs" || pathname === "/contact");
  const headerClass = ["header", overlay ? "header--overlay" : "header--solid"].filter(Boolean).join(" ");

  function closeMenu() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  const menu = open && useBar && mounted && (
    <div ref={menuLayerRef} className="header-menu-layer" onClick={closeMenu} role="presentation">
      <div
        ref={menuDialogRef}
        id={menuId}
        className="header-menu-layer__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="header-dock header-dock--menu">
          <Link href="/" className="header-brand" aria-label={siteConfig.name} onClick={closeMenu}>
            <BrandLogo className="header-brand__logo" />
          </Link>
          <div className="header-end">
            <div className="header-actions">
              <Link
                href="/#locations"
                className="header-find"
                onClick={() => {
                  setHash("#locations");
                  setOpen(false);
                }}
              >
                <span className="header-find__long">Find a charger</span>
                <span className="header-find__short">Find</span>
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                className="header-menu-btn is-open"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <MenuGlyph />
                <span className="header-menu-btn__text">Close</span>
              </button>
            </div>
          </div>
        </div>
        <nav aria-label="Mobile" className="header-sheet__nav">
          {mobileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="header-sheet__link"
              aria-current={navIsCurrent(link.href, pathname, hash) ? "page" : undefined}
              onClick={() => {
                if (link.href.includes("#")) setHash(link.href.slice(link.href.indexOf("#")));
                if (link.href === "/") setHash("");
                setOpen(false);
              }}
            >
              {link.label}
            </Link>
          ))}
          {loginEnabled || signedIn ? (
            <Link href={signedIn ? "/account" : "/login"} className="header-sheet__link" onClick={() => setOpen(false)}>
              {signedIn ? "Account" : "Sign in"}
            </Link>
          ) : null}
        </nav>
      </div>
    </div>
  );

  return (
    <header className={headerClass}>
      {useBar ? (
        <div className="header-dock">
          <Link href="/" className="header-brand" aria-label={siteConfig.name}>
            <BrandLogo className="header-brand__logo" priority />
          </Link>

          <nav aria-label="Primary" className="header-nav">
            {navigation.primary.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="header-nav-link"
                aria-current={navIsCurrent(link.href, pathname, hash) ? "page" : undefined}
                onClick={() => {
                  if (link.href.includes("#")) setHash(link.href.slice(link.href.indexOf("#")));
                  if (link.href === "/") setHash("");
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-end">
            {loginEnabled || signedIn ? (
              <Link className="header-signin" href={signedIn ? "/account" : "/login"}>
                {signedIn ? "Account" : "Sign in"}
              </Link>
            ) : null}
            <div className="header-actions">
              <Link href="/#locations" className="header-find" onClick={() => setHash("#locations")}>
                <span className="header-find__long">Find a charger</span>
                <span className="header-find__short">Find</span>
              </Link>
              <button
                ref={menuButtonRef}
                type="button"
                className="header-menu-btn"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls={menuId}
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
              >
                <MenuGlyph />
                <span className="header-menu-btn__text">Menu</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-png header-internal">
          <Link href="/" className="header-logo" aria-label={siteConfig.name}>
            <BrandLogo className="header-logo__img" />
          </Link>
          <p className="type-small header-internal__note">
            {pathname.startsWith("/admin")
              ? "Internal admin"
              : pathname.startsWith("/ops")
                ? "Internal operations"
                : pathname.startsWith("/technician")
                  ? "Technician"
                  : pathname.startsWith("/partner")
                    ? "Host portal"
                    : pathname.startsWith("/fleet")
                      ? "Fleet portal"
                      : "Internal preview"}
          </p>
        </div>
      )}

      {menu ? createPortal(menu, document.body) : null}
    </header>
  );
}
