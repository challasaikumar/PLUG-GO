import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { isPublicRef, resolvePublishedQrContext } from "./resolve";

const db = process.env.DATABASE_URL?.trim();

describe("QR public refs", () => {
  it("rejects malformed identifiers", () => {
    expect(isPublicRef("short")).toBe(false);
    expect(isPublicRef("../etc/passwd")).toBe(false);
    expect(isPublicRef("st_abcdefghijklmnop")).toBe(true);
  });
});

describe.skipIf(!db)("QR published lookup", () => {
  const prisma = new PrismaClient();
  const suffix = `qr-${Date.now()}`;

  afterAll(async () => {
    await prisma.station.deleteMany({ where: { slug: { startsWith: `iso-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: `iso-host-${suffix}` } });
    await prisma.organisation.deleteMany({ where: { id: `iso-org-${suffix}` } });
    await prisma.$disconnect();
  });

  it("resolves only published station/connector public refs", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: `iso-org-${suffix}`,
        legalName: "QR org",
        brandName: "QR",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const host = await prisma.host.create({
      data: {
        id: `iso-host-${suffix}`,
        organisationId: organisation.id,
        hostLegalName: "QR host",
        hostDisplayName: "QR host",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    const published = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: "QR published",
        slug: `iso-${suffix}-published`,
        city: "Bengaluru",
        state: "Karnataka",
        latitude: "12.971600",
        longitude: "77.594600",
        addressLine1: "Test street",
        pincode: "560001",
        accessHoursSummary: "Unknown",
        dataSource: "other",
        publicationStatus: "published",
        isDemo: false,
      },
    });
    const draft = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: "QR draft",
        slug: `iso-${suffix}-draft`,
        city: "Bengaluru",
        state: "Karnataka",
        latitude: "12.971600",
        longitude: "77.594600",
        addressLine1: "Test street",
        pincode: "560001",
        accessHoursSummary: "Unknown",
        dataSource: "other",
        publicationStatus: "draft",
        isDemo: false,
      },
    });
    const evse = await prisma.evse.create({
      data: {
        stationId: published.id,
        evseLabel: "A",
        maxPowerWatts: 60000,
        powerType: "dc",
        dataSource: "other",
        installationStatus: "installed",
      },
    });
    const connector = await prisma.connector.create({
      data: {
        evseId: evse.id,
        stationId: published.id,
        connectorIndex: 1,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        dataSource: "other",
        installationStatus: "installed",
      },
    });
    const draftEvse = await prisma.evse.create({
      data: {
        stationId: draft.id,
        evseLabel: "A",
        maxPowerWatts: 60000,
        powerType: "dc",
        dataSource: "other",
        installationStatus: "installed",
      },
    });
    const draftConnector = await prisma.connector.create({
      data: {
        evseId: draftEvse.id,
        stationId: draft.id,
        connectorIndex: 1,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        dataSource: "other",
        installationStatus: "installed",
      },
    });

    const found = await resolvePublishedQrContext(published.publicRef, connector.publicRef);
    expect(found?.stationSlug).toBe(published.slug);
    expect(found?.connectorType).toBe("ccs2");
    expect(JSON.stringify(found)).not.toContain(published.id);

    expect(await resolvePublishedQrContext(draft.publicRef, draftConnector.publicRef)).toBeNull();
    expect(await resolvePublishedQrContext(published.publicRef, draftConnector.publicRef)).toBeNull();
    expect(await resolvePublishedQrContext("missingref12", connector.publicRef)).toBeNull();
  });
});
