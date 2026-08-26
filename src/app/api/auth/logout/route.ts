import { jsonError, jsonOk } from "@/lib/api/http";
import { isSameOriginMutation } from "@/lib/auth/csrf";
import { clearSessionCookie, readSessionTokenFromRequest, revokeSessionByToken } from "@/lib/auth/session";
import { writeDriverAudit } from "@/lib/account/audit";
import { resolveDriverSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return jsonError(403, "forbidden", "This request could not be verified.");
  }
  const token = readSessionTokenFromRequest(request);
  const session = await resolveDriverSession(token).catch(() => null);
  await revokeSessionByToken(token).catch(() => undefined);
  if (session) {
    await writeDriverAudit({
      driverId: session.id,
      action: "auth.logout",
      targetType: "session",
      targetId: session.sessionId,
    });
  }
  const response = jsonOk({ signedOut: true });
  clearSessionCookie(response);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
