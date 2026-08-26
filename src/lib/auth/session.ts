import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import {
  getAuthSecret,
  isProductionRuntime,
  sessionCookieName,
  sessionTtlDays,
} from "./config";
import { generateSessionToken, hashOpaque, hashSessionToken, peekUserAgent } from "./crypto";

export type DriverActor = {
  id: string;
  phoneE164: string;
  phoneCountry: string;
};

export type DriverSessionRecord = DriverActor & {
  sessionId: string;
};

export function sessionCookieOptions(maxAgeSeconds: number) {
  const pngEnv = process.env.PNG_ENV?.trim().toLowerCase();
  const secureNamed = pngEnv === "production" || pngEnv === "staging" || pngEnv === "pilot";
  return {
    name: sessionCookieName(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProductionRuntime() || secureNamed,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function createDriverSession(input: {
  driverId: string;
  ip?: string | null;
  userAgent?: string | null;
  now?: Date;
}): Promise<{ token: string; expiresAt: Date }> {
  const secret = getAuthSecret();
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  const now = input.now ?? new Date();
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + sessionTtlDays() * 24 * 60 * 60 * 1000);
  const prisma = getPrisma();
  await prisma.driverSession.create({
    data: {
      driverId: input.driverId,
      tokenHash: hashSessionToken(token, secret),
      expiresAt,
      ipHash: input.ip ? hashOpaque(input.ip, secret) : null,
      userAgent: peekUserAgent(input.userAgent),
      lastSeenAt: now,
    },
  });
  return { token, expiresAt };
}

export function applySessionCookie(response: NextResponse, token: string) {
  const options = sessionCookieOptions(sessionTtlDays() * 24 * 60 * 60);
  response.cookies.set({
    ...options,
    value: token,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...sessionCookieOptions(0),
    value: "",
    maxAge: 0,
  });
}

export async function readSessionTokenFromCookieStore(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(sessionCookieName())?.value?.trim();
  return value || null;
}

export function readSessionTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const name = sessionCookieName();
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      const value = rest.join("=").trim();
      return value || null;
    }
  }
  return null;
}

export async function resolveDriverSession(
  token: string | null,
  now = new Date(),
): Promise<DriverSessionRecord | null> {
  if (!token) return null;
  const secret = getAuthSecret();
  if (!secret) return null;
  const prisma = getPrisma();
  const tokenHash = hashSessionToken(token, secret);
  const session = await prisma.driverSession.findUnique({
    where: { tokenHash },
    include: { driver: true },
  });
  if (!session) return null;
  if (session.revokedAt || session.expiresAt <= now || session.driver.deletedAt) {
    return null;
  }
  if (now.getTime() - session.lastSeenAt.getTime() > 10 * 60 * 1000) {
    await prisma.driverSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    });
  }
  return {
    id: session.driver.id,
    phoneE164: session.driver.phoneE164,
    phoneCountry: session.driver.phoneCountry,
    sessionId: session.id,
  };
}

export async function revokeSessionByToken(token: string | null, now = new Date()): Promise<void> {
  if (!token) return;
  const secret = getAuthSecret();
  if (!secret) return;
  const prisma = getPrisma();
  await prisma.driverSession.updateMany({
    where: { tokenHash: hashSessionToken(token, secret), revokedAt: null },
    data: { revokedAt: now },
  });
}

export async function revokeAllDriverSessions(driverId: string, now = new Date()): Promise<void> {
  const prisma = getPrisma();
  await prisma.driverSession.updateMany({
    where: { driverId, revokedAt: null },
    data: { revokedAt: now },
  });
}
