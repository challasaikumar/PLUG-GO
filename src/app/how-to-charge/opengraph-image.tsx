import { ogImageResponse } from "@/lib/seo/og";

export const alt = "How to charge an EV at Plug and Go";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImageResponse({
    kicker: "Plug and Go",
    title: "How to charge, from search to unplug",
    fact: "Find a compatible charger. Know the price.",
  });
}
