import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/design-system",
          "/design-system/",
          "/admin",
          "/admin/",
          "/api/",
          "/api",
          "/account",
          "/account/",
          "/vehicles",
          "/vehicles/",
          "/saved-stations",
          "/saved-stations/",
          "/login",
          "/login/",
          "/scan",
          "/scan/",
          "/offline",
          "/bookings",
          "/bookings/",
          "/payments",
          "/payments/",
          "/invoices",
          "/invoices/",
          "/session",
          "/session/",
          "/ops",
          "/ops/",
          "/technician",
          "/technician/",
          "/partner",
          "/partner/",
          "/fleet",
          "/fleet/",
          "/status",
          "/status/",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
