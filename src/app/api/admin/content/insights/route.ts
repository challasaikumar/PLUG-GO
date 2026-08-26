import { jsonOk, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../_shared";
import { createInsight, listAdminInsights } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const articles = await listAdminInsights();
  return jsonOk({ articles });
}

export async function POST(request: Request) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await createInsight(auth.actor, json.value, requestIdFrom(request));
  if (!result.ok) return validation(result.errors);
  return jsonOk({ article: result.article }, 201);
}
