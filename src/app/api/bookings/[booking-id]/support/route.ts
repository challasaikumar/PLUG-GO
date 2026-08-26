import { bookingErrorResponse, jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { createBookingSupportTicket } from "@/lib/booking/support";
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
  try {
    const ticket = await createBookingSupportTicket({
      driverId: auth.driver.id,
      publicRef,
      category: typeof body.category === "string" ? body.category : "",
      description: typeof body.description === "string" ? body.description : "",
      requestId: requestIdFrom(request),
    });
    return jsonOk({ ticket }, 201);
  } catch (error) {
    if (error instanceof BookingError) return bookingErrorResponse(error);
    throw error;
  }
}
