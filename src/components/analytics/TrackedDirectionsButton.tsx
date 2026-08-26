"use client";

import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";

export function TrackedDirectionsButton({
  href,
  stationSlug,
  children,
  variant = "primary",
}: {
  href: string;
  stationSlug: string;
  children: string;
  variant?: "primary" | "outline";
}) {
  return (
    <Button
      href={href}
      variant={variant}
      external
      onClick={() => {
        track(ANALYTICS_EVENTS.directions_clicked, { station_slug: stationSlug });
      }}
    >
      {children}
    </Button>
  );
}
