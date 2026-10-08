"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { directionsUrl, mapsUrl, voltran } from "@/content/voltran";

const SWAP_MS = 2000;

const amenityCopy: Record<string, string> = {
  "OPEN24-7": "Open 24×7",
  PARKING: "Parking",
  "FREE WIFI": "Wi‑Fi",
  RESTROOM: "Restroom",
};

function MapPin() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.4c-4.1 0-7.4 3.2-7.4 7.3 0 5.4 6.4 13.2 7 14a.6.6 0 0 0 .8 0c.6-.8 7-8.6 7-14 0-4.1-3.3-7.3-7.4-7.3Zm0 10a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z"
      />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path fill="currentColor" d="M21.4 3.1 2.8 10.8c-.9.4-.8 1.7.1 2l5.8 1.7 1.7 5.8c.3.9 1.6 1 2 .1l7.7-18.6c.4-1-.6-2-1.7-1.7Z" />
    </svg>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
      {dir === "prev" ? (
        <path fill="currentColor" d="M15.4 4.6 8 12l7.4 7.4 1.5-1.5L11 12l5.9-5.9-1.5-1.5Z" />
      ) : (
        <path fill="currentColor" d="M8.6 4.6 14.5 12 8.6 19.4l1.5 1.5L17.5 12 10.1 3.1 8.6 4.6Z" />
      )}
    </svg>
  );
}

export function LocationShowcase() {
  const hubs = voltran.hubs;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const hub = hubs[index];

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + hubs.length) % hubs.length);
    },
    [hubs.length],
  );

  useEffect(() => {
    if (hubs.length < 2 || paused) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => go(1), SWAP_MS);
    return () => window.clearInterval(timer);
  }, [go, hubs.length, paused]);

  if (!hub) return null;

  return (
    <div
      className="vt-loc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <SectionHead id="locations-heading">Locations</SectionHead>

      <div
        className="vt-loc-stage"
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const delta = event.changedTouches[0].clientX - start;
          if (delta > 56) go(-1);
          if (delta < -56) go(1);
        }}
      >
        <button type="button" className="vt-loc-arrow vt-loc-arrow--prev" aria-label="Previous location" onClick={() => go(-1)}>
          <Chevron dir="prev" />
        </button>

        <article className="vt-loc-board">
          <div className="vt-loc-map">
            {hubs.map((item, itemIndex) => (
              <iframe
                key={item.name}
                className="vt-loc-map__frame"
                src={item.embedUrl}
                title={`Google Map of ${item.name}`}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ visibility: itemIndex === index ? "visible" : "hidden" }}
              />
            ))}
          </div>

          <div className="vt-loc-detail" aria-live="polite">
            <div className="vt-loc-meta">
              <span className="vt-loc-index">
                {String(index + 1).padStart(2, "0")}
                <span> / {String(hubs.length).padStart(2, "0")}</span>
              </span>
              <span className="vt-loc-live">Open now</span>
            </div>
            <p className="vt-loc-kicker">{hub.area}</p>
            <h3>{hub.name}</h3>
            <p className="vt-loc-address">{hub.address}</p>
            <ul className="vt-amenities">
              {hub.amenities.map((amenity) => (
                <li key={amenity}>{amenityCopy[amenity] ?? amenity}</li>
              ))}
            </ul>
            <div className="vt-loc-actions">
              <a className="vt-loc-cta" href={directionsUrl(hub.mapsQuery)} rel="noreferrer noopener" target="_blank">
                <NavIcon />
                Get directions
              </a>
              <a className="vt-loc-maplink" href={mapsUrl(hub.mapsQuery)} rel="noreferrer noopener" target="_blank">
                <MapPin />
                View on map
              </a>
            </div>
          </div>
        </article>

        <button type="button" className="vt-loc-arrow vt-loc-arrow--next" aria-label="Next location" onClick={() => go(1)}>
          <Chevron dir="next" />
        </button>
      </div>

      <div className="vt-loc-dots" role="tablist" aria-label="Charge hubs">
        {hubs.map((item, itemIndex) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            className={itemIndex === index ? "is-active" : undefined}
            onClick={() => setIndex(itemIndex)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
