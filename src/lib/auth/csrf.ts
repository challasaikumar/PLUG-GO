import { getSiteUrl } from "@/lib/env";

function hostFromUrl(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function expectedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  const siteHost = hostFromUrl(getSiteUrl());
  if (siteHost) hosts.add(siteHost);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase();
  const host = request.headers.get("host")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedHost) hosts.add(forwardedHost);
  if (host) hosts.add(host);
  return hosts;
}

function originHost(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin) return hostFromUrl(origin);
  const referer = request.headers.get("referer");
  if (referer) return hostFromUrl(referer);
  return null;
}

/**
 * Same-origin check for cookie-authenticated mutations.
 * Complements SameSite=Lax session cookies.
 */
export function isSameOriginMutation(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "same-origin") return true;

  const remote = originHost(request);
  if (!remote) {
    return fetchSite === "none" || fetchSite === "same-site";
  }
  return expectedHosts(request).has(remote);
}
