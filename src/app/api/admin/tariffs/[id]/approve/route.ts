import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { approveTariff } from "@/lib/catalogue/hardware-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.approveTariff);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await approveTariff(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return jsonError(404, "not_found", "Tariff not found.");
  if (!result.ok) {
    return jsonError(400, "validation_error", "This tariff cannot be approved.", result.errors);
  }
  return jsonOk({ tariff: result.tariff });
}
