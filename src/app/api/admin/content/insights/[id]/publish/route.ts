import { jsonOk, notFound, publishAuth, requestIdFrom, validation } from "../../../_shared";
import { publishInsight } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = publishAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await publishInsight(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("Insight");
  if (!result.ok) return validation(result.errors, "This article cannot be published yet.");
  return jsonOk({ article: result.article });
}
