"use client";

import dynamic from "next/dynamic";
import type { PublicMapConfig } from "@/lib/maps/config";
import type { PublicStationListItem } from "@/lib/catalogue/published-hubs";
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
  const selected = stations.find((station) => station.stationId === selectedId) ?? stations[0];
  if (selected?.embedUrl) {
    return (
      <iframe
        className="finder-map-canvas"
        src={selected.embedUrl}
        title={`Google Map of ${selected.name}`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

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
