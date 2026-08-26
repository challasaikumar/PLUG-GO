import type { StaffActor } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import { PUBLICATION_STATUSES } from "@/lib/catalogue/validation";
import {
  ALLOWED_RELATED_GUIDES,
  cityLandingPath,
  insightPath,
  isAllowedGuideHref,
  parseRoutePairParam,
  routeGuidePath,
  routePairSlug,
} from "@/lib/content/paths";
import { getPrisma } from "@/lib/db/prisma";
import { pathSegment } from "@/lib/geo";

const publicWhere = {
  publicationStatus: "published" as const,
  isDemo: false,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalTrim(value: unknown): string | undefined {
  const text = trim(value);
  return text ? text : undefined;
}

function boolField(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === "on";
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => trim(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

type FaqInput = { question: string; answer: string };

function parseFaqs(value: unknown): FaqInput[] {
  if (!Array.isArray(value)) return [];
  const faqs: FaqInput[] = [];
  for (const row of value) {
    const record = asRecord(row);
    if (!record) continue;
    const question = trim(record.question);
    const answer = trim(record.answer);
    if (question && answer) faqs.push({ question, answer });
  }
  return faqs;
}

function omitInternal<T extends { internalNotes?: string | null }>(row: T): Omit<T, "internalNotes"> {
  const { internalNotes: _notes, ...rest } = row;
  void _notes;
  return rest;
}

export async function countPublishedStationsInCity(cityName: string) {
  const prisma = getPrisma();
  return prisma.station.count({
    where: {
      publicationStatus: "published",
      isDemo: false,
      city: { equals: cityName, mode: "insensitive" },
    },
  });
}

export async function getPublicCityBySlug(slug: string) {
  const prisma = getPrisma();
  const row = await prisma.cityLandingContent.findFirst({
    where: { slug, ...publicWhere },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      reviewedBy: { select: { displayName: true, roleTitle: true } },
    },
  });
  if (!row) return null;
  const stationCount = await countPublishedStationsInCity(row.cityName);
  if (stationCount === 0) return null;
  return {
    ...omitInternal(row),
    href: cityLandingPath(row.slug),
    stationCount,
    faqs: row.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
    reviewerName: row.reviewedBy?.displayName ?? null,
  };
}

export async function listPublishedCitySummaries() {
  const prisma = getPrisma();
  const rows = await prisma.cityLandingContent.findMany({
    where: publicWhere,
    orderBy: { cityName: "asc" },
    select: {
      slug: true,
      cityName: true,
      stateName: true,
      intro: true,
      lastReviewedAt: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  const withStations = [];
  for (const row of rows) {
    const stationCount = await countPublishedStationsInCity(row.cityName);
    if (stationCount === 0) continue;
    withStations.push({
      ...row,
      href: cityLandingPath(row.slug),
      stationCount,
    });
  }
  return withStations;
}

export async function getPublicInsightBySlug(slug: string) {
  const prisma = getPrisma();
  const row = await prisma.insightArticle.findFirst({
    where: { slug, ...publicWhere },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      author: { select: { displayName: true, roleTitle: true } },
      reviewer: { select: { displayName: true, roleTitle: true } },
    },
  });
  if (!row) return null;
  return {
    ...omitInternal(row),
    href: insightPath(row.slug),
    faqs: row.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
    authorName: row.author?.displayName ?? null,
    authorRole: row.author?.roleTitle ?? null,
    reviewerName: row.reviewer?.displayName ?? null,
    relatedGuideHrefs: row.relatedGuideHrefs.filter((href) => isAllowedGuideHref(href)),
  };
}

export async function listPublishedInsights() {
  const prisma = getPrisma();
  const rows = await prisma.insightArticle.findMany({
    where: publicWhere,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      lastReviewedAt: true,
      updatedAt: true,
    },
  });
  return rows.map((row) => ({ ...row, href: insightPath(row.slug) }));
}

export async function getPublicRouteBySlug(slug: string) {
  const prisma = getPrisma();
  const parsed = parseRoutePairParam(slug);
  if (!parsed) return null;
  const row = await prisma.routeGuide.findFirst({
    where: { slug, ...publicWhere },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      reviewedBy: { select: { displayName: true, roleTitle: true } },
      stops: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!row) return null;
  const stopSlugs = row.stops.map((stop) => stop.stationSlug);
  const stations = await prisma.station.findMany({
    where: {
      slug: { in: stopSlugs },
      publicationStatus: "published",
      isDemo: false,
    },
    select: { id: true, slug: true, name: true, city: true, state: true, latitude: true, longitude: true },
  });
  const stationBySlug = new Map(stations.map((station) => [station.slug, station]));
  const publishedStops = row.stops
    .map((stop) => {
      const station = stationBySlug.get(stop.stationSlug);
      if (!station) return null;
      return {
        stationSlug: station.slug,
        name: station.name,
        city: station.city,
        state: station.state,
        latitude: Number(station.latitude),
        longitude: Number(station.longitude),
        stopNotes: stop.stopNotes,
        sortOrder: stop.sortOrder,
      };
    })
    .filter((stop): stop is NonNullable<typeof stop> => Boolean(stop));
  if (publishedStops.length === 0) return null;
  return {
    ...omitInternal(row),
    href: routeGuidePath(row.slug),
    faqs: row.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
    reviewerName: row.reviewedBy?.displayName ?? null,
    stops: publishedStops,
  };
}

export async function listPublishedRoutes() {
  const prisma = getPrisma();
  const rows = await prisma.routeGuide.findMany({
    where: publicWhere,
    orderBy: { originName: "asc" },
    include: { stops: { select: { stationSlug: true } } },
  });
  const summaries = [];
  for (const row of rows) {
    const published = await getPublicRouteBySlug(row.slug);
    if (!published) continue;
    summaries.push({
      slug: row.slug,
      href: routeGuidePath(row.slug),
      originName: row.originName,
      destinationName: row.destinationName,
      lastReviewedAt: row.lastReviewedAt,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
    });
  }
  return summaries;
}

export async function listEditorialSitemapEntries() {
  const [cities, insights, routes] = await Promise.all([
    listPublishedCitySummaries(),
    listPublishedInsights(),
    listPublishedRoutes(),
  ]);
  return {
    cities: cities.map((row) => ({
      path: row.href,
      lastModified: row.lastReviewedAt ?? row.publishedAt ?? row.updatedAt,
    })),
    insights: insights.map((row) => ({
      path: row.href,
      lastModified: row.lastReviewedAt ?? row.publishedAt ?? row.updatedAt,
    })),
    routes: routes.map((row) => ({
      path: row.href,
      lastModified: row.lastReviewedAt ?? row.publishedAt ?? row.updatedAt,
    })),
  };
}

export async function listAdminCities() {
  const prisma = getPrisma();
  return prisma.cityLandingContent.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function listAdminInsights() {
  const prisma = getPrisma();
  return prisma.insightArticle.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: true, reviewer: true },
  });
}

export async function listAdminRoutes() {
  const prisma = getPrisma();
  return prisma.routeGuide.findMany({
    orderBy: { updatedAt: "desc" },
    include: { stops: true },
  });
}

export async function listAdminAuthors() {
  const prisma = getPrisma();
  return prisma.contentAuthor.findMany({ orderBy: { displayName: "asc" } });
}

export async function getAdminCity(id: string) {
  const prisma = getPrisma();
  return prisma.cityLandingContent.findUnique({
    where: { id },
    include: { faqs: { orderBy: { sortOrder: "asc" } }, reviewedBy: true },
  });
}

export async function getAdminInsight(id: string) {
  const prisma = getPrisma();
  return prisma.insightArticle.findUnique({
    where: { id },
    include: { faqs: { orderBy: { sortOrder: "asc" } }, author: true, reviewer: true },
  });
}

export async function getAdminRoute(id: string) {
  const prisma = getPrisma();
  return prisma.routeGuide.findUnique({
    where: { id },
    include: { faqs: { orderBy: { sortOrder: "asc" } }, stops: { orderBy: { sortOrder: "asc" } } },
  });
}

type FieldErrors = Record<string, string>;

function parseCityInput(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const cityName = trim(data.cityName);
  const stateName = trim(data.stateName);
  if (cityName.length < 2) errors.cityName = "Enter the city name.";
  if (stateName.length < 2) errors.stateName = "Enter the state name.";
  const slug = optionalTrim(data.slug) || pathSegment(cityName);
  const intro = trim(data.intro);
  const accessGuidance = trim(data.accessGuidance);
  const connectorGuidance = trim(data.connectorGuidance);
  if (intro.length < 40) errors.intro = "Write unique city guidance (at least a short paragraph).";
  if (accessGuidance.length < 20) errors.accessGuidance = "Describe local access rules.";
  if (connectorGuidance.length < 20) errors.connectorGuidance = "Describe connectors that matter in this city.";
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      slug,
      cityName,
      stateName,
      intro,
      accessGuidance,
      connectorGuidance,
      localNotes: optionalTrim(data.localNotes),
      showFleetModule: boolField(data.showFleetModule),
      locale: optionalTrim(data.locale) || "en-IN",
      seoTitle: optionalTrim(data.seoTitle),
      seoDescription: optionalTrim(data.seoDescription),
      reviewedById: optionalTrim(data.reviewedById),
      internalNotes: optionalTrim(data.internalNotes),
      faqs: parseFaqs(data.faqs),
    },
  };
}

