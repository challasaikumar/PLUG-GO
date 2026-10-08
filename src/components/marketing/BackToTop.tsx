"use client";

import { useEffect, useState } from "react";

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="back-top__icon" aria-hidden="true">
      <path
        fill="black"
        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      />
    </svg>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".home-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      className={visible ? "back-top is-visible" : "back-top"}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={visible ? undefined : true}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <span className="back-top__box">
        <span className="back-top__elem">
          <ArrowUp />
        </span>
        <span className="back-top__elem">
          <ArrowUp />
        </span>
      </span>
    </button>
  );
}
