import { noStoreJson } from "@/lib/api/http";
import { guardDriverRead } from "@/lib/api/driver-guard";
import { driverSessionApiView, listDriverSessions } from "@/lib/ocpp/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await guardDriverRead(request);
  if (!auth.ok) return auth.response;
  const sessions = await listDriverSessions(auth.driver.id);
  return noStoreJson({ sessions: sessions.map(driverSessionApiView) });
}
