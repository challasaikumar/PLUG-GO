import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.json({
    ok: true,
    ready: true,
    service: "plug-and-go",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
