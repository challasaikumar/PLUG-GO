"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { marketingAssets } from "@/content/marketingAssets";

export function HeroVideo({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function arm(el: HTMLVideoElement) {
      el.defaultMuted = true;
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      el.setAttribute("x5-playsinline", "");
      el.setAttribute("autoplay", "");
    }

    async function tryPlay() {
      if (!video || reduced()) {
        video?.pause();
        return;
      }
      arm(video);
      if (video.readyState < 1) {
        video.load();
      }
      try {
        await video.play();
        setNeedsTap(false);
        if (!video.paused) setPlaying(true);
        return true;
      } catch {
        setNeedsTap(true);
        setPlaying(false);
        return false;
      }
    }

    if (reduced()) {
      video.pause();
      return;
    }

    arm(video);
    void tryPlay();

    const onReady = () => {
      void tryPlay();
    };
    const onPlaying = () => {
      setNeedsTap(false);
      setPlaying(true);
    };
    const onError = () => {
      setPlaying(false);
      setNeedsTap(false);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    let tries = 0;
    const retry = window.setInterval(() => {
      if (!video.paused && !video.ended) {
        window.clearInterval(retry);
        return;
      }
      tries += 1;
      void tryPlay();
      if (tries >= 12) window.clearInterval(retry);
    }, 400);

    function unlock() {
      void tryPlay();
    }
    document.addEventListener("pointerdown", unlock, { once: true, passive: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    document.addEventListener("keydown", unlock, { once: true });

    function onVisible() {
      if (document.visibilityState === "visible") void tryPlay();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      window.clearInterval(retry);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

  return (
    <section className="home-hero" aria-label="Introduction">
      <div className="home-hero__intro">{children}</div>
      <div className="home-hero__stage">
        <Image
          className="home-hero__poster"
          src={marketingAssets.heroPoster}
          alt=""
          fill
          sizes="(min-width: 1024px) 1100px, 100vw"
          priority
          unoptimized
        />
        <video
          ref={videoRef}
          className={playing ? "home-hero__video is-playing" : "home-hero__video"}
          muted
          playsInline
          loop
          preload="auto"
          poster={marketingAssets.heroPoster}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
        >
          <source src={marketingAssets.heroVideo} type="video/mp4" />
        </video>
        {needsTap ? (
          <button
            type="button"
            className="home-hero__play"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = true;
              void video.play().then(() => {
                setNeedsTap(false);
                setPlaying(true);
              }).catch(() => undefined);
            }}
            aria-label="Play video"
          >
            <span aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
