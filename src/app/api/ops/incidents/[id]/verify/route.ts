import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { verifyIncidentResolution } from "@/lib/ops/incidents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.verifyIncident);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const incident = await verifyIncidentResolution(auth.actor, id, requestIdFrom(request));
    return jsonOk({ incident: { id: incident.id, verifiedAt: incident.verifiedAt } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
