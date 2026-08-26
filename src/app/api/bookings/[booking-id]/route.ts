import { bookingErrorResponse, jsonOk } from "@/lib/api/http";
import { guardDriverRead } from "@/lib/api/driver-guard";
import { driverBookingView, getDriverBooking } from "@/lib/booking/queries";
import { BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ "booking-id": string }> },
) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const { "booking-id": publicRef } = await context.params;
  try {
    const booking = await getDriverBooking(auth.driver.id, publicRef);
    const response = jsonOk({ booking: driverBookingView(booking) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof BookingError) return bookingErrorResponse(error);
    throw error;
  }
}
