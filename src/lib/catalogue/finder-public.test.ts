import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  estimatePublicTariff,
  getPublicStationBySlug,
  listPublicStations,
} from "./station-service";
import { isCanonicalStationPath, stationCanonicalPath } from "@/lib/geo";
import { formatInrFromPaise } from "@/lib/tariff/format";

const db = process.env.DATABASE_URL?.trim();

describe.skipIf(!db)("public finder catalogue", () => {
  const prisma = new PrismaClient();
  const suffix = `p5-${Date.now()}`;
  const ids = {
    org: `p5-org-${suffix}`,
    host: `p5-host-${suffix}`,
  };

  afterAll(async () => {
    await prisma.station.deleteMany({ where: { slug: { startsWith: `p5-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: ids.host } });
    await prisma.organisation.deleteMany({ where: { id: ids.org } });
    await prisma.$disconnect();
  });

  it("filters published stations, converts stale status, and shows tariff estimates", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: ids.org,
        legalName: "Phase 5 test org",
        brandName: "Phase 5",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const host = await prisma.host.create({
      data: {
        id: ids.host,
        organisationId: organisation.id,
        hostLegalName: "Phase 5 host",
        hostDisplayName: "Phase 5 host",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });

    const published = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: `MG Road CCS hub ${suffix}`,
        slug: `p5-${suffix}-mg-road`,
        city: "Bengaluru",
        state: "Karnataka",
        latitude: "12.971600",
        longitude: "77.594600",
        addressLine1: "MG Road",
        locality: "Ashok Nagar",
        pincode: "560001",
        landmark: "Near Metro",
        accessHoursSummary: "06:00–23:00",
        accessHoursStructured: { weekly: [{ day: 2, open: "06:00", close: "23:00" }] },
        accessType: "public",
        amenities: ["restroom"],
        accessibleBayCount: 1,
        publicationStatus: "published",
        operationalLifecycle: "open",
        isDemo: false,
        dataSource: "other",
        lastVerifiedAt: new Date(),
        verifiedBy: "test",
      },
    });

    const evse = await prisma.evse.create({
      data: {
        stationId: published.id,
        evseLabel: "EVSE 1",
        maxPowerWatts: 60000,
        powerType: "dc",
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    const connector = await prisma.connector.create({
      data: {
        evseId: evse.id,
        stationId: published.id,
        connectorIndex: 1,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        installationStatus: "installed",
        vehicleCompatibilityNotes: "CCS2 cars",
        dataSource: "other",
      },
    });

    const staleStation = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: `Whitefield stale bay ${suffix}`,
        slug: `p5-${suffix}-whitefield`,
        city: "Bengaluru",
        state: "Karnataka",
        latitude: "12.969800",
        longitude: "77.749900",
        addressLine1: "Whitefield main",
        pincode: "560066",
        accessHoursSummary: "Unknown",
        accessType: "public",
        publicationStatus: "published",
        operationalLifecycle: "open",
        isDemo: false,
        dataSource: "other",
        lastVerifiedAt: new Date(),
        verifiedBy: "test",
      },
    });
    const staleEvse = await prisma.evse.create({
      data: {
        stationId: staleStation.id,
        evseLabel: "EVSE 1",
        maxPowerWatts: 22000,
        powerType: "ac",
        installationStatus: "installed",
        dataSource: "other",
      },
    });
    const staleConnector = await prisma.connector.create({
      data: {
        evseId: staleEvse.id,
        stationId: staleStation.id,
        connectorIndex: 1,
        connectorType: "type2_ac",
        maxPowerWatts: 22000,
        installationStatus: "installed",
        dataSource: "other",
      },
    });

    await prisma.currentConnectorStatus.create({
      data: {
        connectorId: connector.id,
        recordedStatus: "available",
        source: "manual_import",
        statusUpdatedAt: new Date(),
      },
    });
    await prisma.currentConnectorStatus.create({
      data: {
        connectorId: staleConnector.id,
        recordedStatus: "available",
        source: "manual_import",
        statusUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
      },
    });

    await prisma.tariffVersion.create({
      data: {
        stationId: published.id,
        timeBand: "all_hours",
        energyPaisePerKwh: 1500,
        servicePaisePerKwh: 100,
        parkingPaiseFlat: 0,
        gstRateBps: 1800,
        approvalStatus: "approved",
        approvedAt: new Date(),
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
        dataSource: "other",
        estimateDisclaimer: "This is an estimate, not a tax invoice. The session invoice may differ.",
      },
    });

    const nameSearch = await listPublicStations({ page: 1, pageSize: 20, q: `MG Road CCS hub ${suffix}` });
    expect(nameSearch.stations.some((row) => row.slug === published.slug)).toBe(true);

    const pincodeSearch = await listPublicStations({ page: 1, pageSize: 20, q: "560001" });
    expect(pincodeSearch.stations.some((row) => row.slug === published.slug)).toBe(true);

    const ccs = await listPublicStations({ page: 1, pageSize: 20, connectorType: "ccs2", q: suffix });
    expect(ccs.stations.every((row) => row.connectors.some((item) => item.connectorType === "ccs2"))).toBe(
      true,
    );
    expect(ccs.stations.some((row) => row.slug === staleStation.slug)).toBe(false);

    const minPower = await listPublicStations({ page: 1, pageSize: 20, minKw: 50, q: suffix });
    expect(minPower.stations.some((row) => row.slug === published.slug)).toBe(true);
    expect(minPower.stations.some((row) => row.slug === staleStation.slug)).toBe(false);

    const available = await listPublicStations({
      page: 1,
      pageSize: 20,
      q: suffix,
      availability: "available",
      now: new Date(),
    });
    const availableSlugs = available.stations.map((row) => row.slug);
    if (process.env.AVAILABILITY_FRESHNESS_MINUTES) {
      expect(availableSlugs).toContain(published.slug);
    } else {
      expect(availableSlugs).not.toContain(published.slug);
      expect(availableSlugs).not.toContain(staleStation.slug);
    }

    const staleList = await listPublicStations({
      page: 1,
      pageSize: 20,
      q: `Whitefield stale bay ${suffix}`,
      now: new Date(),
    });
    const staleRow = staleList.stations.find((row) => row.slug === staleStation.slug);
    expect(staleRow).toBeTruthy();
    expect(staleRow?.publicStatus === "stale" || staleRow?.publicStatus === "unknown").toBe(true);
    expect(staleRow?.publicStatus).not.toBe("available");

    const amenity = await listPublicStations({ page: 1, pageSize: 20, amenity: "restroom", q: suffix });
    expect(amenity.stations.some((row) => row.slug === published.slug)).toBe(true);

    const detail = await getPublicStationBySlug(published.slug);
    expect(detail).toBeTruthy();
    const canonical = stationCanonicalPath({
      state: detail!.state,
      city: detail!.city,
      slug: detail!.slug,
    });
    expect(canonical).toBe(`/stations/karnataka/bengaluru/${published.slug}`);
    expect(
      isCanonicalStationPath(
        { state: "karnataka", city: "bengaluru", slug: published.slug },
        detail!,
      ),
    ).toBe(true);
    expect(
      isCanonicalStationPath({ state: "tamil-nadu", city: "bengaluru", slug: published.slug }, detail!),
    ).toBe(false);

    const estimate = await estimatePublicTariff(published.slug, { energyKwhMilli: 10_000 });
    expect(estimate.ok).toBe(true);
    if (!estimate.ok) return;
    expect(estimate.estimate.isInvoice).toBe(false);
    expect(estimate.estimate.lines.some((line) => line.code === "energy")).toBe(true);
    expect(estimate.estimate.lines.some((line) => line.code === "gst")).toBe(true);
    expect(formatInrFromPaise(estimate.estimate.totalPaise)).toMatch(/^₹/);

    const hidden = await estimatePublicTariff(`p5-${suffix}-missing`, { energyKwhMilli: 10_000 });
    expect(hidden.ok).toBe(false);
  });
});
