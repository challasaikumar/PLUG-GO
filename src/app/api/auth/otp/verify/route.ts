import { applySessionCookie } from "@/lib/auth/session";
import { driverErrorResponse, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { isSameOriginMutation } from "@/lib/auth/csrf";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { verifyDriverOtp } from "@/lib/auth/otp";
import { clientIp, writeDriverAudit } from "@/lib/account/audit";
import { maskE164 } from "@/lib/auth/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonError(503, "not_configured", "The account service is not configured on this server.");
  }
  if (!isSameOriginMutation(request)) {
    return jsonError(403, "forbidden", "This request could not be verified.");
  }
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = json.value && typeof json.value === "object" ? (json.value as Record<string, unknown>) : {};
  try {
    const result = await verifyDriverOtp({
      phone: body.phone,
      challengeId: body.challengeId,
      code: body.code,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    await writeDriverAudit({
      driverId: result.driver.id,
      action: result.isNewAccount ? "auth.signup" : "auth.login",
      targetType: "driver",
      targetId: result.driver.id,
    });
    const response = jsonOk({
      isNewAccount: result.isNewAccount,
      phoneMasked: maskE164(result.driver.phoneE164),
    });
    applySessionCookie(response, result.sessionToken);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return driverErrorResponse(error);
  }
}
