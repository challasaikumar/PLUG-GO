"use client";

import { useEffect } from "react";
import { track, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics";

export function ViewTracker({
  event,
  payload,
}: {
  event: AnalyticsEventName;
  payload?: AnalyticsPayload;
}) {
  const serialized = JSON.stringify(payload ?? {});
  useEffect(() => {
    track(event, payload);
  }, [event, serialized, payload]);
  return null;
}
