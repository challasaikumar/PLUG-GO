import { jsonOk, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../_shared";
import { createRoute, listAdminRoutes } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const routes = await listAdminRoutes();
  return jsonOk({ routes });
}

export async function POST(request: Request) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await createRoute(auth.actor, json.value, requestIdFrom(request));
  if (!result.ok) return validation(result.errors);
  return jsonOk({ route: result.route }, 201);
}
