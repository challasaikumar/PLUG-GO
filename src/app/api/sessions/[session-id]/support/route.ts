import { jsonError, noStoreJson, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { getPrisma } from "@/lib/db/prisma";
import { getDriverSession } from "@/lib/ocpp/queries";
import { chargingSessionService } from "@/lib/ocpp/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ "session-id": string }> }) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const { "session-id": publicRef } = await context.params;
  const session = await getDriverSession(auth.driver.id, publicRef);
  if (!session) return jsonError(404, "not_found", "That charging session was not found.");
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = json.value && typeof json.value === "object" ? (json.value as Record<string, unknown>) : {};
  const description = String(body.details ?? body.description ?? "").trim().slice(0, 2000);
  const prisma = getPrisma();
  const issue = await prisma.supportIssue.create({
    data: {
      category: "did_not_start",
      status: "open",
      stationId: session.stationId,
      connectorId: session.connectorId,
      driverId: auth.driver.id,
      chargingSessionId: session.id,
      description: description || `Driver requested help for session ${session.publicRef}`,
      publicReference: session.supportReference ?? `PNG-S-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    },
  });
  await chargingSessionService.transition(session.id, "support_review", "driver.support", description || "Driver support request");
  void requestIdFrom(request);
  return noStoreJson(
    {
      publicReference: issue.publicReference,
      notice: "Support has the station and session reference. This does not issue an energy invoice.",
    },
    201,
  );
}
