import { afterEach, describe, expect, it } from "vitest";
import { requireStaffRole, resolveStaffActor, roleAllows } from "./staff";

const original = {
  ADMIN_ENABLED: process.env.ADMIN_ENABLED,
  NODE_ENV: process.env.NODE_ENV,
  STAFF_DEV_ROLE: process.env.STAFF_DEV_ROLE,
  STAFF_DEV_ACTOR_ID: process.env.STAFF_DEV_ACTOR_ID,
  STAFF_IDENTITY_PROVIDER: process.env.STAFF_IDENTITY_PROVIDER,
  STAFF_MFA_ENFORCED: process.env.STAFF_MFA_ENFORCED,
};

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, key);
  } else {
    Reflect.set(process.env, key, value);
  }
}

afterEach(() => {
  setEnv("ADMIN_ENABLED", original.ADMIN_ENABLED);
  setEnv("NODE_ENV", original.NODE_ENV);
  setEnv("STAFF_DEV_ROLE", original.STAFF_DEV_ROLE);
  setEnv("STAFF_DEV_ACTOR_ID", original.STAFF_DEV_ACTOR_ID);
  setEnv("STAFF_IDENTITY_PROVIDER", original.STAFF_IDENTITY_PROVIDER);
  setEnv("STAFF_MFA_ENFORCED", original.STAFF_MFA_ENFORCED);
});

describe("requireStaffRole", () => {
  it("denies when admin is disabled", () => {
    setEnv("ADMIN_ENABLED", "false");
    setEnv("NODE_ENV", "development");
    process.env.STAFF_DEV_ROLE = "super_admin";
    process.env.STAFF_DEV_ACTOR_ID = "dev";
    expect(() => requireStaffRole(["super_admin"])).toThrow(/disabled/i);
  });

  it("denies in production even if a dev role is set", () => {
    setEnv("ADMIN_ENABLED", "true");
    setEnv("NODE_ENV", "production");
    process.env.STAFF_DEV_ROLE = "super_admin";
    process.env.STAFF_DEV_ACTOR_ID = "dev";
    expect(() => requireStaffRole(["super_admin"])).toThrow(/identity/i);
    expect(resolveStaffActor()).toBeNull();
  });

  it("allows a matching development role", () => {
    setEnv("ADMIN_ENABLED", "true");
    setEnv("NODE_ENV", "test");
    process.env.STAFF_DEV_ROLE = "finance";
    process.env.STAFF_DEV_ACTOR_ID = "dev-finance";
    const actor = requireStaffRole(["finance"]);
    expect(actor.role).toBe("finance");
    expect(actor.id).toBe("dev-finance");
  });

  it("denies a role that is not allowed", () => {
    setEnv("ADMIN_ENABLED", "true");
    setEnv("NODE_ENV", "test");
    process.env.STAFF_DEV_ROLE = "support";
    process.env.STAFF_DEV_ACTOR_ID = "dev-support";
    expect(() => requireStaffRole(["finance"])).toThrow(/cannot perform/i);
  });

  it("denies in production even if identity is named without MFA", () => {
    setEnv("ADMIN_ENABLED", "true");
    setEnv("NODE_ENV", "production");
    process.env.STAFF_IDENTITY_PROVIDER = "oidc-placeholder";
    process.env.STAFF_MFA_ENFORCED = "false";
    expect(() => requireStaffRole(["super_admin"])).toThrow(/MFA/i);
  });

  it("lets super_admin pass any matrix check", () => {
    expect(
      roleAllows({ id: "a", role: "super_admin", source: "dev_env" }, ["finance"]),
    ).toBe(true);
  });
});
