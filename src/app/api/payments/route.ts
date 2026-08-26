import { jsonOk } from "@/lib/api/http";
import { guardDriverRead } from "@/lib/api/driver-guard";
import { driverPaymentView, listDriverPayments } from "@/lib/booking/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const rows = await listDriverPayments(auth.driver.id);
  const response = jsonOk({
    payments: rows.map((row) => ({
      ...driverPaymentView(row),
      booking: {
        publicRef: row.booking.publicRef,
        referenceCode: row.booking.referenceCode,
        status: row.booking.status,
        stationName: row.booking.station.name,
        city: row.booking.station.city,
      },
    })),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
