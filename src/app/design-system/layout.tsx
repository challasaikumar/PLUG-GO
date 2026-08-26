import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design system",
  description: "Internal Plug and Go component specimen. Not a public page.",
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
