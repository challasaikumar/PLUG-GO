import { jsonError, noStoreJson, ocppErrorResponse, readJson } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { withActorIdempotency } from "@/lib/api/idempotency";
import { csmsCommandService } from "@/lib/ocpp/commands";
import { OcppError } from "@/lib/ocpp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = json.value && typeof json.value === "object" ? (json.value as Record<string, unknown>) : {};
  const connectorId = String(body.connectorId ?? "").trim();
  const reason = String(body.reason ?? "driver_pilot_start").trim() || "driver_pilot_start";
  if (!connectorId) return jsonError(400, "validation_error", "Choose a connector.");
  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() || `start:${auth.driver.id}:${connectorId}:${reason}`;

  try {
    return await withActorIdempotency(request, auth.driver.id, "sessions.start", body, async () => {
      const result = await csmsCommandService.requestRemoteStart({
        actorType: "driver",
        actorId: auth.driver.id,
        driverId: auth.driver.id,
        connectorId,
        reason,
        idempotencyKey,
        bookingId: typeof body.bookingId === "string" ? body.bookingId : null,
      });
      return noStoreJson(
        {
          commandId: result.command.publicRef,
          sessionId: result.command.session?.publicRef ?? result.command.sessionId,
          status: result.command.session?.status ?? "requested",
          reused: result.reused,
          notice:
            "A protocol acceptance is not a successful charge. Wait for the session page to show Charging after meter or transaction evidence.",
        },
        result.reused ? 200 : 201,
      );
    });
  } catch (error) {
    if (error instanceof OcppError) return ocppErrorResponse(error);
    throw error;
  }
}
