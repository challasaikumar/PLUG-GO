"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OPS_LINKS = [
  { href: "/ops", label: "Overview" },
  { href: "/ops/stations", label: "Stations" },
  { href: "/ops/incidents", label: "Incidents" },
  { href: "/ops/commands", label: "Commands" },
  { href: "/ops/support", label: "Support" },
  { href: "/ops/finance", label: "Finance" },
  { href: "/ops/flags", label: "Flags" },
];

export function OpsNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = OPS_LINKS.filter((link) => {
    if (link.href === "/ops/finance" && role !== "finance" && role !== "super_admin") return false;
    if (link.href === "/ops/flags" && role !== "super_admin") return false;
    if (link.href === "/ops/commands" && role === "finance") return false;
    if (link.href === "/ops/support" && role === "finance") return false;
    if (link.href === "/ops/commands" && role === "content_manager") return false;
    return true;
  });
  return (
    <nav className="ops-nav" aria-label="Operations">
      {links.map((link) => {
        const current =
          link.href === "/ops" ? pathname === "/ops" : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
