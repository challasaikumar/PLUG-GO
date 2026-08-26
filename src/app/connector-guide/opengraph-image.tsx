import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go connector and charging-power guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImageResponse({
    kicker: "Plug and Go",
    title: "Connectors, kW, and what they mean",
    fact: "Speed varies by vehicle, battery, and charger.",
  });
}
