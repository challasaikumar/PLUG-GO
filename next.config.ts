import path from "node:path";
import type { NextConfig } from "next";
import { allSecurityHeaders } from "./src/lib/release/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async headers() {
    const security = allSecurityHeaders(process.env.NODE_ENV === "production");
    return [
      {
        source: "/:path*",
        headers: security,
      },
      {
        source: "/status",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/account/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/vehicles",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/saved-stations",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/login",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/bookings/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/bookings",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/payments/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/payments",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/invoices/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/invoices",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/session/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/ops/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/ops",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/technician/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/technician",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/partner/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/partner",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/fleet/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/fleet",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
