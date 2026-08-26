import type { ChecklistOutcome } from "@prisma/client";
import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { setChecklistOutcome } from "@/lib/ops/technician";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.technicianField);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const item = await setChecklistOutcome(auth.actor, id, String(body.code ?? ""), body.outcome as ChecklistOutcome);
    return jsonOk({ item: { code: item.code, outcome: item.outcome } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
