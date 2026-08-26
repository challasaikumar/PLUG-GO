/**
 * Development-only demo seed. All stations remain Draft.
 * Public APIs must not return these rows.
 *
 *   npm run db:seed
 *   npm run db:clear-demo
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DEMO_STATION_SLUG = "demo-draft-not-public";

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Refusing to seed. Set ALLOW_DEMO_SEED=true to load labelled draft demo data only.",
    );
  }

  const organisation = await prisma.organisation.upsert({
    where: { id: "demo_org_plug_and_go" },
    update: {},
    create: {
      id: "demo_org_plug_and_go",
      legalName: "DEMO ORGANISATION — not a Plug and Go legal entity",
      brandName: "Demo (not published)",
      registeredAddress: "Not a real address",
      isDemo: true,
      dataSource: "other",
    },
  });

  const host = await prisma.host.upsert({
    where: { id: "demo_host_plug_and_go" },
    update: {},
    create: {
      id: "demo_host_plug_and_go",
      organisationId: organisation.id,
      hostLegalName: "DEMO HOST — not a real partner",
      hostDisplayName: "Demo host",
      hostType: "other",
      contractStatus: "unknown",
      notes: "Internal demo row. Delete with npm run db:clear-demo.",
      isDemo: true,
      dataSource: "other",
    },
  });

  const station = await prisma.station.upsert({
    where: { slug: DEMO_STATION_SLUG },
    update: { publicationStatus: "draft", isDemo: true },
    create: {
      organisationId: organisation.id,
      hostId: host.id,
      name: "DEMO station (draft, not public)",
      slug: DEMO_STATION_SLUG,
      city: "Bengaluru",
      state: "Karnataka",
      latitude: "12.971600",
      longitude: "77.594600",
      addressLine1: "Not a real street",
      pincode: "560001",
      landmark: "Demo landmark — do not navigate here",
      arrivalInstructions: "This is labelled demo data for staff tooling only.",
      accessType: "unknown",
      accessHoursSummary: "Unknown — demo record",
      operationalLifecycle: "planned",
      publicationStatus: "draft",
      isDemo: true,
      dataSource: "other",
      internalNotes: "Seeded demo. Must remain Draft.",
    },
  });

  const evse =
    (await prisma.evse.findFirst({ where: { stationId: station.id } })) ??
    (await prisma.evse.create({
      data: {
        stationId: station.id,
        evseLabel: "Demo EVSE",
        maxPowerWatts: 60000,
        powerType: "dc",
        installationStatus: "installed",
        dataSource: "other",
      },
    }));

  const connector =
    (await prisma.connector.findFirst({ where: { evseId: evse.id } })) ??
    (await prisma.connector.create({
      data: {
        evseId: evse.id,
        stationId: station.id,
        connectorIndex: 1,
        connectorType: "ccs2",
        maxPowerWatts: 60000,
        installationStatus: "installed",
        dataSource: "other",
      },
    }));

  await prisma.currentConnectorStatus.upsert({
    where: { connectorId: connector.id },
    update: {},
    create: {
      connectorId: connector.id,
      recordedStatus: "unknown",
      source: "manual_import",
      statusUpdatedAt: new Date(),
    },
  });

  const existingTariff = await prisma.tariffVersion.findFirst({
    where: { stationId: station.id },
  });
  if (!existingTariff) {
    await prisma.tariffVersion.create({
      data: {
        stationId: station.id,
        energyPaisePerKwh: 0,
        servicePaisePerKwh: 0,
        gstRateBps: 1800,
        effectiveFrom: new Date("2099-01-01T00:00:00.000Z"),
        approvalStatus: "draft",
        dataSource: "other",
        estimateDisclaimer: "Demo draft tariff. Not approved. Not an invoice.",
      },
    });
  }

  console.log("Demo seed complete. Station remains Draft:", DEMO_STATION_SLUG);

  await prisma.insightArticle.upsert({
    where: { slug: "draft-template-reading-a-station-page" },
    update: { publicationStatus: "draft", isDemo: true },
    create: {
      slug: "draft-template-reading-a-station-page",
      title: "DRAFT TEMPLATE — How to read a Plug and Go station page",
      excerpt:
        "Internal template: explain connectors, access, estimates, and status freshness without inventing inventory.",
      body: [
        "This is a labelled draft template for editors. It is not a public article and must stay Draft.",
        "A station page should help a driver answer: Is there a compatible connector? Can I access the bay? What will it cost? How do I get help?",
        "Availability copy must keep Unknown, Offline, and Stale distinct from Available. An estimate is not an invoice.",
        "Replace this body with reviewed, unique copy before attempting to publish a non-demo article. Demo templates cannot be published.",
      ].join("\n\n"),
      publicationStatus: "draft",
      isDemo: true,
      internalNotes: "Seeded template. Copy into a new non-demo article; do not publish this row.",
    },
  });

  await prisma.insightArticle.upsert({
    where: { slug: "draft-template-transparent-pricing" },
    update: { publicationStatus: "draft", isDemo: true },
    create: {
      slug: "draft-template-transparent-pricing",
      title: "DRAFT TEMPLATE — Explaining energy, fees, GST, and invoices",
      excerpt:
        "Internal template: teach the tariff breakdown without quoting unapproved rupee rates as Plug and Go prices.",
      body: [
        "This is a labelled draft template for editors. It is not a public article and must stay Draft.",
        "Energy, service, parking, idle, reservation, GST, and named discounts should be explained separately.",
        "If no approved tariff applies, say price is not published. Do not copy a rate from another city.",
        "Replace this body with reviewed copy, assign an author, and record a review date before publishing a real article.",
      ].join("\n\n"),
      publicationStatus: "draft",
      isDemo: true,
      internalNotes: "Seeded template. Cannot be published while isDemo is true.",
    },
  });

  console.log("Draft insight templates remain unpublished demo rows.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
