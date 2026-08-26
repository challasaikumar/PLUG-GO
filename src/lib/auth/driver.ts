import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { loginHref } from "./return-path";
import {
  readSessionTokenFromCookieStore,
  readSessionTokenFromRequest,
  resolveDriverSession,
  type DriverSessionRecord,
} from "./session";

export class DriverAuthRequiredError extends Error {
  readonly status = 401;
  readonly code = "unauthenticated";

  constructor() {
    super("Sign in to continue.");
    this.name = "DriverAuthRequiredError";
  }
}

export async function getOptionalDriver(): Promise<DriverSessionRecord | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const token = await readSessionTokenFromCookieStore();
    return await resolveDriverSession(token);
  } catch {
    return null;
  }
}

export async function requireDriverPage(nextPath: string): Promise<DriverSessionRecord> {
  const driver = await getOptionalDriver();
  if (!driver) {
    redirect(loginHref(nextPath));
  }
  return driver;
}

export async function requireDriverFromRequest(request: Request): Promise<DriverSessionRecord> {
  if (!isDatabaseConfigured()) {
    throw new DriverAuthRequiredError();
  }
  const token = readSessionTokenFromRequest(request);
  const driver = await resolveDriverSession(token);
  if (!driver) {
    throw new DriverAuthRequiredError();
  }
  return driver;
}
