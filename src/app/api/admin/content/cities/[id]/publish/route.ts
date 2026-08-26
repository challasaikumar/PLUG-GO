import { jsonOk, notFound, publishAuth, requestIdFrom, validation } from "../../../_shared";
import { publishCity } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = publishAuth();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await publishCity(auth.actor, id, requestIdFrom(request));
  if ("notFound" in result && result.notFound) return notFound("City page");
  if (!result.ok) return validation(result.errors, "This city page cannot be published yet.");
  return jsonOk({ city: result.city });
}
