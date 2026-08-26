"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { INDIA_OVERVIEW } from "@/lib/maps/view";
import "leaflet/dist/leaflet.css";

type OsmMapProps = {
  ariaLabel?: string;
};

export function OsmMap({ ariaLabel = "Map of India" }: OsmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const map = L.map(node, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    }).setView([INDIA_OVERVIEW.latitude, INDIA_OVERVIEW.longitude], INDIA_OVERVIEW.zoom);

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const frame = requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="contact-map-canvas" role="application" aria-label={ariaLabel} />;
}
