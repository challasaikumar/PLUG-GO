import { jsonOk, notFound, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../../_shared";
import { getAdminRoute, updateRoute } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const route = await getAdminRoute(id);
  if (!route) return notFound("Route guide");
  return jsonOk({ route });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await updateRoute(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("Route guide");
  if (!result.ok) return validation(result.errors);
  return jsonOk({ route: result.route });
}
