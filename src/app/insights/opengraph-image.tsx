import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go insights";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImageResponse({
    kicker: "Plug and Go",
    title: "Insights",
    fact: "Reviewed articles only. No generated filler.",
  });
}
