import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { assignSupportTicket } from "@/lib/ops/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.assignSupport);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const assignment = await assignSupportTicket(auth.actor, id, String(body.assigneeActorId ?? ""), requestIdFrom(request));
    return jsonOk({ assignment: { id: assignment.id } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
