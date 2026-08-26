"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { copy } from "@/content/copy";
import { marketingAssets } from "@/content/marketingAssets";

const LOOP_MS = 3000;

const slides = [
  {
    key: "find",
    src: marketingAssets.journey.find,
    title: "Find",
    status: "On this site",
    now: true,
    alt: "Driver checking a charging-location map on a phone at night in the rain.",
    body: copy.home.howSteps[0].body,
  },
  {
    key: "arrive",
    src: marketingAssets.journey.arrive,
    title: "Arrive",
    status: "Later",
    now: false,
    alt: "An electric car arriving at a night charging bay after rain.",
    body: copy.home.howSteps[1].body,
  },
  {
    key: "charge",
    src: marketingAssets.journey.charge,
    title: "Charge",
    status: "Later",
    now: false,
    alt: "Hands plugging a CCS2 connector into a car at a charging bay.",
    body: copy.home.howSteps[2].body,
  },
] as const;

export function JourneyLoop() {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inView, setInView] = useState(true);
  const autoPlay = !reduceMotion && inView;

  const goTo = useCallback((next: number) => {
    const clamped = ((next % slides.length) + slides.length) % slides.length;
    if (clamped === indexRef.current) return;
    indexRef.current = clamped;
    setIndex(clamped);
  }, []);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.2)),
      { threshold: [0, 0.2, 0.5, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setTimeout(() => {
      goTo(indexRef.current + 1);
    }, LOOP_MS);
    return () => window.clearTimeout(timer);
  }, [autoPlay, goTo, index]);

  return (
    <div ref={rootRef} className="bay" role="region" aria-label="Find, arrive, and charge">
      <div className="bay__stage">
        <div className="bay__media">
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.key}
              id={`${baseId}-${slide.key}`}
              className={slideIndex === index ? "bay__slide is-active" : "bay__slide"}
              aria-hidden={slideIndex !== index}
            >
              <Image
                src={slide.src}
                alt={slideIndex === index ? slide.alt : ""}
                fill
                sizes="(min-width: 900px) 58vw, 100vw"
                priority={slideIndex === 0}
              />
            </div>
          ))}
          <span className="bay__grain" aria-hidden="true" />
        </div>

        <div className="bay__copy">
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.key}
              className={slideIndex === index ? "bay__panel is-active" : "bay__panel"}
              aria-hidden={slideIndex !== index}
            >
              <p className={slide.now ? "bay__stamp is-now" : "bay__stamp"}>{slide.status}</p>
              <h3 className="bay__title">{slide.title}</h3>
              <p className="bay__body">{slide.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bay__docks" role="tablist" aria-label="Journey steps">
        {slides.map((slide, slideIndex) => {
          const selected = slideIndex === index;
          return (
            <button
              key={slide.key}
              type="button"
              role="tab"
              id={`${baseId}-tab-${slide.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-${slide.key}`}
              className={selected ? "bay__dock is-active" : "bay__dock"}
              onClick={() => goTo(slideIndex)}
            >
              <span className="bay__node" aria-hidden="true" />
              <strong>{slide.title}</strong>
              <small>{slide.status}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