async function replaceFaqs(
  prisma: ReturnType<typeof getPrisma>,
  target: { cityId?: string; insightId?: string; routeId?: string },
  faqs: FaqInput[],
) {
  if (target.cityId) await prisma.contentFaq.deleteMany({ where: { cityId: target.cityId } });
  if (target.insightId) await prisma.contentFaq.deleteMany({ where: { insightId: target.insightId } });
  if (target.routeId) await prisma.contentFaq.deleteMany({ where: { routeId: target.routeId } });
  if (faqs.length === 0) return;
  await prisma.contentFaq.createMany({
    data: faqs.map((faq, index) => ({
      ...faq,
      sortOrder: index,
      cityId: target.cityId,
      insightId: target.insightId,
      routeId: target.routeId,
    })),
  });
}

export async function createCity(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseCityInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const existing = await prisma.cityLandingContent.findUnique({ where: { slug: parsed.value.slug } });
  if (existing) return { ok: false as const, errors: { slug: "That city slug is already used." } };
  const { faqs, ...data } = parsed.value;
  const city = await prisma.cityLandingContent.create({
    data: { ...data, publicationStatus: "draft", isDemo: false },
  });
  await replaceFaqs(prisma, { cityId: city.id }, faqs);
  await writeAudit({
    actor,
    action: "city.create",
    targetType: "city_landing",
    targetId: city.id,
    after: { slug: city.slug, publicationStatus: city.publicationStatus },
    requestId,
  });
  return { ok: true as const, city };
}

