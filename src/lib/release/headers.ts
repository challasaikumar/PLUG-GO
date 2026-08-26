/**
 * Browser-facing security headers. CSP allows the current App Router and optional maps.
 * Secrets never belong in these values.
 */

export const SECURITY_HEADER_LIST: Array<{ key: string; value: string }> = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "media-src 'self'",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://*.googleapis.com https://checkout.razorpay.com",
      "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.googleapis.com https://*.gstatic.com https://api.razorpay.com",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

export function productionTransportHeaders(): Array<{ key: string; value: string }> {
  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "Content-Security-Policy",
      value: `${SECURITY_HEADER_LIST.find((row) => row.key === "Content-Security-Policy")?.value}; upgrade-insecure-requests`,
    },
  ];
}

export function allSecurityHeaders(isProduction: boolean): Array<{ key: string; value: string }> {
  if (!isProduction) return SECURITY_HEADER_LIST;
  const withoutCsp = SECURITY_HEADER_LIST.filter((row) => row.key !== "Content-Security-Policy");
  return [...withoutCsp, ...productionTransportHeaders()];
}
