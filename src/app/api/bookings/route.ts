import { bookingErrorResponse, jsonError, jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation, guardDriverRead } from "@/lib/api/driver-guard";
import { withActorIdempotency } from "@/lib/api/idempotency";
import { listDriverBookings, driverBookingView } from "@/lib/booking/queries";
import { createBookingHold, BookingError } from "@/lib/booking/service";
import { writeDriverAudit } from "@/lib/account/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const bookings = await listDriverBookings(auth.driver.id);
  const response = jsonOk({ bookings: bookings.map(driverBookingView) });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value);
  if (!body) return jsonError(400, "validation_error", "The booking request could not be read.");

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey) {
    return jsonError(400, "validation_error", "An Idempotency-Key header is required to create a payment hold.");
  }

  return withActorIdempotency(request, auth.driver.id, "POST /api/bookings", body, async () => {
    try {
      const stationSlug = typeof body.stationSlug === "string" ? body.stationSlug : "";
      const connectorId = typeof body.connectorId === "string" ? body.connectorId : "";
      const windowStart = body.windowStart ? new Date(String(body.windowStart)) : new Date();
      const result = await createBookingHold({
        driverId: auth.driver.id,
        stationSlug,
        connectorId,
        windowStart,
        idempotencyKey,
        requestId: requestIdFrom(request),
      });
      await writeDriverAudit({
        driverId: auth.driver.id,
        action: "booking.hold_created",
        targetType: "booking",
        targetId: result.booking.id,
        summary: { reused: result.reused },
        requestId: requestIdFrom(request),
      });
      return jsonOk(
        {
          booking: {
            publicRef: result.booking.publicRef,
            referenceCode: result.booking.referenceCode,
            status: result.booking.status,
            totalPaise: result.booking.totalPaise,
            holdExpiresAt: result.booking.holdExpiresAt?.toISOString() ?? null,
          },
          checkout: result.checkout,
          reused: result.reused,
        },
        result.reused ? 200 : 201,
      );
    } catch (error) {
      if (error instanceof BookingError) return bookingErrorResponse(error);
      throw error;
    }
  });
}
