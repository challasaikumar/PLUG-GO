import { jsonOk, notFound, publishAuth, requestIdFrom } from "../../../_shared";
import { unpublishInsight } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = publishAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await unpublishInsight(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("Insight");
  return jsonOk({ article: result.article });
}
