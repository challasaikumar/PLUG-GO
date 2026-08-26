import type { IncidentSeverity } from "@prisma/client";
import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { createIncident, listIncidents } from "@/lib/ops/incidents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = guardOps(ROLE_MATRIX.readOps);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  try {
    const incidents = await listIncidents(auth.actor, {
      stationId: url.searchParams.get("station") ?? undefined,
      technicianId: url.searchParams.get("technician") ?? undefined,
      city: url.searchParams.get("city") ?? undefined,
      severity: (url.searchParams.get("severity") as IncidentSeverity | null) ?? undefined,
    });
    const response = jsonOk({ incidents: incidents.map((row) => ({ id: row.id, title: row.title, status: row.status, severity: row.severity, stationId: row.stationId })) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}

export async function POST(request: Request) {
  const auth = guardOps(ROLE_MATRIX.writeIncidents);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const incident = await createIncident(auth.actor, {
      stationId: String(body.stationId ?? ""),
      title: String(body.title ?? ""),
      summary: String(body.summary ?? ""),
      severity: (body.severity as IncidentSeverity) ?? "medium",
      connectorId: typeof body.connectorId === "string" ? body.connectorId : null,
      requestId: requestIdFrom(request),
    });
    const response = jsonOk({ incident: { id: incident.id, publicRef: incident.publicRef, status: incident.status } }, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}
