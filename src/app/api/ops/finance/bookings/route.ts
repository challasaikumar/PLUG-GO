import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { lookupFinanceBooking } from "@/lib/ops/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = guardOps(ROLE_MATRIX.readFinanceOps);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const publicRef = url.searchParams.get("ref")?.trim() ?? "";
  if (!publicRef) return jsonError(400, "validation_error", "Provide a booking reference.");
  try {
    const booking = await lookupFinanceBooking(auth.actor, publicRef);
    const response = jsonOk({
      booking: {
        publicRef: booking.publicRef,
        referenceCode: booking.referenceCode,
        status: booking.status,
        totalPaise: booking.totalPaise,
        station: booking.station,
        connector: booking.connector,
        payments: booking.paymentAttempts.map((row) => ({
          status: row.status,
          amountPaise: row.amountPaise,
        })),
        refunds: booking.refunds.map((row) => ({
          id: row.id,
          amountPaise: row.amountPaise,
          status: row.status,
          reason: row.reason,
        })),
      },
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}
