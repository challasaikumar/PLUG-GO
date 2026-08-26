import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { suggestIncidents } from "@/lib/ops/suggest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const auth = guardOps(ROLE_MATRIX.writeIncidents);
  if (!auth.ok) return auth.response;
  try {
    const result = await suggestIncidents(auth.actor);
    const response = jsonOk(result);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}
