import { getSiteUrl } from "@/lib/env";
import { signInternalBody } from "./hmac";
import { publishRealtime } from "./hub";
import type { PublicRealtimeEvent } from "./types";

export class RealTimeEventPublisher {
  async publish(event: PublicRealtimeEvent): Promise<void> {
    publishRealtime(event);
    const target = process.env.OCPP_EVENT_PUBLISHER_URL?.trim();
    if (!target || process.env.CSMS_PROCESS !== "true") return;
    const body = JSON.stringify({ event });
    const signed = signInternalBody(body);
    try {
      await fetch(target, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-png-csms-timestamp": signed.timestamp,
          "x-png-csms-signature": signed.signature,
        },
        body,
      });
    } catch {
      // Local hub already received the event. Remote fan-out is best-effort.
    }
  }

  async publishMany(events: PublicRealtimeEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

export const realTimeEventPublisher = new RealTimeEventPublisher();

export function defaultRealtimeIngestUrl(): string {
  return `${getSiteUrl()}/api/internal/realtime`;
}
