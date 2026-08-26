import { bookingErrorResponse, jsonError, jsonOk, parseJsonBody, readJson } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { completeMockCheckout } from "@/lib/payments/mock-complete";
import { BookingError } from "@/lib/booking/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  const publicRef = typeof body.publicRef === "string" ? body.publicRef : "";
  const outcome = body.outcome === "failed" ? "failed" : body.outcome === "captured" ? "captured" : null;
  if (!publicRef || !outcome) {
    return jsonError(400, "validation_error", "Choose a mock checkout outcome.");
  }
  try {
    const result = await completeMockCheckout({
      driverId: auth.driver.id,
      publicRef,
      outcome,
    });
    return jsonOk(result);
  } catch (error) {
    if (error instanceof BookingError) return bookingErrorResponse(error);
    throw error;
  }
}
