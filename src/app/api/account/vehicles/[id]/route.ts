import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { deleteDriverVehicle, updateDriverVehicle } from "@/lib/account/vehicles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await updateDriverVehicle(auth.driver.id, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) {
    return jsonError(404, "not_found", "That vehicle was not found.");
  }
  if (!result.ok) {
    return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
  }
  return jsonOk({ vehicle: result.vehicle });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await deleteDriverVehicle(auth.driver.id, id, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(404, "not_found", "That vehicle was not found.");
  }
  return jsonOk({ deleted: true });
}
