import { driverErrorResponse, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { isSameOriginMutation } from "@/lib/auth/csrf";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { requestDriverOtp } from "@/lib/auth/otp";
import { clientIp } from "@/lib/account/audit";

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
    const result = await requestDriverOtp({
      phone: body.phone,
      ip: clientIp(request),
    });
    return jsonOk({
      challengeId: result.challengeId,
      expiresAt: result.expiresAt,
      resendAvailableAt: result.resendAvailableAt,
      ...(result.developmentCode ? { developmentCode: result.developmentCode } : {}),
    });
  } catch (error) {
    return driverErrorResponse(error);
  }
}
