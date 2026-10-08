"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type HubStreetMapProps = {
  lat: number;
  lon: number;
  name: string;
};

function pinIcon(name: string) {
  return L.divIcon({
    className: "vt-gpin",
    html: `<span class="vt-gpin__pulse"></span><span class="vt-gpin__mark"></span><span class="visually-hidden">${name}</span>`,
    iconSize: [36, 48],
    iconAnchor: [18, 44],
  });
}

export function HubStreetMap({ lat, lon, name }: HubStreetMapProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || mapRef.current) return;

    const map = L.map(node, {
      center: [lat, lon],
      zoom: 16,
      minZoom: 12,
      maxZoom: 19,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
      fadeAnimation: false,
    });

    map.attributionControl.setPrefix(false);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("/api/map-tile?z={z}&x={x}&y={y}", {
      attribution:
        'Tiles © <a href="https://www.esri.com/">Esri</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      keepBuffer: 6,
      updateWhenZooming: false,
    }).addTo(map);

    markerRef.current = L.marker([lat, lon], { icon: pinIcon(name), keyboard: false }).addTo(map);
    mapRef.current = map;

    const enableWheel = () => map.scrollWheelZoom.enable();
    map.once("click", enableWheel);
    map.once("focus", enableWheel);

    const frame = requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // First paint only; later moves are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lon]);
    marker.setIcon(pinIcon(name));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo([lat, lon], 16, { duration: reduce ? 0 : 0.8, animate: !reduce });
    requestAnimationFrame(() => map.invalidateSize());
  }, [lat, lon, name]);

  return <div ref={nodeRef} className="vt-loc-map__canvas" role="application" aria-label={`Street map of ${name}`} />;
}