export async function updateCity(actor: StaffActor, id: string, raw: unknown, requestId?: string) {
  const parsed = parseCityInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const current = await prisma.cityLandingContent.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  if (parsed.value.slug !== current.slug) {
    const clash = await prisma.cityLandingContent.findUnique({ where: { slug: parsed.value.slug } });
    if (clash) return { ok: false as const, errors: { slug: "That city slug is already used." } };
  }
  const { faqs, ...data } = parsed.value;
  const city = await prisma.cityLandingContent.update({
    where: { id },
    data,
  });
  await replaceFaqs(prisma, { cityId: id }, faqs);
  await writeAudit({
    actor,
    action: "city.update",
    targetType: "city_landing",
    targetId: id,
    before: { slug: current.slug },
    after: { slug: city.slug },
    requestId,
  });
  return { ok: true as const, city };
}

export async function publishCity(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const city = await prisma.cityLandingContent.findUnique({
    where: { id },
    include: { faqs: true },
  });
  if (!city) return { ok: false as const, notFound: true as const };
  if (city.isDemo) {
    return { ok: false as const, errors: { publicationStatus: "Demo city pages cannot be published." } };
  }
  if (city.intro.trim().length < 80) {
    return { ok: false as const, errors: { intro: "Publish requires unique reviewed city guidance." } };
  }
  if (!city.lastReviewedAt) {
    return { ok: false as const, errors: { lastReviewedAt: "Record a review date before publishing." } };
  }
  const stations = await countPublishedStationsInCity(city.cityName);
  if (stations === 0) {
    return {
      ok: false as const,
      errors: { cityName: "A city page needs at least one published Plug and Go station in that city." },
    };
  }
  const updated = await prisma.cityLandingContent.update({
    where: { id },
    data: { publicationStatus: "published", publishedAt: city.publishedAt ?? new Date() },
  });
  await writeAudit({
    actor,
    action: "city.publish",
    targetType: "city_landing",
    targetId: id,
    before: { publicationStatus: city.publicationStatus },
    after: { publicationStatus: updated.publicationStatus },
    requestId,
  });
  return { ok: true as const, city: updated };
}

