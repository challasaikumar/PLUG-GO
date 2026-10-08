import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Poppins } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteUrl } from "@/lib/env";
import { siteGraphJsonLd } from "@/lib/seo/jsonld";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#008f4b",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | EV charging hubs in AP & TG`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "automotive",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png",
    apple: "/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png",
  },
  openGraph: {
    title: `${SITE_NAME} | EV charging hubs in AP & TG`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | EV charging hubs in AP & TG`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "IN-AP",
    "geo.placename": "Vijayawada",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${poppins.className} ${poppins.variable} ${plexMono.variable}`}>
      <body>
        <JsonLd data={siteGraphJsonLd()} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
