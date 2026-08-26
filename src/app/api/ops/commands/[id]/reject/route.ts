import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { rejectCommand } from "@/lib/ops/commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.approveCommand);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  try {
    const result = await rejectCommand(auth.actor, id, requestIdFrom(request));
    return jsonOk({ approval: { id: result.id, status: result.status } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
