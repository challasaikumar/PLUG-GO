import { jsonError } from "@/lib/api/http";
import { requireDriverFromRequest, DriverAuthRequiredError } from "@/lib/auth/driver";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { getPrisma } from "@/lib/db/prisma";
import { sseComment, subscribeRealtime } from "@/lib/ocpp/hub";
import { publicLiveUpdatesEnabled } from "@/lib/ocpp/config";
import type { PublicRealtimeEvent } from "@/lib/ocpp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonError(503, "not_configured", "Realtime is unavailable without a database.");
  }
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "public";
  const stationSlug = url.searchParams.get("stationSlug")?.trim() ?? "";
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";

  let driverId: string | null = null;
  if (scope === "session") {
    try {
      driverId = (await requireDriverFromRequest(request)).id;
    } catch (error) {
      if (error instanceof DriverAuthRequiredError) {
        return jsonError(401, "unauthenticated", error.message);
      }
      throw error;
    }
    if (!sessionId) return jsonError(400, "validation_error", "sessionId is required.");
    const prisma = getPrisma();
    const owned = await prisma.chargingSession.findFirst({
      where: { publicRef: sessionId, driverId },
      select: { id: true },
    });
    if (!owned) return jsonError(404, "not_found", "That charging session was not found.");
  } else if (scope !== "public") {
    return jsonError(400, "validation_error", "scope must be public or session.");
  } else if (!stationSlug) {
    return jsonError(400, "validation_error", "stationSlug is required for public updates.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      send(sseComment("plug-and-go-realtime"));
      send(`event: hello\ndata: ${JSON.stringify({ scope, reconnectIsNotChargerReconnect: true })}\n\n`);
      const unsubscribe = subscribeRealtime((event: PublicRealtimeEvent) => {
        if (scope === "public") {
          if (!publicLiveUpdatesEnabled()) return false;
          return event.type === "connector_status" && event.stationSlug === stationSlug;
        }
        return event.type === "session" && event.sessionPublicRef === sessionId;
      }, send);
      const ping = setInterval(() => {
        try {
          send(sseComment("ping"));
        } catch {
          clearInterval(ping);
        }
      }, 25000);
      const close = () => {
        clearInterval(ping);
        unsubscribe();
      };
      request.signal.addEventListener("abort", () => {
        close();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "private, no-store",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
