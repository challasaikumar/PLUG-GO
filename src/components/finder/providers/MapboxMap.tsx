"use client";

import { useEffect, useRef } from "react";
import type { PublicStationListItem } from "@/lib/catalogue/station-service";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { INDIA_OVERVIEW } from "@/lib/maps/view";
import { statusLabel } from "@/lib/status";

type MapboxMapProps = {
  token: string;
  stations: PublicStationListItem[];
  selectedId: string | null;
  onSelect: (stationId: string) => void;
  ariaLabel?: string;
  canvasClassName?: string;
};

type MapboxGL = {
  Map: new (options: Record<string, unknown>) => {
    addControl: (control: unknown) => void;
    on: (event: string, handler: () => void) => void;
    remove: () => void;
    resize: () => void;
    flyTo: (options: Record<string, unknown>) => void;
  };
  Marker: new (options: Record<string, unknown>) => {
    setLngLat: (lngLat: [number, number]) => {
      setPopup: (popup: unknown) => { addTo: (map: unknown) => unknown };
    };
  };
  Popup: new (options: Record<string, unknown>) => {
    setHTML: (html: string) => unknown;
  };
  NavigationControl: new () => unknown;
  accessToken: string;
};

declare global {
  interface Window {
    mapboxgl?: MapboxGL;
  }
}

function loadMapbox(): Promise<MapboxGL> {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  return new Promise((resolve, reject) => {
    const cssId = "mapbox-gl-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js";
    script.async = true;
    script.onload = () => {
      if (window.mapboxgl) resolve(window.mapboxgl);
      else reject(new Error("Mapbox failed to load."));
    };
    script.onerror = () => reject(new Error("Mapbox failed to load."));
    document.head.appendChild(script);
  });
}

export function MapboxMap({
  token,
  stations,
  selectedId,
  onSelect,
  ariaLabel = "Station map",
  canvasClassName = "finder-map-canvas",
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ flyTo: (options: Record<string, unknown>) => void; remove: () => void } | null>(
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
    const markers: Array<{ remove: () => void }> = [];

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = token;
        const center = stations[0]
          ? ([stations[0].longitude, stations[0].latitude] as [number, number])
          : ([INDIA_OVERVIEW.longitude, INDIA_OVERVIEW.latitude] as [number, number]);
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: stations.length ? 10 : INDIA_OVERVIEW.zoom,
          attributionControl: true,
        });
        map.addControl(new mapboxgl.NavigationControl());
        mapRef.current = map;
        map.on("load", () => {
          for (const station of stations) {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
              station.stationId === selectedId ? "finder-marker finder-marker--selected" : "finder-marker";
            button.setAttribute(
              "aria-label",
              `${station.name}, ${statusLabel(station.publicStatus)}`,
            );
            button.addEventListener("click", () => onSelectRef.current(station.stationId));
            const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
              `<strong>${escapeHtml(station.name)}</strong><br/>${escapeHtml(station.city)} · ${escapeHtml(
                station.connectors.map((connector) => connectorTypeLabel(connector.connectorType)).join(", "),
              )}`,
            );
            const marker = new mapboxgl.Marker({ element: button })
              .setLngLat([station.longitude, station.latitude])
              .setPopup(popup)
              .addTo(map);
            markers.push(marker as unknown as { remove: () => void });
          }
        });
      })
      .catch(() => {
        if (containerRef.current) {
          containerRef.current.textContent = "The map provider could not be loaded.";
        }
      });

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Recreate when the station set identity changes, not on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, stations.map((station) => station.stationId).join(",")]);

  useEffect(() => {
    const selected = stations.find((station) => station.stationId === selectedId);
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: 13,
      essential: true,
    });
  }, [selectedId, stations]);

  return <div ref={containerRef} className={canvasClassName} role="application" aria-label={ariaLabel} />;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
