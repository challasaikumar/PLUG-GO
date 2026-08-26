import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { listStationAudit } from "@/lib/catalogue/hardware-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = guardStaff(ROLE_MATRIX.readAudit);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const events = await listStationAudit(id);
  if (!events) return jsonError(404, "not_found", "Station not found.");
  return jsonOk({ events });
}
