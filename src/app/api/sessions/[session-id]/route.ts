import { jsonError, noStoreJson, ocppErrorResponse, readJson } from "@/lib/api/http";
import { guardDriverMutation, guardDriverRead } from "@/lib/api/driver-guard";
import { withActorIdempotency } from "@/lib/api/idempotency";
import { csmsCommandService } from "@/lib/ocpp/commands";
import { driverSessionApiView, getDriverSession } from "@/lib/ocpp/queries";
import { OcppError } from "@/lib/ocpp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ "session-id": string }> }) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const { "session-id": publicRef } = await context.params;
  const session = await getDriverSession(auth.driver.id, publicRef);
  if (!session) return jsonError(404, "not_found", "That charging session was not found.");
  return noStoreJson({ session: driverSessionApiView(session) });
}

export async function POST(request: Request, context: { params: Promise<{ "session-id": string }> }) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const { "session-id": publicRef } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = json.value && typeof json.value === "object" ? (json.value as Record<string, unknown>) : {};
  const action = String(body.action ?? "stop");
  if (action !== "stop") return jsonError(400, "validation_error", "Unsupported session action.");
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || `stop:${auth.driver.id}:${publicRef}`;
  try {
    return await withActorIdempotency(request, auth.driver.id, "sessions.stop", { publicRef, ...body }, async () => {
      const result = await csmsCommandService.requestRemoteStop({
        actorType: "driver",
        actorId: auth.driver.id,
        driverId: auth.driver.id,
        sessionPublicRef: publicRef,
        reason: String(body.reason ?? "driver_stop"),
        idempotencyKey,
      });
      return noStoreJson({
        commandId: result.command.publicRef,
        status: result.command.session?.status ?? "stopping",
        reused: result.reused,
        notice: "Stopping… until the charger reports StopTransaction.",
      });
    });
  } catch (error) {
    if (error instanceof OcppError) return ocppErrorResponse(error);
    throw error;
  }
}
