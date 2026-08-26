import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation, guardDriverRead } from "@/lib/api/driver-guard";
import { createDriverVehicle, listDriverVehicles } from "@/lib/account/vehicles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const vehicles = await listDriverVehicles(auth.driver.id);
  const response = jsonOk({ vehicles });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await createDriverVehicle(auth.driver.id, json.value, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
  }
  return jsonOk({ vehicle: result.vehicle }, 201);
}
