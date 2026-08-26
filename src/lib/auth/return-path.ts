const BLOCKED_PREFIXES = ["/admin", "/api", "/design-system"];

export function safeReturnPath(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.includes("\\") || trimmed.includes("://")) return fallback;
  if (trimmed.length > 512) return fallback;
  const pathOnly = trimmed.split("?")[0] ?? trimmed;
  if (BLOCKED_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) {
    return fallback;
  }
  return trimmed;
}

export function loginHref(next?: string | null): string {
  const destination = safeReturnPath(next);
  if (destination === "/account") return "/login";
  return `/login?next=${encodeURIComponent(destination)}`;
}
