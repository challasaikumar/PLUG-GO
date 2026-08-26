import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { StaffActor } from "@/lib/auth/staff";
import { getPrisma } from "@/lib/db/prisma";

export async function withIdempotency(
  request: Request,
  actor: StaffActor,
  route: string,
  body: unknown,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return withActorIdempotency(request, actor.id, route, body, handler);
}

export async function withActorIdempotency(
  request: Request,
  actorId: string,
  route: string,
  body: unknown,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key) {
    return handler();
  }

  const prisma = getPrisma();
  const requestHash = createHash("sha256").update(JSON.stringify(body ?? null)).digest("hex");
  const existing = await prisma.idempotencyRecord.findUnique({
    where: { key_actorId_route: { key, actorId, route } },
  });
  if (existing) {
    if (existing.requestHash !== requestHash) {
      return NextResponse.json(
        {
          ok: false,
          code: "conflict",
          error: "This Idempotency-Key was already used with a different body.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(existing.responseJson, { status: existing.statusCode });
  }

  const response = await handler();
  const payload = await response.clone().json();
  await prisma.idempotencyRecord.create({
    data: {
      key,
      actorId,
      route,
      requestHash,
      statusCode: response.status,
      responseJson: payload,
    },
  });
  return response;
}
