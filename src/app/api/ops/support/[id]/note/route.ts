import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { addSupportNote } from "@/lib/ops/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardOps(ROLE_MATRIX.readSupportQueue);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const note = await addSupportNote(
      auth.actor,
      id,
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
