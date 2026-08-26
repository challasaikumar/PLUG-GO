import { jsonError, noStoreJson } from "@/lib/api/http";
import { verifyInternalSignature } from "@/lib/ocpp/hmac";
import { publishRealtime } from "@/lib/ocpp/hub";
import type { PublicRealtimeEvent } from "@/lib/ocpp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPublicEvent(value: unknown): value is PublicRealtimeEvent {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return row.type === "connector_status" || row.type === "session";
}

export async function POST(request: Request) {
  const body = await request.text();
  const timestamp = request.headers.get("x-png-csms-timestamp");
  const signature = request.headers.get("x-png-csms-signature");
  if (!verifyInternalSignature(body, timestamp, signature)) {
    return jsonError(401, "forbidden", "Invalid internal signature.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return jsonError(400, "validation_error", "Invalid JSON.");
  }
  const event =
    parsed && typeof parsed === "object" && "event" in parsed
      ? (parsed as { event: unknown }).event
      : parsed;
  if (!isPublicEvent(event)) {
    return jsonError(400, "validation_error", "Unsupported realtime event.");
  }
  publishRealtime(event);
  return noStoreJson({ accepted: true });
}
