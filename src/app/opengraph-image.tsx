import { ogImageResponse } from "@/lib/seo/og";

export const alt = "PLUG & GO — Find your EV charging station, hub across AP & Telangana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImageResponse({
    kicker: "India-focused EV charging",
    title: "Find your EV charging station, hub across AP & Telangana",
    fact: "Manned hubs, open 24x7.",
  });
}
