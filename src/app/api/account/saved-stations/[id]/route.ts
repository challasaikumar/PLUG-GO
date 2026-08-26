import { jsonError, jsonOk, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { removeSavedStation } from "@/lib/account/saved-stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await removeSavedStation(auth.driver.id, id, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(404, "not_found", "That saved station was not found.");
  }
  return jsonOk({ deleted: true });
}
