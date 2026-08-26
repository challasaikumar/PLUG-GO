import { ogImageResponse } from "@/lib/seo/og";

export const alt = "Plug and Go transparent EV charging pricing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImageResponse({
    kicker: "Plug and Go",
    title: "Know the price before you commit",
    fact: "Estimates are not invoices.",
  });
}
