/**
 * Named Plug and Go environments. NODE_ENV=production is not the same as PNG_ENV=production.
 * Staging, pilot, and production must use distinct databases and test vs live credentials.
 */

export const PNG_ENVS = ["development", "staging", "pilot", "production"] as const;
export type PngEnv = (typeof PNG_ENVS)[number];

export function getPngEnv(): PngEnv {
  const raw = process.env.PNG_ENV?.trim().toLowerCase();
  if (raw && (PNG_ENVS as readonly string[]).includes(raw)) return raw as PngEnv;
  return "development";
}

export function isNamedProduction(): boolean {
  return getPngEnv() === "production";
}

export function isNamedStaging(): boolean {
  return getPngEnv() === "staging";
}

export function parseDatabaseHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase() || null;
  } catch {
    const match = url.match(/@([^/:]+)(?::\d+)?\//);
    return match?.[1]?.toLowerCase() ?? null;
  }
}

export function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "0.0.0.0";
}

export function siteUrlIsHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
