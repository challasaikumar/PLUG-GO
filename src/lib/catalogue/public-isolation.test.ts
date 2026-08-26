import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getPublicStationBySlug, listPublicStations } from "./station-service";

const db = process.env.DATABASE_URL?.trim();

describe.skipIf(!db)("public catalogue isolation", () => {
  const prisma = new PrismaClient();
  const suffix = `test-${Date.now()}`;

  afterAll(async () => {
    await prisma.station.deleteMany({ where: { slug: { startsWith: `iso-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: `iso-host-${suffix}` } });
    await prisma.organisation.deleteMany({ where: { id: `iso-org-${suffix}` } });
    await prisma.$disconnect();
  });

  it("does not return draft, archived, or demo stations from public reads", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: `iso-org-${suffix}`,
        legalName: "Isolation test org",
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
      city: "Chennai",
      state: "Tamil Nadu",
      latitude: "13.082700",
      longitude: "80.270700",
      addressLine1: "Test street",
      pincode: "600001",
      accessHoursSummary: "Unknown",
      accessType: "unknown" as const,
      operationalLifecycle: "planned" as const,
      dataSource: "other" as const,
    };

    const published = await prisma.station.create({
      data: {
        ...base,
        name: "Published isolation station",
        slug: `iso-${suffix}-published`,
        publicationStatus: "published",
        isDemo: false,
        lastVerifiedAt: new Date(),
        verifiedBy: "test",
      },
    });
    await prisma.station.create({
      data: {
        ...base,
        name: "Draft isolation station",
        slug: `iso-${suffix}-draft`,
        publicationStatus: "draft",
        isDemo: false,
      },
    });
    await prisma.station.create({
      data: {
        ...base,
        name: "Archived isolation station",
        slug: `iso-${suffix}-archived`,
        publicationStatus: "archived",
        isDemo: false,
      },
    });
    await prisma.station.create({
      data: {
        ...base,
        name: "Demo isolation station",
        slug: `iso-${suffix}-demo`,
        publicationStatus: "published",
        isDemo: true,
      },
    });

    const list = await listPublicStations({ page: 1, pageSize: 50, q: "Published isolation station" });
    const slugs = list.stations.map((row) => row.slug);
    expect(slugs).toContain(published.slug);
    expect(slugs).not.toContain(`iso-${suffix}-draft`);
    expect(slugs).not.toContain(`iso-${suffix}-archived`);
    expect(slugs).not.toContain(`iso-${suffix}-demo`);

    const draftSearch = await listPublicStations({ page: 1, pageSize: 50, q: "Draft isolation station" });
    expect(draftSearch.stations.map((row) => row.slug)).not.toContain(`iso-${suffix}-draft`);
    expect(draftSearch.total).toBe(0);

    expect(await getPublicStationBySlug(`iso-${suffix}-draft`)).toBeNull();
    expect(await getPublicStationBySlug(`iso-${suffix}-archived`)).toBeNull();
    expect(await getPublicStationBySlug(`iso-${suffix}-demo`)).toBeNull();
    const visible = await getPublicStationBySlug(published.slug);
    expect(visible?.name).toBe("Published isolation station");
    expect(JSON.stringify(visible)).not.toMatch(/internalNotes/);
    expect(JSON.stringify(visible)).not.toMatch(/verifiedBy/);
  });
});
