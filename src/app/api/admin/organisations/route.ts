import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk, readJson, requestIdFrom } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { createOrganisation } from "@/lib/catalogue/org-service";
import { getPrisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = guardStaff(ROLE_MATRIX.readCatalogue);
  if (!auth.ok) return auth.response;
  const organisations = await getPrisma().organisation.findMany({ orderBy: { brandName: "asc" } });
  return jsonOk({ organisations });
}

export async function POST(request: Request) {
  const auth = guardStaff(["super_admin", "station_operator"]);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const result = await createOrganisation(auth.actor, json.value, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(400, "validation_error", "Please correct the highlighted fields.", result.errors);
  }
  return jsonOk({ organisation: result.organisation }, 201);
}
