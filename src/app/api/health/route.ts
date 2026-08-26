import { NextResponse } from "next/server";
import { liveHealth } from "@/lib/release/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await liveHealth();
  const response = NextResponse.json(body);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
