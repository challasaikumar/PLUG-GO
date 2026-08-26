import { jsonError, requestIdFrom } from "@/lib/api/http";
import { guardDriverMutation } from "@/lib/api/driver-guard";
import { createDataExport } from "@/lib/account/privacy";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await guardDriverMutation(request);
  if (!auth.ok) return auth.response;
  const result = await createDataExport(auth.driver.id, requestIdFrom(request));
  if (!result.ok) {
    return jsonError(404, "not_found", "The account could not be exported.");
  }
  const body = JSON.stringify(result.payload, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="plug-and-go-data-export.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