export async function reviewCity(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.cityLandingContent.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const city = await prisma.cityLandingContent.update({
    where: { id },
    data: { lastReviewedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "city.review",
    targetType: "city_landing",
    targetId: id,
    after: { lastReviewedAt: city.lastReviewedAt?.toISOString() },
    requestId,
  });
  return { ok: true as const, city };
}

function parseInsightInput(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const title = trim(data.title);
  const excerpt = trim(data.excerpt);
  const body = trim(data.body);
  if (title.length < 8) errors.title = "Enter a specific title.";
  if (excerpt.length < 40) errors.excerpt = "Write a unique excerpt.";
  if (body.length < 200) errors.body = "Write a full article, not a keyword stub.";
  const slug = optionalTrim(data.slug) || pathSegment(title);
  const relatedGuideHrefs = stringArray(data.relatedGuideHrefs).filter((href) => isAllowedGuideHref(href));
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      slug,
      title,
      excerpt,
      body,
      locale: optionalTrim(data.locale) || "en-IN",
      seoTitle: optionalTrim(data.seoTitle),
      seoDescription: optionalTrim(data.seoDescription),
      authorId: optionalTrim(data.authorId),
      reviewerId: optionalTrim(data.reviewerId),
      relatedStationSlugs: stringArray(data.relatedStationSlugs),
      relatedGuideHrefs,
      relatedCitySlug: optionalTrim(data.relatedCitySlug),
      internalNotes: optionalTrim(data.internalNotes),
      faqs: parseFaqs(data.faqs),
    },
  };
}

export async function createInsight(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseInsightInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const existing = await prisma.insightArticle.findUnique({ where: { slug: parsed.value.slug } });
  if (existing) return { ok: false as const, errors: { slug: "That article slug is already used." } };
  const { faqs, ...data } = parsed.value;
  const article = await prisma.insightArticle.create({
    data: { ...data, publicationStatus: "draft", isDemo: false },
  });
  await replaceFaqs(prisma, { insightId: article.id }, faqs);
  await writeAudit({
    actor,
    action: "insight.create",
    targetType: "insight_article",
    targetId: article.id,
    after: { slug: article.slug, publicationStatus: article.publicationStatus },
    requestId,
  });
  return { ok: true as const, article };
}

export async function updateInsight(actor: StaffActor, id: string, raw: unknown, requestId?: string) {
  const parsed = parseInsightInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const current = await prisma.insightArticle.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const { faqs, ...data } = parsed.value;
  const article = await prisma.insightArticle.update({ where: { id }, data });
  await replaceFaqs(prisma, { insightId: id }, faqs);
  await writeAudit({
    actor,
    action: "insight.update",
    targetType: "insight_article",
    targetId: id,
    before: { slug: current.slug },
    after: { slug: article.slug },
    requestId,
  });
  return { ok: true as const, article };
}

export async function publishInsight(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const article = await prisma.insightArticle.findUnique({ where: { id } });
  if (!article) return { ok: false as const, notFound: true as const };
  if (article.isDemo) {
    return { ok: false as const, errors: { publicationStatus: "Demo insight templates cannot be published." } };
  }
  if (article.body.trim().length < 400) {
    return { ok: false as const, errors: { body: "Publish requires a reviewed, substantial article." } };
  }
  if (!article.lastReviewedAt) {
    return { ok: false as const, errors: { lastReviewedAt: "Record a review date before publishing." } };
  }
  if (!article.authorId) {
    return { ok: false as const, errors: { authorId: "Assign an author before publishing." } };
  }
  const updated = await prisma.insightArticle.update({
    where: { id },
    data: { publicationStatus: "published", publishedAt: article.publishedAt ?? new Date() },
  });
  await writeAudit({
    actor,
    action: "insight.publish",
    targetType: "insight_article",
    targetId: id,
    before: { publicationStatus: article.publicationStatus },
    after: { publicationStatus: updated.publicationStatus },
    requestId,
  });
  return { ok: true as const, article: updated };
}

