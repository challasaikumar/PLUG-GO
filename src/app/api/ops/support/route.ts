import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { addSupportNote, assignSupportTicket, listSupportQueue } from "@/lib/ops/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = guardOps(ROLE_MATRIX.readSupportQueue);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  try {
    const queue = await listSupportQueue(auth.actor, {
      category: url.searchParams.get("category") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      stationId: url.searchParams.get("station") ?? undefined,
    });
    const response = jsonOk(queue);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}

export async function POST(request: Request) {
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  if (body.op === "assign") {
    const auth = guardOps(ROLE_MATRIX.assignSupport);
    if (!auth.ok) return auth.response;
    try {
      const assignment = await assignSupportTicket(auth.actor, String(body.issueId ?? ""), String(body.assigneeActorId ?? ""), requestIdFrom(request));
      return jsonOk({ assignment: { id: assignment.id } });
    } catch (error) {
      return asOpsFailure(error);
    }
  }
  const auth = guardOps(ROLE_MATRIX.readSupportQueue);
  if (!auth.ok) return auth.response;
  try {
    const note = await addSupportNote(
      auth.actor,
      String(body.issueId ?? ""),
      String(body.body ?? ""),
      body.customerVisible === true,
      typeof body.templateId === "string" ? body.templateId : undefined,
      requestIdFrom(request),
    );
    return jsonOk({ note: { id: note.id } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
