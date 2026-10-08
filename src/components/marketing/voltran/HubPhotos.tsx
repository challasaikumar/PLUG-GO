"use client";

import Image from "next/image";
import { useState } from "react";

export function HubPhotos({ name, photos }: { name: string; photos: readonly string[] }) {
  const [open, setOpen] = useState(false);
  if (photos.length === 0) {
    return <div className="vt-hub__tile" aria-hidden="true" />;
  }

  const shown = open ? photos : photos.slice(0, 1);

  return (
    <div className="vt-hub__photos">
      {shown.map((src, index) => (
        <div className={`relative ${index === 0 ? "vt-hub__cover" : "vt-hub__extra"}`} key={src}>
          <Image
            src={src}
            alt={index === 0 ? `${name} charge hub` : ""}
            fill
            unoptimized
            sizes="(min-width: 960px) 400px, 100vw"
          />
        </div>
      ))}
      {photos.length > 1 && !open ? (
        <button type="button" className="vt-hub__view-all" onClick={() => setOpen(true)}>
          View All
        </button>
      ) : null}
    </div>
  );
}
