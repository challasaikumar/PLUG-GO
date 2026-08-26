import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { escalateToVendor } from "@/lib/ops/incidents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.writeIncidents);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const incident = await escalateToVendor(auth.actor, id, String(body.body ?? ""), requestIdFrom(request));
    return jsonOk({ incident: { id: incident.id, status: incident.status } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
