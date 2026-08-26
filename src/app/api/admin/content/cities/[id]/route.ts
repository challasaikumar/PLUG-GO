import { jsonOk, notFound, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../../_shared";
import { getAdminCity, updateCity } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const city = await getAdminCity(id);
  if (!city) return notFound("City page");
  return jsonOk({ city });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await updateCity(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("City page");
  if (!result.ok) return validation(result.errors);
  return jsonOk({ city: result.city });
}
