"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HeroGridBackground } from "@/components/marketing/HeroGridBackground";
import { marketingAssets } from "@/content/marketingAssets";

export function HeroVideo({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const reduced = media.matches;
      setReduceMotion(reduced);
      const video = videoRef.current;
      if (!video) return;
      if (reduced) {
        video.pause();
        return;
      }
      void video.play().catch(() => undefined);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section className="home-hero" aria-label="Introduction">
      <HeroGridBackground />
      <div className="home-hero__intro">{children}</div>
      <div className="home-hero__stage">
        <Image
          className="home-hero__poster"
          src={marketingAssets.glimpse[0]}
          alt=""
          fill
          sizes="(min-width: 1024px) 1100px, 100vw"
          priority
          unoptimized
        />
        {reduceMotion ? null : (
          <video
            ref={videoRef}
            className="home-hero__video"
            muted
            playsInline
            loop
            preload="metadata"
            poster={marketingAssets.heroPoster}
            aria-hidden="true"
          >
            <source src={marketingAssets.heroVideo} type="video/mp4" />
          </video>
        )}
      </div>
    </section>
  );
}
