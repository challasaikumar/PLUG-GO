import { jsonOk } from "@/lib/api/http";
import { guardDriverRead } from "@/lib/api/driver-guard";
import { driverDocumentView, listDriverDocuments } from "@/lib/booking/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const rows = await listDriverDocuments(auth.driver.id);
  const response = jsonOk({
    documents: rows.map((row) => ({
      ...driverDocumentView(row),
      booking: {
        publicRef: row.booking.publicRef,
        referenceCode: row.booking.referenceCode,
        stationName: row.booking.station.name,
        city: row.booking.station.city,
        state: row.booking.station.state,
        connectorPublicRef: row.booking.connector.publicRef,
        windowStart: row.booking.windowStart.toISOString(),
        windowEnd: row.booking.windowEnd.toISOString(),
        policyVersion: row.booking.policyVersion,
        bookingStatus: row.booking.status,
      },
    })),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
