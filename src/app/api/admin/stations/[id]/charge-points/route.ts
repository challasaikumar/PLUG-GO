import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { listStationChargePoints, staffChargePointView } from "@/lib/ocpp/commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = guardStaff(ROLE_MATRIX.readCsms);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const rows = await listStationChargePoints(id);
  return jsonOk({
    chargePoints: rows.map(staffChargePointView),
    notice: "Serials and identities are staff-only. This is not a public CSMS dashboard.",
  });
}
