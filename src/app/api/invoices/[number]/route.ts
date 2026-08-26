import { bookingErrorResponse, jsonOk } from "@/lib/api/http";
import { guardDriverRead } from "@/lib/api/driver-guard";
import { driverDocumentView, getDriverDocument } from "@/lib/booking/queries";
import { BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ number: string }> },
) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const { number } = await context.params;
  try {
    const document = await getDriverDocument(auth.driver.id, decodeURIComponent(number));
    const response = jsonOk({
      document: {
        ...driverDocumentView(document),
        booking: {
          publicRef: document.booking.publicRef,
          referenceCode: document.booking.referenceCode,
          stationName: document.booking.station.name,
          city: document.booking.station.city,
          state: document.booking.station.state,
          connectorPublicRef: document.booking.connector.publicRef,
          windowStart: document.booking.windowStart.toISOString(),
          windowEnd: document.booking.windowEnd.toISOString(),
          policyVersion: document.booking.policyVersion,
          status: document.booking.status,
        },
      },
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof BookingError) return bookingErrorResponse(error);
    throw error;
  }
}
