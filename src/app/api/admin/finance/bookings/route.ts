import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonError, jsonOk } from "@/lib/api/http";
import { guardStaff } from "@/lib/api/guard";
import { getStaffBookingByPublicRef } from "@/lib/booking/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = guardStaff(ROLE_MATRIX.readFinance);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const publicRef = url.searchParams.get("ref")?.trim() ?? "";
  if (!publicRef) return jsonError(400, "validation_error", "Provide a booking reference.");
  const booking = await getStaffBookingByPublicRef(publicRef);
  if (!booking) return jsonError(404, "not_found", "That booking was not found.");
  const showProviderIds = auth.actor.role === "finance" || auth.actor.role === "super_admin";
  const response = jsonOk({
    booking: {
      publicRef: booking.publicRef,
      referenceCode: booking.referenceCode,
      status: booking.status,
      totalPaise: booking.totalPaise,
      feePaise: booking.feePaise,
      gstPaise: booking.gstPaise,
      windowStart: booking.windowStart.toISOString(),
      windowEnd: booking.windowEnd.toISOString(),
      policyVersion: booking.policyVersion,
      station: booking.station,
      connector: booking.connector,
      payments: booking.paymentAttempts.map((row) => ({
        status: row.status,
        amountPaise: row.amountPaise,
        provider: showProviderIds ? row.provider : undefined,
        providerOrderId: showProviderIds ? row.providerOrderId : undefined,
        createdAt: row.createdAt.toISOString(),
      })),
      refunds: booking.refunds.map((row) => ({
        id: row.id,
        amountPaise: row.amountPaise,
        status: row.status,
        reason: row.reason,
        createdAt: row.createdAt.toISOString(),
      })),
      documents: booking.documents.map((row) => ({
        kind: row.kind,
        status: row.status,
        number: row.number,
      })),
    },
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
