import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/lib/env";
import { organizationJsonLd } from "@/lib/seo/jsonld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_PROMISE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ea1560",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: SITE_NAME,
    description: SITE_PROMISE,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
  },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_PROMISE,
    },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${inter.className} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <JsonLd data={organizationJsonLd()} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
