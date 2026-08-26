import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import {
  createCity,
  createInsight,
  createRoute,
  getPublicCityBySlug,
  getPublicInsightBySlug,
  getPublicRouteBySlug,
  listEditorialSitemapEntries,
  publishCity,
  publishInsight,
  publishRoute,
  reviewCity,
  reviewInsight,
  reviewRoute,
} from "./editorial";
import { cityLandingPath, parseRoutePairParam, routeGuidePath } from "./paths";

const db = process.env.DATABASE_URL?.trim();
const actor: StaffActor = { id: "phase6-test-editor", role: "content_manager", source: "dev_env" };

describe("editorial paths", () => {
  it("parses approved route pair slugs and rejects arbitrary text", () => {
    expect(parseRoutePairParam("chennai-to-bengaluru")).toEqual({
      origin: "chennai",
      destination: "bengaluru",
    });
    expect(parseRoutePairParam("not-a-route")).toBeNull();
    expect(cityLandingPath("chennai")).toBe("/ev-charging/chennai");
    expect(routeGuidePath("chennai-to-bengaluru")).toBe("/routes/chennai-to-bengaluru");
  });
});

describe.skipIf(!db)("editorial publication isolation", () => {
  const prisma = new PrismaClient();
  const suffix = `ed-${Date.now()}`;

  afterAll(async () => {
    await prisma.contentFaq.deleteMany({
      where: {
        OR: [
          { city: { slug: { startsWith: `ed-${suffix}` } } },
          { insight: { slug: { startsWith: `ed-${suffix}` } } },
          { route: { slug: { startsWith: `ed-${suffix}` } } },
        ],
      },
    });
    await prisma.routeStop.deleteMany({
      where: { route: { slug: { startsWith: `ed-${suffix}` } } },
    });
    await prisma.routeGuide.deleteMany({ where: { slug: { startsWith: `ed-${suffix}` } } });
    await prisma.insightArticle.deleteMany({ where: { slug: { startsWith: `ed-${suffix}` } } });
    await prisma.cityLandingContent.deleteMany({ where: { slug: { startsWith: `ed-${suffix}` } } });
    await prisma.station.deleteMany({ where: { slug: { startsWith: `ed-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: `ed-host-${suffix}` } });
    await prisma.organisation.deleteMany({ where: { id: `ed-org-${suffix}` } });
    await prisma.contentAuthor.deleteMany({ where: { displayName: `Editor ${suffix}` } });
    await prisma.$disconnect();
  });

  it("404s unapproved city and route pages and keeps drafts out of the sitemap", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: `ed-org-${suffix}`,
        legalName: "Editorial test org",
        brandName: "Editorial",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const host = await prisma.host.create({
      data: {
        id: `ed-host-${suffix}`,
        organisationId: organisation.id,
        hostLegalName: "Editorial host",
        hostDisplayName: "Editorial host",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    const station = await prisma.station.create({
      data: {
        organisationId: organisation.id,
        hostId: host.id,
        name: "Editorial published station",
        slug: `ed-${suffix}-station`,
        city: "Hyderabad",
        state: "Telangana",
        latitude: "17.385000",
        longitude: "78.486700",
        addressLine1: "Test street",
        pincode: "500001",
        accessHoursSummary: "Unknown",
        accessType: "public",
        operationalLifecycle: "open",
        dataSource: "other",
        publicationStatus: "published",
        isDemo: false,
        lastVerifiedAt: new Date(),
        verifiedBy: "test",
      },
    });
    const author = await prisma.contentAuthor.create({
      data: { displayName: `Editor ${suffix}`, roleTitle: "Editor", publicationStatus: "published" },
    });

    const citySlug = `ed-${suffix}-hyderabad`;
    const createdCity = await createCity(actor, {
      slug: citySlug,
      cityName: "Hyderabad",
      stateName: "Telangana",
      intro: "Unique reviewed guidance for Hyderabad test inventory, covering access at malls and hotels.",
      accessGuidance: "Confirm guest or public access on each station page before you travel.",
      connectorGuidance: "Published test inventory in this city uses the catalogue connector model only.",
    });
    expect(createdCity.ok).toBe(true);
    expect(await getPublicCityBySlug(citySlug)).toBeNull();
    expect(await getPublicCityBySlug("not-a-real-city")).toBeNull();

    if (!createdCity.ok) return;
    const publishTooSoon = await publishCity(actor, createdCity.city.id);
    expect(publishTooSoon.ok).toBe(false);

    await reviewCity(actor, createdCity.city.id);
    const publishedCity = await publishCity(actor, createdCity.city.id);
    expect(publishedCity.ok).toBe(true);
    const publicCity = await getPublicCityBySlug(citySlug);
    expect(publicCity?.cityName).toBe("Hyderabad");
    expect("internalNotes" in (publicCity ?? {})).toBe(false);

    const emptyCity = await createCity(actor, {
      slug: `ed-${suffix}-empty-city`,
      cityName: "NoStationsCity",
      stateName: "Telangana",
      intro: "This city has unique copy but no published Plug and Go stations, so it must not go live.",
      accessGuidance: "There is no published inventory to describe for access.",
      connectorGuidance: "There are no published connectors in this fictional empty city.",
    });
    if (emptyCity.ok) {
      await reviewCity(actor, emptyCity.city.id);
      const emptyPublish = await publishCity(actor, emptyCity.city.id);
      expect(emptyPublish.ok).toBe(false);
      expect(await getPublicCityBySlug(`ed-${suffix}-empty-city`)).toBeNull();
    }

    const insightSlug = `ed-${suffix}-insight`;
    const createdInsight = await createInsight(actor, {
      slug: insightSlug,
      title: "How status freshness is shown",
      excerpt: "A unique excerpt about Unknown and Stale never being labelled Available on Plug and Go pages.",
      body: "A substantial reviewed article body that explains status freshness, access rules, and why estimates are not invoices. ".repeat(4),
      authorId: author.id,
    });
    expect(createdInsight.ok).toBe(true);
    expect(await getPublicInsightBySlug(insightSlug)).toBeNull();
    if (createdInsight.ok) {
      await prisma.insightArticle.update({
        where: { id: createdInsight.article.id },
        data: { isDemo: true },
      });
      await reviewInsight(actor, createdInsight.article.id);
      const demoPublish = await publishInsight(actor, createdInsight.article.id);
      expect(demoPublish.ok).toBe(false);
      await prisma.insightArticle.update({
        where: { id: createdInsight.article.id },
        data: { isDemo: false },
      });
      const publishedInsight = await publishInsight(actor, createdInsight.article.id);
      expect(publishedInsight.ok).toBe(true);
      expect((await getPublicInsightBySlug(insightSlug))?.title).toContain("status freshness");
    }

    const routeSlug = `ed-${suffix}-origin-to-hyderabad`;
    const createdRoute = await createRoute(actor, {
      slug: routeSlug,
      originName: "Origin",
      destinationName: "Hyderabad",
      originSlug: `ed-${suffix}-origin`,
      destinationSlug: "hyderabad",
      routeNotes:
        "A researched charging plan for this test pair, with a real published stop and access caveats for the driver.",
      accessCaveats: "Confirm hours on the station page. This website does not take bookings.",
      stops: [{ stationSlug: station.slug, stopNotes: "Published test stop only." }],
    });
    expect(createdRoute.ok).toBe(true);
    expect(await getPublicRouteBySlug(routeSlug)).toBeNull();
    expect(await getPublicRouteBySlug("random-to-random")).toBeNull();
    if (createdRoute.ok) {
      await reviewRoute(actor, createdRoute.route.id);
      const publishedRoute = await publishRoute(actor, createdRoute.route.id);
      expect(publishedRoute.ok).toBe(true);
      expect((await getPublicRouteBySlug(routeSlug))?.stops[0]?.stationSlug).toBe(station.slug);
    }

    const sitemap = await listEditorialSitemapEntries();
    expect(sitemap.cities.map((row) => row.path)).toContain(`/ev-charging/${citySlug}`);
    expect(sitemap.cities.map((row) => row.path)).not.toContain(`/ev-charging/ed-${suffix}-empty-city`);
    expect(sitemap.insights.map((row) => row.path)).toContain(`/insights/${insightSlug}`);
    expect(sitemap.routes.map((row) => row.path)).toContain(`/routes/${routeSlug}`);
  });
});
