import type { CommandApprovalAction } from "@prisma/client";
import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { listCommandApprovals, requestCommandApproval } from "@/lib/ops/commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = guardOps(ROLE_MATRIX.readCommands);
  if (!auth.ok) return auth.response;
  try {
    const data = await listCommandApprovals(auth.actor);
    const response = jsonOk(data);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}

export async function POST(request: Request) {
  const auth = guardOps(ROLE_MATRIX.requestCommand);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const approval = await requestCommandApproval(auth.actor, {
      action: body.action as CommandApprovalAction,
      stationId: String(body.stationId ?? ""),
      reason: String(body.reason ?? ""),
      mfaAssertion: body.mfaAssertion === true,
      connectorId: typeof body.connectorId === "string" ? body.connectorId : undefined,
      sessionPublicRef: typeof body.sessionPublicRef === "string" ? body.sessionPublicRef : undefined,
      requestId: requestIdFrom(request),
    });
    return jsonOk({ approval: { id: approval.id, status: approval.status, riskNote: approval.riskNote, publicRef: approval.publicRef } }, 201);
  } catch (error) {
    return asOpsFailure(error);
  }
}
