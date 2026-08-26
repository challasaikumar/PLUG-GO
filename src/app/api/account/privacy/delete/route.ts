import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { confirmAccountDeletion } from "@/lib/account/privacy";
import { clearSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await confirmAccountDeletion(auth.driver.id, json.value, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(400, "validation_error", result.error);
  }
  const response = jsonOk({ requested: true });
  clearSessionCookie(response);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
