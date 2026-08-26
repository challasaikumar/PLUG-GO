import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation, guardDriverRead } from "@/lib/api/driver-guard";
import { listSavedStations, savePublishedStation } from "@/lib/account/saved-stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const stations = await listSavedStations(auth.driver.id);
  const response = jsonOk({ stations });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const slug =
    json.value && typeof json.value === "object" && "slug" in json.value
      ? String((json.value as { slug: unknown }).slug)
      : "";
  if (!slug.trim()) {
    return jsonError(400, "validation_error", "Choose a published station to save.");
  }
  const result = await savePublishedStation(auth.driver.id, slug.trim(), requestIdFrom(request));
  if (!result.ok) {
    return jsonError(404, "not_found", "That station is not available to save.");
  }
  return jsonOk({ savedId: result.savedId, slug: result.slug }, 201);
}
