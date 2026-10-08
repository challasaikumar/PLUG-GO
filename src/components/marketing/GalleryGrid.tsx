"use client";

import { useEffect, useState } from "react";
import { galleryItems, type GalleryItem } from "@/content/gallery";

export function GalleryGrid() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [selected]);

  return (
    <>
      <div className="vt-gallery__masonry">
        {galleryItems.map((item) => (
          <figure key={item.id} className="vt-gallery__item">
            <button type="button" className="vt-gallery__hit" onClick={() => setSelected(item)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.title} />
              <span className="vt-gallery__caption">{item.title}</span>
            </button>
          </figure>
        ))}
      </div>

      {selected ? (
        <div className="vt-gallery__lightbox">
          <button
            type="button"
            className="vt-gallery__scrim"
            aria-label="Close photo"
            onClick={() => setSelected(null)}
          />
          <div className="vt-gallery__dialog" role="dialog" aria-modal="true" aria-label={selected.title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.title} />
            <div className="vt-gallery__dialog-bar">
              <p>{selected.title}</p>
              <button type="button" className="vt-gallery__close" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
