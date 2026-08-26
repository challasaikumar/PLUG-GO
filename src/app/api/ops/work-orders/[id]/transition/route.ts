import type { WorkOrderStatus } from "@prisma/client";
import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { transitionWorkOrder } from "@/lib/ops/technician";

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
    const order = await transitionWorkOrder(
      auth.actor,
      id,
      body.toStatus as WorkOrderStatus,
      typeof body.notes === "string" ? body.notes : undefined,
      requestIdFrom(request),
    );
    return jsonOk({ workOrder: { id: order.id, status: order.status } });
  } catch (error) {
    return asOpsFailure(error);
  }
}
