import { jsonOk, parseBody, readAuth, requestIdFrom, validation, writeAuth } from "../_shared";
import { createCity, listAdminCities } from "@/lib/content/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = readAuth();
  if (!auth.ok) return auth.response;
  const cities = await listAdminCities();
  return jsonOk({ cities });
}

export async function POST(request: Request) {
  const auth = writeAuth();
  if (!auth.ok) return auth.response;
  const json = await parseBody(request);
  if (!json.ok) return json.response;
  const result = await createCity(auth.actor, json.value, requestIdFrom(request));
  if (!result.ok) return validation(result.errors);
  return jsonOk({ city: result.city }, 201);
}
