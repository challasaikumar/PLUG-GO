import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { requestDriverOtp, verifyDriverOtp } from "@/lib/auth/otp";
import { resolveDriverSession } from "@/lib/auth/session";
import {
  createDriverVehicle,
  deleteDriverVehicle,
  listDriverVehicles,
  updateDriverVehicle,
} from "@/lib/account/vehicles";
import { listSavedStations, savePublishedStation } from "@/lib/account/saved-stations";
import { confirmAccountDeletion, createDataExport } from "@/lib/account/privacy";

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else Reflect.set(process.env, key, value);
}

const db = process.env.DATABASE_URL?.trim();

function uniquePhone(head: "6" | "7" | "8" | "9"): string {
  const rest = String(100000000 + Math.floor(Math.random() * 899999999)).slice(0, 9);
  return `+91${head}${rest}`;
}

describe.skipIf(!db)("driver account isolation", () => {
  const prisma = new PrismaClient();
  const suffix = `drv-${Date.now()}`;
  const phoneA = uniquePhone("8");
  const phoneB = uniquePhone("9");
  const original = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DEV_OTP: process.env.AUTH_DEV_OTP,
    NODE_ENV: process.env.NODE_ENV,
  };

  beforeAll(() => {
    setEnv("AUTH_SECRET", "phase7-test-secret-value");
    setEnv("AUTH_DEV_OTP", "true");
    setEnv("NODE_ENV", "test");
  });

  afterAll(async () => {
    setEnv("AUTH_SECRET", original.AUTH_SECRET);
    setEnv("AUTH_DEV_OTP", original.AUTH_DEV_OTP);
    setEnv("NODE_ENV", original.NODE_ENV);
    await prisma.savedStation.deleteMany({ where: { station: { slug: { startsWith: `iso-${suffix}` } } } });
    await prisma.station.deleteMany({ where: { slug: { startsWith: `iso-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: `iso-host-${suffix}` } });
    await prisma.organisation.deleteMany({ where: { id: `iso-org-${suffix}` } });
    await prisma.driver.deleteMany({ where: { phoneE164: { in: [phoneA, phoneB] } } });
    await prisma.driverAuthChallenge.deleteMany({ where: { phoneE164: { in: [phoneA, phoneB] } } });
    await prisma.$disconnect();
  });

  it("keeps vehicles, saved stations, exports, and deletion requests owner-scoped", async () => {
    const ipN = 10 + (Date.now() % 80);
    const otpA = await requestDriverOtp({ phone: phoneA, ip: `198.51.100.${ipN}` });
    const otpB = await requestDriverOtp({ phone: phoneB, ip: `198.51.100.${ipN + 1}` });
    const sessionA = await verifyDriverOtp({
      phone: phoneA,
      challengeId: otpA.challengeId,
      code: otpA.developmentCode,
    });
    const sessionB = await verifyDriverOtp({
      phone: phoneB,
      challengeId: otpB.challengeId,
      code: otpB.developmentCode,
    });

    const created = await createDriverVehicle(sessionA.driver.id, {
      make: "Tata",
      model: "Nexon EV",
      connectorType: "ccs2",
      batteryKwh: 40,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const otherUpdate = await updateDriverVehicle(sessionB.driver.id, created.vehicle.id, {
      make: "Mahindra",
      model: "XEV",
      connectorType: "ccs2",
    });
    expect("notFound" in otherUpdate && otherUpdate.notFound).toBe(true);
    const otherDelete = await deleteDriverVehicle(sessionB.driver.id, created.vehicle.id);
    expect(otherDelete.ok).toBe(false);
    const listB = await listDriverVehicles(sessionB.driver.id);
    expect(listB).toHaveLength(0);
    const listA = await listDriverVehicles(sessionA.driver.id);
    expect(listA.map((row) => row.id)).toContain(created.vehicle.id);

    const organisation = await prisma.organisation.create({
      data: {
        id: `iso-org-${suffix}`,
        legalName: "Driver isolation org",
        brandName: "Isolation",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const host = await prisma.host.create({
      data: {
        id: `iso-host-${suffix}`,
        organisationId: organisation.id,
        hostLegalName: "Isolation host",
        hostDisplayName: "Isolation host",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    const base = {
      organisationId: organisation.id,
      hostId: host.id,
      city: "Pune",
      state: "Maharashtra",
      latitude: "18.520400",
      longitude: "73.856700",
      addressLine1: "Test street",
      pincode: "411001",
      accessHoursSummary: "Unknown",
      accessType: "unknown" as const,
      operationalLifecycle: "open" as const,
      dataSource: "other" as const,
    };
    const published = await prisma.station.create({
      data: {
        ...base,
        name: "Published saved station",
        slug: `iso-${suffix}-published`,
        publicationStatus: "published",
        isDemo: false,
      },
    });
    const archived = await prisma.station.create({
      data: {
        ...base,
        name: "Archived later station",
        slug: `iso-${suffix}-archived-later`,
        publicationStatus: "published",
        isDemo: false,
      },
    });
    const draft = await prisma.station.create({
      data: {
        ...base,
        name: "Draft station",
        slug: `iso-${suffix}-draft`,
        publicationStatus: "draft",
        isDemo: false,
      },
    });

    expect((await savePublishedStation(sessionA.driver.id, draft.slug)).ok).toBe(false);
    expect((await savePublishedStation(sessionA.driver.id, published.slug)).ok).toBe(true);
    expect((await savePublishedStation(sessionA.driver.id, archived.slug)).ok).toBe(true);
    await prisma.station.update({
      where: { id: archived.id },
      data: { publicationStatus: "archived" },
    });

    const savedA = await listSavedStations(sessionA.driver.id);
    const savedB = await listSavedStations(sessionB.driver.id);
    expect(savedB).toHaveLength(0);
    expect(savedA.some((row) => row.slug === published.slug && row.published)).toBe(true);
    expect(savedA.some((row) => row.unpublishedReason?.includes("archived"))).toBe(true);

    const exportA = await createDataExport(sessionA.driver.id);
    const exportB = await createDataExport(sessionB.driver.id);
    expect(exportA.ok && exportB.ok).toBe(true);
    if (exportA.ok && exportB.ok) {
      expect(exportA.payload.vehicles.some((vehicle) => vehicle.id === created.vehicle.id)).toBe(true);
      expect(exportB.payload.vehicles).toHaveLength(0);
      expect(JSON.stringify(exportB.payload)).not.toContain(created.vehicle.id);
      expect(exportA.payload.account.phoneE164).toBe(phoneA);
    }

    const deletion = await confirmAccountDeletion(sessionA.driver.id, { confirmation: "DELETE" });
    expect(deletion.ok).toBe(true);
    expect(await resolveDriverSession(sessionA.sessionToken)).toBeNull();
    expect(await resolveDriverSession(sessionB.sessionToken)).not.toBeNull();
    const bExportAfter = await createDataExport(sessionB.driver.id);
    expect(bExportAfter.ok).toBe(true);
  });
});
