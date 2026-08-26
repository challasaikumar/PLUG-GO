"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconClose, IconMenu } from "@/components/ui/icons";
import { navigation, siteConfig } from "@/content/siteConfig";

export function Header({
  signedIn = false,
  finderEnabled = true,
  loginEnabled = true,
}: {
  signedIn?: boolean;
  finderEnabled?: boolean;
  loginEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

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
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
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
  const mobileLinks = [...navigation.primary, ...navigation.solutions, ...navigation.help].filter((link) => {
    if (seenHrefs.has(link.href)) return false;
    seenHrefs.add(link.href);
    return true;
  });
  const useBar = !hidePublicNav;
  const overlay = useBar && !open;
  const headerClass = ["header", open ? "header--menu-open" : "", overlay ? "header--overlay" : "header--solid"]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div
        className={useBar ? "header-bar" : "container-png"}
        style={{
          height: useBar ? undefined : "100%",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link href="/" className="header-logo">
          <span className="header-logo__mark" aria-hidden="true">
            P
          </span>
          {siteConfig.name}
        </Link>

        {hidePublicNav ? (
          <p className="type-small" style={{ margin: "0 0 0 auto", opacity: 0.8 }}>
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
        ) : (
          <>
            <nav
              aria-label="Primary"
              className="desktop-nav"
              style={{
                display: "none",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
              }}
            >
              {navigation.primary
                .filter((link) => link.href !== "/find-charger")
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="header-nav-link"
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="desktop-cta" style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                {loginEnabled || signedIn ? (
                  <Button href={signedIn ? "/account" : "/login"} size="sm" variant="outline" className="png-btn--pill">
                    {signedIn ? "Account" : "Sign in"}
                  </Button>
                ) : null}
                {finderEnabled ? (
                  <Button href="/find-charger" size="sm" className="png-btn--pill">
                    Find a charger
                  </Button>
                ) : null}
              </span>
              <button
                ref={menuButtonRef}
                type="button"
                className="png-btn png-btn--outline png-btn--sm mobile-menu-btn"
                style={{ width: 44, padding: 0 }}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <IconClose /> : <IconMenu />}
              </button>
            </div>
          </>
        )}
      </div>

      {open && !hidePublicNav ? (
        <>
          <button
            type="button"
            className="overlay overlay--from-header"
            aria-label="Dismiss menu"
            onClick={() => {
              setOpen(false);
              menuButtonRef.current?.focus();
            }}
          />
          <div
            ref={menuDialogRef}
            id={menuId}
            className="sheet sheet--bottom"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-border-default)",
              }}
            >
              <p className="type-h3" style={{ margin: 0, fontSize: 18 }}>
                Menu
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                className="png-btn png-btn--outline png-btn--sm"
                style={{ width: 44, padding: 0 }}
                aria-label="Close menu"
                onClick={() => {
                  setOpen(false);
                  menuButtonRef.current?.focus();
                }}
              >
                <IconClose />
              </button>
            </div>
            <nav aria-label="Mobile" style={{ padding: 16, display: "grid", gap: 8 }}>
              {finderEnabled ? (
                <Button href="/find-charger" block>
                  Find a charger
                </Button>
              ) : null}
              {loginEnabled || signedIn ? (
                <Button href={signedIn ? "/account" : "/login"} variant="outline" block>
                  {signedIn ? "Account" : "Sign in"}
                </Button>
              ) : null}
              {mobileLinks
                .filter((link) => link.href !== "/find-charger")
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="png-btn png-btn--outline png-btn--block"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>
          </div>
        </>
      ) : null}

      <style>{`
        @media (min-width: 768px) {
          .desktop-cta { display: inline-flex; }
        }
        @media (max-width: 1279px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: inline-flex !important; }
        }
        @media (min-width: 1280px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .header-bar .desktop-cta { margin-left: 0; }
        }
        @media (max-width: 767px) {
          .desktop-cta { display: none; }
        }
      `}</style>
    </header>
  );
}
