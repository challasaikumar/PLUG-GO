/**
 * Public map configuration. Browser keys must be domain-restricted at the vendor.
 * Server secrets such as MAPS_API_KEY are never read here.
 */

export type MapProviderId = "none" | "mapbox" | "google";

export type PublicMapConfig = {
  enabled: boolean;
  provider: MapProviderId;
  mapboxToken: string | null;
  googleBrowserKey: string | null;
  unavailableReason: string | null;
};

function trim(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function getPublicMapConfig(): PublicMapConfig {
  const requested = trim(process.env.NEXT_PUBLIC_MAPS_PROVIDER).toLowerCase();
  const mapboxToken = trim(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);
  const googleBrowserKey = trim(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);

  let provider: MapProviderId = "none";
  if (requested === "mapbox" || requested === "google") {
    provider = requested;
  } else if (!requested && mapboxToken) {
    provider = "mapbox";
  } else if (!requested && googleBrowserKey) {
    provider = "google";
  }

  if (provider === "mapbox" && !mapboxToken) {
    return {
      enabled: false,
      provider: "none",
      mapboxToken: null,
      googleBrowserKey: null,
      unavailableReason:
        "Map display is unavailable. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN and restrict it to this site’s domains.",
    };
  }

  if (provider === "google" && !googleBrowserKey) {
    return {
      enabled: false,
      provider: "none",
      mapboxToken: null,
      googleBrowserKey: null,
      unavailableReason:
        "Map display is unavailable. Set NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY and restrict it to this site’s domains.",
    };
  }

  if (provider === "none") {
    return {
      enabled: false,
      provider: "none",
      mapboxToken: null,
      googleBrowserKey: null,
      unavailableReason:
        "Map display is unavailable. The station list below is the complete catalogue for this search.",
    };
  }

  return {
    enabled: true,
    provider,
    mapboxToken: provider === "mapbox" ? mapboxToken : null,
    googleBrowserKey: provider === "google" ? googleBrowserKey : null,
    unavailableReason: null,
  };
}
