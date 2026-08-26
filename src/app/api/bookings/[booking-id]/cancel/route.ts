import { bookingErrorResponse, jsonError, jsonOk, parseJsonBody, readJson } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { withActorIdempotency } from "@/lib/api/idempotency";
import { cancelDriverBooking } from "@/lib/booking/cancel";
import { driverBookingView, getDriverBooking } from "@/lib/booking/queries";
import { BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ "booking-id": string }> },
) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const { "booking-id": publicRef } = await context.params;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  const reason = typeof body.reason === "string" ? body.reason : "";
  if (reason.trim().length < 8) {
    return jsonError(400, "validation_error", "A cancellation reason is required.");
  }

  return withActorIdempotency(request, auth.driver.id, `POST /api/bookings/${publicRef}/cancel`, body, async () => {
    try {
      await cancelDriverBooking({
        driverId: auth.driver.id,
        publicRef,
        reason,
        now: new Date(),
      });
      const booking = await getDriverBooking(auth.driver.id, publicRef);
      return jsonOk({ booking: driverBookingView(booking) });
    } catch (error) {
      if (error instanceof BookingError) return bookingErrorResponse(error);
      throw error;
    }
  });
}
