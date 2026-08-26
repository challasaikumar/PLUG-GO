import { NextResponse } from "next/server";
import { readyHealth } from "@/lib/release/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await readyHealth();
  const response = NextResponse.json(body, { status: body.ready ? 200 : 503 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
