"use client";

import dynamic from "next/dynamic";
import type { PublicMapConfig } from "@/lib/maps/config";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import { MapUnavailable } from "./MapUnavailable";
import { Spinner } from "@/components/ui/Spinner";

const MapboxMap = dynamic(
  () => import("./providers/MapboxMap").then((mod) => mod.MapboxMap),
  {
    ssr: false,
    loading: () => (
      <div className="finder-map-canvas finder-map-canvas--loading">
        <Spinner label="Loading map" />
      </div>
    ),
  },
);

const GoogleMap = dynamic(
  () => import("./providers/GoogleMap").then((mod) => mod.GoogleMap),
  {
    ssr: false,
    loading: () => (
      <div className="finder-map-canvas finder-map-canvas--loading">
        <Spinner label="Loading map" />
      </div>
    ),
  },
);

type StationMapProps = {
  config: PublicMapConfig;
  stations: PublicStationListItem[];
  selectedId: string | null;
  onSelect: (stationId: string) => void;
};

export function StationMap({ config, stations, selectedId, onSelect }: StationMapProps) {
  if (!config.enabled) {
    return <MapUnavailable reason={config.unavailableReason ?? "Map display is unavailable."} />;
  }

  if (config.provider === "mapbox" && config.mapboxToken) {
    return (
      <MapboxMap
        token={config.mapboxToken}
        stations={stations}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    );
  }

  if (config.provider === "google" && config.googleBrowserKey) {
    return (
      <GoogleMap
        apiKey={config.googleBrowserKey}
        stations={stations}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    );
  }

  return <MapUnavailable reason="Map display is unavailable." />;
}
