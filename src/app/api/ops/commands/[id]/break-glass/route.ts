import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { breakGlassCommand } from "@/lib/ops/commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.breakGlassCommand);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const result = await breakGlassCommand(auth.actor, id, String(body.expiresAt ?? ""), requestIdFrom(request));
    return jsonOk({ result });
  } catch (error) {
    return asOpsFailure(error);
  }
}