export async function reviewInsight(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.insightArticle.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const article = await prisma.insightArticle.update({
    where: { id },
    data: { lastReviewedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "insight.review",
    targetType: "insight_article",
    targetId: id,
    after: { lastReviewedAt: article.lastReviewedAt?.toISOString() },
    requestId,
  });
  return { ok: true as const, article };
}

function parseRouteInput(raw: unknown) {
  const data = asRecord(raw);
  const errors: FieldErrors = {};
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const originName = trim(data.originName);
  const destinationName = trim(data.destinationName);
  const originSlug = optionalTrim(data.originSlug) || pathSegment(originName);
  const destinationSlug = optionalTrim(data.destinationSlug) || pathSegment(destinationName);
  const routeNotes = trim(data.routeNotes);
  const accessCaveats = trim(data.accessCaveats);
  if (originName.length < 2) errors.originName = "Enter the origin city.";
  if (destinationName.length < 2) errors.destinationName = "Enter the destination city.";
  if (originSlug === destinationSlug) errors.destinationName = "Origin and destination must differ.";
  if (routeNotes.length < 80) errors.routeNotes = "Write a researched charging plan, not a city-pair stub.";
  if (accessCaveats.length < 20) errors.accessCaveats = "Record access caveats for the trip.";
  const stops = Array.isArray(data.stops)
    ? data.stops
        .map((row, index) => {
          const record = asRecord(row);
          if (!record) return null;
          const stationSlug = trim(record.stationSlug);
          if (!stationSlug) return null;
          return {
            stationSlug,
            sortOrder: index,
            stopNotes: optionalTrim(record.stopNotes),
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
    : [];
  if (Object.keys(errors).length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      originName,
      destinationName,
      originSlug,
      destinationSlug,
      slug: optionalTrim(data.slug) || routePairSlug(originSlug, destinationSlug),
      routeNotes,
      accessCaveats,
      locale: optionalTrim(data.locale) || "en-IN",
      seoTitle: optionalTrim(data.seoTitle),
      seoDescription: optionalTrim(data.seoDescription),
      reviewedById: optionalTrim(data.reviewedById),
      internalNotes: optionalTrim(data.internalNotes),
      faqs: parseFaqs(data.faqs),
      stops,
    },
  };
}

export async function createRoute(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseRouteInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const existing = await prisma.routeGuide.findUnique({ where: { slug: parsed.value.slug } });
  if (existing) return { ok: false as const, errors: { slug: "That route slug is already used." } };
  const { faqs, stops, ...data } = parsed.value;
  const route = await prisma.routeGuide.create({
    data: { ...data, publicationStatus: "draft", isDemo: false },
  });
  if (stops.length) {
    await prisma.routeStop.createMany({
      data: stops.map((stop) => ({ ...stop, routeId: route.id })),
    });
  }
  await replaceFaqs(prisma, { routeId: route.id }, faqs);
  await writeAudit({
    actor,
    action: "route.create",
    targetType: "route_guide",
    targetId: route.id,
    after: { slug: route.slug, publicationStatus: route.publicationStatus },
    requestId,
  });
  return { ok: true as const, route };
}

export async function updateRoute(actor: StaffActor, id: string, raw: unknown, requestId?: string) {
  const parsed = parseRouteInput(raw);
  if (!parsed.ok) return parsed;
  const prisma = getPrisma();
  const current = await prisma.routeGuide.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const { faqs, stops, ...data } = parsed.value;
  const route = await prisma.routeGuide.update({ where: { id }, data });
  await prisma.routeStop.deleteMany({ where: { routeId: id } });
  if (stops.length) {
    await prisma.routeStop.createMany({
      data: stops.map((stop) => ({ ...stop, routeId: id })),
    });
  }
  await replaceFaqs(prisma, { routeId: id }, faqs);
  await writeAudit({
    actor,
    action: "route.update",
    targetType: "route_guide",
    targetId: id,
    before: { slug: current.slug },
    after: { slug: route.slug },
    requestId,
  });
  return { ok: true as const, route };
}

export async function publishRoute(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const route = await prisma.routeGuide.findUnique({
    where: { id },
    include: { stops: true },
  });
  if (!route) return { ok: false as const, notFound: true as const };
  if (route.isDemo) {
    return { ok: false as const, errors: { publicationStatus: "Demo route guides cannot be published." } };
  }
  if (!route.lastReviewedAt) {
    return { ok: false as const, errors: { lastReviewedAt: "Record a review date before publishing." } };
  }
  if (route.routeNotes.trim().length < 80) {
    return { ok: false as const, errors: { routeNotes: "Publish requires a researched charging plan." } };
  }
  const slugs = route.stops.map((stop) => stop.stationSlug);
  const publishedStops = await prisma.station.count({
    where: { slug: { in: slugs }, publicationStatus: "published", isDemo: false },
  });
  if (publishedStops === 0) {
    return {
      ok: false as const,
      errors: { stops: "A published route needs at least one real published Plug and Go stop." },
    };
  }
  const updated = await prisma.routeGuide.update({
    where: { id },
    data: { publicationStatus: "published", publishedAt: route.publishedAt ?? new Date() },
  });
  await writeAudit({
    actor,
    action: "route.publish",
    targetType: "route_guide",
    targetId: id,
    before: { publicationStatus: route.publicationStatus },
    after: { publicationStatus: updated.publicationStatus },
    requestId,
  });
  return { ok: true as const, route: updated };
}

export async function reviewRoute(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.routeGuide.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const route = await prisma.routeGuide.update({
    where: { id },
    data: { lastReviewedAt: new Date() },
  });
  await writeAudit({
    actor,
    action: "route.review",
    targetType: "route_guide",
    targetId: id,
    after: { lastReviewedAt: route.lastReviewedAt?.toISOString() },
    requestId,
  });
  return { ok: true as const, route };
}

export async function createAuthor(actor: StaffActor, raw: unknown, requestId?: string) {
  const data = asRecord(raw);
  if (!data) return { ok: false as const, errors: { form: "Expected a JSON object." } };
  const displayName = trim(data.displayName);
  if (displayName.length < 2) return { ok: false as const, errors: { displayName: "Enter a display name." } };
  const prisma = getPrisma();
  const author = await prisma.contentAuthor.create({
    data: {
      displayName,
      roleTitle: optionalTrim(data.roleTitle),
      bio: optionalTrim(data.bio),
      publicationStatus: "published",
      isDemo: false,
    },
  });
  await writeAudit({
    actor,
    action: "author.create",
    targetType: "content_author",
    targetId: author.id,
    after: { displayName: author.displayName },
    requestId,
  });
  return { ok: true as const, author };
}

export async function getAdminCityBySlug(slug: string) {
  const prisma = getPrisma();
  return prisma.cityLandingContent.findUnique({
    where: { slug },
    include: { faqs: { orderBy: { sortOrder: "asc" } }, reviewedBy: true },
  });
}

export async function getAdminInsightBySlug(slug: string) {
  const prisma = getPrisma();
  return prisma.insightArticle.findUnique({
    where: { slug },
    include: { faqs: { orderBy: { sortOrder: "asc" } }, author: true, reviewer: true },
  });
}

export async function getAdminRouteBySlug(slug: string) {
  const prisma = getPrisma();
  return prisma.routeGuide.findUnique({
    where: { slug },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      stops: { orderBy: { sortOrder: "asc" } },
      reviewedBy: { select: { displayName: true } },
    },
  });
}

export async function getPublishedCityHrefForCityName(cityName: string) {
  const prisma = getPrisma();
  const row = await prisma.cityLandingContent.findFirst({
    where: {
      ...publicWhere,
      cityName: { equals: cityName, mode: "insensitive" },
    },
    select: { slug: true, cityName: true },
  });
  if (!row) return null;
  const stationCount = await countPublishedStationsInCity(row.cityName);
  if (stationCount === 0) return null;
  return { href: cityLandingPath(row.slug), cityName: row.cityName, slug: row.slug };
}

export async function unpublishCity(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.cityLandingContent.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const city = await prisma.cityLandingContent.update({
    where: { id },
    data: { publicationStatus: "archived" },
  });
  await writeAudit({
    actor,
    action: "city.unpublish",
    targetType: "city_landing",
    targetId: id,
    before: { publicationStatus: current.publicationStatus },
    after: { publicationStatus: city.publicationStatus },
    requestId,
  });
  return { ok: true as const, city };
}

export async function unpublishInsight(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.insightArticle.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const article = await prisma.insightArticle.update({
    where: { id },
    data: { publicationStatus: "archived" },
  });
  await writeAudit({
    actor,
    action: "insight.unpublish",
    targetType: "insight_article",
    targetId: id,
    before: { publicationStatus: current.publicationStatus },
    after: { publicationStatus: article.publicationStatus },
    requestId,
  });
  return { ok: true as const, article };
}

export async function unpublishRoute(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.routeGuide.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const route = await prisma.routeGuide.update({
    where: { id },
    data: { publicationStatus: "archived" },
  });
  await writeAudit({
    actor,
    action: "route.unpublish",
    targetType: "route_guide",
    targetId: id,
    before: { publicationStatus: current.publicationStatus },
    after: { publicationStatus: route.publicationStatus },
    requestId,
  });
  return { ok: true as const, route };
}

export { PUBLICATION_STATUSES, ALLOWED_RELATED_GUIDES };
