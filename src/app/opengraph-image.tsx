import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go — Find a compatible charger. Know the price.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImageResponse({
    kicker: "India-focused EV charging",
    title: "Find a compatible charger. Know the price.",
    fact: "Charge with confidence.",
  });
}
