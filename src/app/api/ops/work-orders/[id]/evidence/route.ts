import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { addMaintenanceEvidence } from "@/lib/ops/technician";

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
    const evidence = await addMaintenanceEvidence(
      auth.actor,
      id,
      String(body.storageUrl ?? ""),
      String(body.altText ?? ""),
      requestIdFrom(request),
    );
    return jsonOk({ evidence: { id: evidence.id } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
