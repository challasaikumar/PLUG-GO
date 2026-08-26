import { jsonOk, notFound, publishAuth, requestIdFrom, validation } from "../../../_shared";
import { publishRoute } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = publishAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await publishRoute(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("Route guide");
  if (!result.ok) return validation(result.errors, "This route guide cannot be published yet.");
  return jsonOk({ route: result.route });
}
