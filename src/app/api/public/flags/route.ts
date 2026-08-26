import { jsonOk } from "@/lib/api/http";
import { getPublicFlagSnapshot } from "@/lib/release/public-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public booleans only. Secrets, OTP, payment, and OCPP credentials are never included. */
export async function GET() {
  const flags = await getPublicFlagSnapshot();
  const response = jsonOk({ flags });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
