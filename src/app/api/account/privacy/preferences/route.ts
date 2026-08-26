import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation, guardDriverRead } from "@/lib/api/driver-guard";
import { getNotificationPreference, updateNotificationPreference } from "@/lib/account/privacy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const preference = await getNotificationPreference(auth.driver.id);
  const response = jsonOk({ preference });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function PATCH(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await updateNotificationPreference(auth.driver.id, json.value, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(400, "validation_error", result.error);
  }
  return jsonOk({ preference: result.preference });
}
