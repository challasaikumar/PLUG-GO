import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export async function writeDriverAudit(input: {
  driverId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  summary?: Prisma.InputJsonValue;
  requestId?: string;
}) {
  const prisma = getPrisma();
  await prisma.driverAuditEvent.create({
    data: {
      driverId: input.driverId ?? undefined,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      summary: input.summary,
      requestId: input.requestId,
    },
  });
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  const value = forwarded || real || null;
  if (!value || value.length > 64) return null;
  return value;
}
