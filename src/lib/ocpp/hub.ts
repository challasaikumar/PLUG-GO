import type { PublicRealtimeEvent } from "./types";

type Subscriber = {
  id: string;
  filter: (event: PublicRealtimeEvent) => boolean;
  send: (chunk: string) => void;
};

const subscribers = new Map<string, Subscriber>();

export function subscribeRealtime(
  filter: (event: PublicRealtimeEvent) => boolean,
  send: (chunk: string) => void,
): () => void {
  const id = crypto.randomUUID();
  subscribers.set(id, { id, filter, send });
  return () => {
    subscribers.delete(id);
  };
}

export function publishRealtime(event: PublicRealtimeEvent) {
  const payload = `id: ${event.eventId}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const subscriber of subscribers.values()) {
    if (!subscriber.filter(event)) continue;
    try {
      subscriber.send(payload);
    } catch {
      subscribers.delete(subscriber.id);
    }
  }
}

export function sseComment(text: string): string {
  return `: ${text}\n\n`;
}
