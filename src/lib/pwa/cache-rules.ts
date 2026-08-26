/**
 * Safe PWA cache classification. Mirrored conservatively in public/sw.js.
 * Live station, price, account, and auth responses must never be treated as fresh offline.
 */

export const PRIVATE_PATH_PREFIXES = [
  "/account",
  "/vehicles",
  "/saved-stations",
  "/login",
  "/bookings",
  "/payments",
  "/invoices",
  "/session",
  "/api/account",
  "/api/auth",
  "/api/admin",
  "/api/bookings",
  "/api/payments",
  "/api/invoices",
  "/api/sessions",
  "/api/realtime",
  "/ops",
  "/technician",
  "/partner",
  "/fleet",
  "/api/ops",
  "/status",
  "/api/health",
];

export const LIVE_PATH_PREFIXES = [
  "/api/public",
  "/find-charger",
  "/stations",
  "/scan",
];

export const STATIC_CACHE_PREFIXES = ["/_next/static/", "/icon", "/manifest.webmanifest"];

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isLivePath(pathname: string): boolean {
  return LIVE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isStaticShellPath(pathname: string): boolean {
  if (pathname === "/offline") return true;
  return STATIC_CACHE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}
