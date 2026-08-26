import { jsonOk, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../_shared";
import { createAuthor, listAdminAuthors } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const authors = await listAdminAuthors();
  return jsonOk({ authors });
}

export async function POST(request: Request) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await createAuthor(auth.actor, json.value, requestIdFrom(request));
  if (!result.ok) return validation(result.errors);
  return jsonOk({ author: result.author }, 201);
}
