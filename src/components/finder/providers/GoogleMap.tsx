"use client";

import { useEffect, useRef } from "react";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import { INDIA_OVERVIEW } from "@/lib/maps/view";
import { statusLabel } from "@/lib/status";

type GoogleMapProps = {
  apiKey: string;
  stations: PublicStationListItem[];
  selectedId: string | null;
  onSelect: (stationId: string) => void;
  ariaLabel?: string;
  canvasClassName?: string;
};

type GoogleMaps = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
      setCenter: (latLng: { lat: number; lng: number }) => void;
      setZoom: (zoom: number) => void;
    };
    Marker: new (opts: Record<string, unknown>) => {
      setMap: (map: unknown) => void;
      addListener: (event: string, handler: () => void) => void;
    };
    InfoWindow: new (opts: Record<string, unknown>) => {
      open: (opts: { map: unknown; anchor: unknown }) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMaps;
  }
}

function loadGoogle(apiKey: string): Promise<GoogleMaps> {
  if (window.google?.maps) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    const callback = `__pngGoogleMapsReady`;
    (window as unknown as Record<string, () => void>)[callback] = () => {
      if (window.google) resolve(window.google);
      else reject(new Error("Google Maps failed to load."));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callback}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });
}

export function GoogleMap({
  apiKey,
  stations,
  selectedId,
  onSelect,
  ariaLabel = "Station map",
  canvasClassName = "finder-map-canvas",
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ setCenter: (latLng: { lat: number; lng: number }) => void; setZoom: (zoom: number) => void } | null>(
    null,
  );
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    let cancelled = false;
    const markers: Array<{ setMap: (map: null) => void }> = [];

    loadGoogle(apiKey)
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const center = stations[0]
          ? { lat: stations[0].latitude, lng: stations[0].longitude }
          : { lat: INDIA_OVERVIEW.latitude, lng: INDIA_OVERVIEW.longitude };
        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom: stations.length ? 10 : INDIA_OVERVIEW.zoom,
          mapTypeControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;
        for (const station of stations) {
          const marker = new google.maps.Marker({
            position: { lat: station.latitude, lng: station.longitude },
            map,
            title: `${station.name} · ${statusLabel(station.publicStatus)}`,
          });
          marker.addListener("click", () => onSelectRef.current(station.stationId));
          markers.push(marker as unknown as { setMap: (map: null) => void });
        }
      })
      .catch(() => {
        if (containerRef.current) {
          containerRef.current.textContent = "The map provider could not be loaded.";
        }
      });

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, stations.map((station) => station.stationId).join(",")]);

  useEffect(() => {
    const selected = stations.find((station) => station.stationId === selectedId);
    if (!selected || !mapRef.current) return;
    mapRef.current.setCenter({ lat: selected.latitude, lng: selected.longitude });
    mapRef.current.setZoom(14);
  }, [selectedId, stations]);

  return <div ref={containerRef} className={canvasClassName} role="application" aria-label={ariaLabel} />;
}
