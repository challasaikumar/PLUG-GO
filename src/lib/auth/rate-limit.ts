import { getPrisma } from "@/lib/db/prisma";

const HOUR_MS = 60 * 60 * 1000;

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number = HOUR_MS,
  now = new Date(),
): Promise<{ allowed: true } | { allowed: false; retryAt: Date }> {
  const prisma = getPrisma();
  const existing = await prisma.authRateBucket.findUnique({ where: { key } });
  const windowExpired =
    !existing || now.getTime() - existing.windowStartsAt.getTime() >= windowMs;

  if (windowExpired) {
    await prisma.authRateBucket.upsert({
      where: { key },
      create: { key, count: 1, windowStartsAt: now },
      update: { count: 1, windowStartsAt: now },
    });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAt: new Date(existing.windowStartsAt.getTime() + windowMs) };
  }

  await prisma.authRateBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true };
}
