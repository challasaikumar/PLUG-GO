import { bookingErrorResponse, jsonError, jsonOk, parseJsonBody, readJson } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { driverBookingView, getDriverBooking } from "@/lib/booking/queries";
import { markPaymentProcessing, BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  const publicRef = typeof body.publicRef === "string" ? body.publicRef : "";
  if (!publicRef) return jsonError(400, "validation_error", "A booking reference is required.");
  try {
    await markPaymentProcessing(auth.driver.id, publicRef);
    const booking = await getDriverBooking(auth.driver.id, publicRef);
    const response = jsonOk({ booking: driverBookingView(booking) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof BookingError) return bookingErrorResponse(error);
    throw error;
  }
}
