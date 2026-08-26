import { jsonOk, notFound, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../../_shared";
import { getAdminInsight, updateInsight } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const article = await getAdminInsight(id);
  if (!article) return notFound("Insight");
  return jsonOk({ article });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await updateInsight(auth.actor, id, json.value, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("Insight");
  if (!result.ok) return validation(result.errors);
  return jsonOk({ article: result.article });
}
