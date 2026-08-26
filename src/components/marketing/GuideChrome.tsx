import Link from "next/link";
import type { ReactNode } from "react";

const GUIDES = [
  { href: "/how-to-charge", label: "How to charge" },
  { href: "/connector-guide", label: "Connector guide" },
  { href: "/pricing", label: "Pricing" },
  { href: "/safety", label: "Safety" },
  { href: "/insights", label: "Insights" },
  { href: "/support", label: "Get help" },
] as const;

export function GuideCrumbs({ current }: { current: string }) {
  return (
    <nav className="station-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link className="png-link" href="/">
            Home
          </Link>
        </li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}

export function GuideSiblings({ current }: { current: string }) {
  return (
    <nav className="guide-siblings" aria-label="More guides">
      <p className="guide-siblings__kicker">Learn before you travel</p>
      <ul>
        {GUIDES.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={item.href === current ? "is-current" : undefined}
              aria-current={item.href === current ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function GuidePage({
  variant,
  children,
}: {
  variant: "howto" | "connectors" | "pricing" | "safety" | "insights" | "help";
  children: ReactNode;
}) {
  return <div className={`guide guide--${variant}`}>{children}</div>;
}
