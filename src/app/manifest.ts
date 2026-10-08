import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "PLUG & GO",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f7",
    theme_color: "#008f4b",
    lang: "en-IN",
    dir: "ltr",
    icons: [
      {
        src: "/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png",
        sizes: "8300x6342",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png",
        sizes: "8300x6342",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
