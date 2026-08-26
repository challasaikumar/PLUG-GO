"use client";

import dynamic from "next/dynamic";
import type { PublicMapConfig } from "@/lib/maps/config";
import { Spinner } from "@/components/ui/Spinner";

const MapboxMap = dynamic(
  () => import("@/components/finder/providers/MapboxMap").then((mod) => mod.MapboxMap),
  {
    ssr: false,
    loading: () => (
      <div className="contact-map-canvas contact-map-canvas--loading">
        <Spinner label="Loading map" />
      </div>
    ),
  },
);

const GoogleMap = dynamic(
  () => import("@/components/finder/providers/GoogleMap").then((mod) => mod.GoogleMap),
  {
    ssr: false,
    loading: () => (
      <div className="contact-map-canvas contact-map-canvas--loading">
        <Spinner label="Loading map" />
      </div>
    ),
  },
);

const OsmMap = dynamic(() => import("./OsmMap").then((mod) => mod.OsmMap), {
  ssr: false,
  loading: () => (
    <div className="contact-map-canvas contact-map-canvas--loading">
      <Spinner label="Loading map" />
    </div>
  ),
});

type LocationMapProps = {
  config: PublicMapConfig;
  ariaLabel?: string;
};

export function LocationMap({ config, ariaLabel = "Map of India" }: LocationMapProps) {
  if (config.provider === "mapbox" && config.mapboxToken) {
    return (
      <MapboxMap
        token={config.mapboxToken}
        stations={[]}
        selectedId={null}
        onSelect={() => undefined}
        ariaLabel={ariaLabel}
        canvasClassName="contact-map-canvas"
      />
    );
  }

  if (config.provider === "google" && config.googleBrowserKey) {
    return (
      <GoogleMap
        apiKey={config.googleBrowserKey}
        stations={[]}
        selectedId={null}
        onSelect={() => undefined}
        ariaLabel={ariaLabel}
        canvasClassName="contact-map-canvas"
      />
    );
  }

  return <OsmMap ariaLabel={ariaLabel} />;
}
