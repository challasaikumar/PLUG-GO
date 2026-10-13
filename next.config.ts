import path from "node:path";
import type { NextConfig } from "next";
import { allSecurityHeaders } from "./src/lib/release/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "voltran-space.blr1.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],
  },
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
    ];
  },
};

export default nextConfig;
