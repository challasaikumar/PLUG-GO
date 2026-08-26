import type { Prisma, PublicationStatus, TariffApprovalStatus } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { writeAudit } from "@/lib/catalogue/audit";
import {
  parseStationWrite,
  slugify,
  type StationWriteInput,
} from "@/lib/catalogue/validation";
import { getPrisma } from "@/lib/db/prisma";
import { hoursAreReliable, isOpenAt } from "@/lib/finder/hours";
import type { FinderQuery } from "@/lib/finder/query";
import { aggregateStationStatus, STATION_STATUS_RANK } from "@/lib/finder/station-status";
import {
  boundingBoxFromRadiusKm,
  haversineKm,
  stationCanonicalPath,
} from "@/lib/geo";
import { computePublicStatus } from "@/lib/status";
import { estimateTariff } from "@/lib/tariff/estimate";
import { startingPriceLabel } from "@/lib/tariff/format";

export const publicStationWhere: Prisma.StationWhereInput = {
  publicationStatus: "published",
  isDemo: false,
};

function latLng(value: StationWriteInput) {
  return {
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export async function createStation(actor: StaffActor, raw: unknown, requestId?: string) {
  const parsed = parseStationWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const slug = parsed.value.slug || slugify(parsed.value.name, parsed.value.city);
  const existing = await prisma.station.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false as const, errors: { slug: "That slug is already used." } };
  }

  const station = await prisma.station.create({
    data: {
      ...parsed.value,
      ...latLng(parsed.value),
      slug,
      accessHoursStructured: parsed.value.accessHoursStructured as Prisma.InputJsonValue | undefined,
      publicationStatus: "draft",
      isDemo: false,
      verifiedBy: actor.id,
    },
  });
  await writeAudit({
    actor,
    action: "station.create",
    targetType: "station",
    targetId: station.id,
    after: { name: station.name, slug: station.slug, publicationStatus: station.publicationStatus },
    requestId,
  });
  return { ok: true as const, station };
}

export async function updateStation(
  actor: StaffActor,
  id: string,
  raw: unknown,
  requestId?: string,
) {
  const parsed = parseStationWrite(raw);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };
  const prisma = getPrisma();
  const current = await prisma.station.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };

  const slug = parsed.value.slug || current.slug;
  if (slug !== current.slug) {
    const clash = await prisma.station.findUnique({ where: { slug } });
    if (clash) return { ok: false as const, errors: { slug: "That slug is already used." } };
  }

  const station = await prisma.station.update({
    where: { id },
    data: {
      ...parsed.value,
      ...latLng(parsed.value),
      slug,
      accessHoursStructured: parsed.value.accessHoursStructured as Prisma.InputJsonValue | undefined,
      revision: { increment: 1 },
      verifiedBy: actor.id,
      lastVerifiedAt: new Date(),
      publicationStatus:
        current.publicationStatus === "published" ? "published" : current.publicationStatus,
    },
  });
  await writeAudit({
    actor,
    action: "station.update",
    targetType: "station",
    targetId: id,
    before: { name: current.name, slug: current.slug, revision: current.revision },
    after: { name: station.name, slug: station.slug, revision: station.revision },
    requestId,
  });
  return { ok: true as const, station };
}

export async function publishStation(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const station = await prisma.station.findUnique({
    where: { id },
    include: { connectors: true },
  });
  if (!station) return { ok: false as const, notFound: true as const };
  if (station.isDemo) {
    return {
      ok: false as const,
      errors: { publicationStatus: "Demo stations cannot be published." },
    };
  }
  const installed = station.connectors.filter((row) => row.installationStatus === "installed");
  if (installed.length === 0) {
    return { ok: false as const, errors: { connectors: "Add at least one installed connector." } };
  }
  if (!station.lastVerifiedAt || !station.verifiedBy) {
    return {
      ok: false as const,
      errors: { lastVerifiedAt: "Record a verification before publishing." },
    };
  }

  const updated = await prisma.station.update({
    where: { id },
    data: {
      publicationStatus: "published",
      publishedAt: new Date(),
      revision: { increment: 1 },
    },
  });
  await writeAudit({
    actor,
    action: "station.publish",
    targetType: "station",
    targetId: id,
    before: { publicationStatus: station.publicationStatus },
    after: { publicationStatus: updated.publicationStatus },
    requestId,
  });
  return { ok: true as const, station: updated };
}

export async function verifyStation(actor: StaffActor, id: string, scope: string, notes: string | undefined, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.station.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const now = new Date();
  await prisma.stationVerification.create({
    data: {
      stationId: id,
      verifiedBy: actor.id,
      verifiedAt: now,
      scope: scope.trim() || "facts",
      notes,
    },
  });
  const station = await prisma.station.update({
    where: { id },
    data: { verifiedBy: actor.id, lastVerifiedAt: now },
  });
  await writeAudit({
    actor,
    action: "station.verify",
    targetType: "station",
    targetId: id,
    after: { scope: scope.trim() || "facts", lastVerifiedAt: now.toISOString() },
    requestId,
  });
  return { ok: true as const, station };
}

export async function archiveStation(actor: StaffActor, id: string, requestId?: string) {
  const prisma = getPrisma();
  const current = await prisma.station.findUnique({ where: { id } });
  if (!current) return { ok: false as const, notFound: true as const };
  const updated = await prisma.station.update({
    where: { id },
    data: {
      publicationStatus: "archived",
      archivedAt: new Date(),
      revision: { increment: 1 },
    },
  });
  await writeAudit({
    actor,
    action: "station.archive",
    targetType: "station",
    targetId: id,
    before: { publicationStatus: current.publicationStatus },
    after: { publicationStatus: updated.publicationStatus },
    requestId,
  });
  return { ok: true as const, station: updated };
}

export async function listAdminStations(filters: {
  publicationStatus?: PublicationStatus;
  q?: string;
}) {
  const prisma = getPrisma();
  return prisma.station.findMany({
    where: {
      publicationStatus: filters.publicationStatus,
      OR: filters.q
        ? [
            { name: { contains: filters.q, mode: "insensitive" } },
            { city: { contains: filters.q, mode: "insensitive" } },
            { slug: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      host: true,
      _count: { select: { connectors: true, tariffs: true } },
    },
  });
}

export async function getAdminStation(id: string) {
  const prisma = getPrisma();
  return prisma.station.findUnique({
    where: { id },
    include: {
      host: true,
      organisation: true,
      evses: { include: { connectors: { include: { currentStatus: true } } } },
      tariffs: { include: { lineItems: true }, orderBy: { createdAt: "desc" } },
      media: true,
      verifications: { orderBy: { verifiedAt: "desc" }, take: 20 },
    },
  });
}

const publicInclude = {
  evses: {
    where: { installationStatus: "installed" },
    include: {
      connectors: {
        where: { installationStatus: "installed" },
        include: { currentStatus: true },
      },
    },
  },
  media: {
    where: { publicationStatus: "published", rightsConfirmed: true },
  },
  tariffs: {
    where: { approvalStatus: "approved" as TariffApprovalStatus },
    include: { lineItems: true },
  },
} satisfies Prisma.StationInclude;

export function toPublicStation(station: Prisma.StationGetPayload<{ include: typeof publicInclude }>) {
  const connectors = station.evses.flatMap((evse) =>
    evse.connectors.map((connector) => {
      const computed = computePublicStatus({
        recordedStatus: connector.currentStatus?.recordedStatus ?? null,
        statusUpdatedAt: connector.currentStatus?.statusUpdatedAt ?? null,
        overrideExpiresAt: connector.currentStatus?.overrideExpiresAt ?? null,
      });
      return {
        publicRef: connector.publicRef,
        connectorId: connector.id,
        evseId: connector.evseId,
        evseLabel: evse.evseLabel,
        connectorIndex: connector.connectorIndex,
        connectorType: connector.connectorType,
        maxKw: connector.maxPowerWatts / 1000,
        vehicleCompatibilityNotes: connector.vehicleCompatibilityNotes,
        publicStatus: computed.publicStatus,
        statusUpdatedAt: computed.statusUpdatedAt,
        freshness: {
          policy: computed.freshnessPolicy,
          minutes: computed.freshnessMinutes,
          reason: computed.reason,
        },
      };
    }),
  );

  const now = new Date();
  const publishedTariff = station.tariffs.find((tariff) => {
    if (tariff.effectiveFrom > now) return false;
    if (tariff.effectiveTo && tariff.effectiveTo <= now) return false;
    return true;
  });

  return {
    stationId: station.id,
    slug: station.slug,
    name: station.name,
    city: station.city,
    state: station.state,
    latitude: Number(station.latitude),
    longitude: Number(station.longitude),
    address: {
      line1: station.addressLine1,
      line2: station.addressLine2,
      locality: station.locality,
      district: station.district,
      pincode: station.pincode,
      country: station.country,
      landmark: station.landmark,
    },
    arrivalInstructions: station.arrivalInstructions,
    access: {
      type: station.accessType,
      hoursSummary: station.accessHoursSummary,
      hoursStructured: station.accessHoursStructured,
      restrictions: station.accessRestrictions,
      is24_7: station.is24_7,
      parkingDetails: station.parkingDetails,
      parkingFeeApplies: station.parkingFeeApplies,
      bookingRequired: station.bookingRequired,
    },
    amenities: station.amenities,
    accessibilityNotes: station.accessibilityNotes,
    accessibleBayCount: station.accessibleBayCount,
    operationalLifecycle: station.operationalLifecycle,
    paymentMethods: station.paymentMethods,
    authenticationMethods: station.authenticationMethods,
    compatibleVehicleNotes: station.compatibleVehicleNotes,
    support: {
      phone: station.supportPhoneOverride,
      email: station.supportEmailOverride,
    },
    emergencyInstructions: station.emergencyInstructions,
    photos: station.media.map((photo) => ({
      id: photo.id,
      kind: photo.kind,
      url: photo.storageUrl,
      caption: photo.caption,
      altText: photo.altText,
    })),
    connectors,
    installedConnectorCount: connectors.length,
    availableConnectorCount: connectors.filter((row) => row.publicStatus === "available").length,
    tariff: publishedTariff
      ? {
          tariffVersionId: publishedTariff.id,
          currency: publishedTariff.currency,
          effectiveFrom: publishedTariff.effectiveFrom.toISOString(),
          effectiveTo: publishedTariff.effectiveTo?.toISOString() ?? null,
          timeBand: publishedTariff.timeBand,
          energyPaisePerKwh: publishedTariff.energyPaisePerKwh,
          servicePaisePerKwh: publishedTariff.servicePaisePerKwh,
          parkingPaiseFlat: publishedTariff.parkingPaiseFlat,
          parkingPaisePerMin: publishedTariff.parkingPaisePerMin,
          idlePaisePerMin: publishedTariff.idlePaisePerMin,
          idleGraceMinutes: publishedTariff.idleGraceMinutes,
          reservationPaise: publishedTariff.reservationPaise,
          gstRateBps: publishedTariff.gstRateBps,
          discountKind: publishedTariff.discountKind,
          discountName: publishedTariff.discountName,
          discountValue: publishedTariff.discountValue,
          estimateDisclaimer: publishedTariff.estimateDisclaimer,
        }
      : null,
    provenance: {
      dataSource: station.dataSource,
      lastVerifiedAt: station.lastVerifiedAt?.toISOString() ?? null,
      statusUpdatedAt: station.statusUpdatedAt?.toISOString() ?? null,
    },
  };
}

export type PublicStation = ReturnType<typeof toPublicStation>;

export type PublicStationListItem = {
  stationId: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  locality: string | null;
  pincode: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  href: string;
  accessType: string;
  hoursSummary: string;
  hoursReliable: boolean;
  openNow: boolean | null;
  amenities: string[];
  accessibleBayCount: number | null;
  accessibilityNotes: string | null;
  connectors: Array<{
    connectorType: string;
    maxKw: number;
    publicStatus: PublicStation["connectors"][number]["publicStatus"];
    statusUpdatedAt: string | null;
  }>;
  installedConnectorCount: number;
  availableConnectorCount: number;
  publicStatus: PublicStation["connectors"][number]["publicStatus"];
  statusUpdatedAt: string | null;
  maxKw: number | null;
  startingPriceLabel: string | null;
  energyPaisePerKwh: number | null;
  pricePublished: boolean;
  lastVerifiedAt: string | null;
  distanceKm: number | null;
};

function toPublicListItem(
  station: Prisma.StationGetPayload<{ include: typeof publicInclude }>,
  origin: { lat: number; lng: number } | null,
  now: Date,
): PublicStationListItem {
  const mapped = toPublicStation(station);
  const connectors = mapped.connectors.map((connector) => ({
    connectorType: connector.connectorType,
    maxKw: connector.maxKw,
    publicStatus: connector.publicStatus,
    statusUpdatedAt: connector.statusUpdatedAt,
  }));
  const aggregate = aggregateStationStatus(connectors);
  const maxKw = connectors.reduce((highest, connector) => Math.max(highest, connector.maxKw), 0);
  const hoursInput = {
    is24_7: mapped.access.is24_7,
    hoursStructured: mapped.access.hoursStructured,
  };
  const distanceKm = origin
    ? haversineKm(origin.lat, origin.lng, mapped.latitude, mapped.longitude)
    : null;

  return {
    stationId: mapped.stationId,
    slug: mapped.slug,
    name: mapped.name,
    city: mapped.city,
    state: mapped.state,
    locality: mapped.address.locality,
    pincode: mapped.address.pincode,
    landmark: mapped.address.landmark,
    latitude: mapped.latitude,
    longitude: mapped.longitude,
    href: stationCanonicalPath(mapped),
    accessType: mapped.access.type,
    hoursSummary: mapped.access.hoursSummary,
    hoursReliable: hoursAreReliable(hoursInput),
    openNow: isOpenAt(hoursInput, now),
    amenities: mapped.amenities,
    accessibleBayCount: mapped.accessibleBayCount,
    accessibilityNotes: mapped.accessibilityNotes,
    connectors,
    installedConnectorCount: mapped.installedConnectorCount,
    availableConnectorCount: mapped.availableConnectorCount,
    publicStatus: aggregate.publicStatus,
    statusUpdatedAt: aggregate.statusUpdatedAt ?? mapped.provenance.statusUpdatedAt,
    maxKw: maxKw > 0 ? maxKw : null,
    startingPriceLabel: startingPriceLabel(mapped.tariff?.energyPaisePerKwh),
    energyPaisePerKwh: mapped.tariff?.energyPaisePerKwh ?? null,
    pricePublished: Boolean(mapped.tariff),
    lastVerifiedAt: mapped.provenance.lastVerifiedAt,
    distanceKm,
  };
}

function publicSearchWhere(input: {
  q?: string;
  city?: string;
  state?: string;
  connectorType?: string;
  minKw?: number;
  access?: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}): Prisma.StationWhereInput {
  const q = input.q?.trim();
  const connectorFilter =
    input.connectorType || input.minKw
      ? {
          some: {
            installationStatus: "installed" as const,
            connectorType: input.connectorType ? (input.connectorType as never) : undefined,
            maxPowerWatts: input.minKw ? { gte: input.minKw * 1000 } : undefined,
          },
        }
      : undefined;

  return {
    ...publicStationWhere,
    city: input.city ? { equals: input.city, mode: "insensitive" } : undefined,
    state: input.state ? { equals: input.state, mode: "insensitive" } : undefined,
    accessType: input.access ? (input.access as never) : undefined,
    connectors: connectorFilter,
    latitude:
      input.south !== undefined && input.north !== undefined
        ? { gte: input.south, lte: input.north }
        : undefined,
    longitude:
      input.west !== undefined && input.east !== undefined
        ? { gte: input.west, lte: input.east }
        : undefined,
    OR: q
      ? [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } },
          { landmark: { contains: q, mode: "insensitive" } },
          { addressLine1: { contains: q, mode: "insensitive" } },
          { addressLine2: { contains: q, mode: "insensitive" } },
          { locality: { contains: q, mode: "insensitive" } },
          { district: { contains: q, mode: "insensitive" } },
          { pincode: { contains: q, mode: "insensitive" } },
        ]
      : undefined,
  };
}

function sortPublicStations(
  stations: PublicStationListItem[],
  sort: FinderQuery["sort"],
  hasOrigin: boolean,
): PublicStationListItem[] {
  const copy = [...stations];
  const applied = sort === "nearest" && !hasOrigin ? "name" : sort;
  copy.sort((a, b) => {
    if (applied === "nearest") {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
    }
    if (applied === "availability") {
      const rank = STATION_STATUS_RANK[a.publicStatus] - STATION_STATUS_RANK[b.publicStatus];
      if (rank !== 0) return rank;
    }
    if (applied === "power") {
      const pa = a.maxKw ?? -1;
      const pb = b.maxKw ?? -1;
      if (pa !== pb) return pb - pa;
    }
    if (applied === "price") {
      const pa = a.energyPaisePerKwh ?? Number.POSITIVE_INFINITY;
      const pb = b.energyPaisePerKwh ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
    }
    const city = a.city.localeCompare(b.city, "en-IN");
    if (city !== 0) return city;
    return a.name.localeCompare(b.name, "en-IN");
  });
  return copy;
}

export type PublicListInput = {
  page: number;
  pageSize: number;
  skip?: number;
  q?: string;
  city?: string;
  state?: string;
  connectorType?: string;
  minKw?: number;
  availability?: PublicStationListItem["publicStatus"];
  access?: string;
  openNow?: boolean;
  amenity?: string;
  accessible?: boolean;
  sort?: FinderQuery["sort"];
  lat?: number;
  lng?: number;
  radiusKm?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  now?: Date;
};

export async function countPublishedStations() {
  const prisma = getPrisma();
  return prisma.station.count({ where: publicStationWhere });
}

export async function listPublishedFilterFacets() {
  const prisma = getPrisma();
  const rows = await prisma.station.findMany({
    where: publicStationWhere,
    select: {
      amenities: true,
      accessibleBayCount: true,
      accessibilityNotes: true,
      connectors: {
        where: { installationStatus: "installed" },
        select: { connectorType: true },
      },
    },
  });
  const connectorTypes = new Set<string>();
  const amenities = new Set<string>();
  let hasAccessibility = false;
  for (const row of rows) {
    for (const connector of row.connectors) connectorTypes.add(connector.connectorType);
    for (const amenity of row.amenities) {
      if (amenity.trim()) amenities.add(amenity.trim());
    }
    if ((row.accessibleBayCount ?? 0) > 0 || row.accessibilityNotes?.trim()) {
      hasAccessibility = true;
    }
  }
  return {
    connectorTypes: Array.from(connectorTypes).sort(),
    amenities: Array.from(amenities).sort((a, b) => a.localeCompare(b, "en-IN")),
    hasAccessibility,
  };
}

export async function listPublishedStationPaths() {
  const prisma = getPrisma();
  const rows = await prisma.station.findMany({
    where: publicStationWhere,
    select: {
      slug: true,
      city: true,
      state: true,
      updatedAt: true,
      lastVerifiedAt: true,
      publishedAt: true,
    },
    orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => ({
    path: stationCanonicalPath(row),
    lastModified: row.lastVerifiedAt ?? row.publishedAt ?? row.updatedAt,
  }));
}

export async function listPublicStations(input: PublicListInput) {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  let north = input.north;
  let south = input.south;
  let east = input.east;
  let west = input.west;
  if (
    input.lat !== undefined &&
    input.lng !== undefined &&
    input.radiusKm &&
    north === undefined
  ) {
    const box = boundingBoxFromRadiusKm(input.lat, input.lng, input.radiusKm);
    north = box.north;
    south = box.south;
    east = box.east;
    west = box.west;
  }

  const where = publicSearchWhere({
    q: input.q,
    city: input.city,
    state: input.state,
    connectorType: input.connectorType,
    minKw: input.minKw,
    access: input.access,
    north,
    south,
    east,
    west,
  });

  const origin =
    input.lat !== undefined && input.lng !== undefined
      ? { lat: input.lat, lng: input.lng }
      : null;

  const [publishedTotal, rows] = await Promise.all([
    prisma.station.count({ where: publicStationWhere }),
    prisma.station.findMany({
      where,
      orderBy: [{ city: "asc" }, { name: "asc" }],
      include: publicInclude,
    }),
  ]);

  let stations = rows.map((row) => toPublicListItem(row, origin, now));

  if (input.radiusKm && origin) {
    stations = stations.filter(
      (station) => station.distanceKm != null && station.distanceKm <= input.radiusKm!,
    );
  }
  if (input.availability) {
    stations = stations.filter((station) => station.publicStatus === input.availability);
  }
  if (input.openNow) {
    stations = stations.filter((station) => station.openNow === true);
  }
  if (input.amenity?.trim()) {
    const needle = input.amenity.trim().toLowerCase();
    stations = stations.filter((station) =>
      station.amenities.some((item) => item.toLowerCase() === needle),
    );
  }
  if (input.accessible) {
    stations = stations.filter(
      (station) =>
        (station.accessibleBayCount ?? 0) > 0 || Boolean(station.accessibilityNotes?.trim()),
    );
  }

  const sort = input.sort ?? "name";
  stations = sortPublicStations(stations, sort, Boolean(origin));
  const total = stations.length;
  const skip = input.skip ?? (input.page - 1) * input.pageSize;
  const pageRows = stations.slice(skip, skip + input.pageSize);

  return {
    page: input.page,
    pageSize: input.pageSize,
    total,
    publishedTotal,
    sortApplied: sort === "nearest" && !origin ? ("name" as const) : sort,
    nearestRequiresLocation: sort === "nearest" && !origin,
    stations: pageRows,
  };
}

export async function listNearbyPublicStations(input: {
  slug: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
  connectorTypes?: string[];
}) {
  const prisma = getPrisma();
  const radiusKm = input.radiusKm ?? 25;
  const limit = input.limit ?? 3;
  const box = boundingBoxFromRadiusKm(input.latitude, input.longitude, radiusKm);
  const rows = await prisma.station.findMany({
    where: {
      ...publicStationWhere,
      slug: { not: input.slug },
      latitude: { gte: box.south, lte: box.north },
      longitude: { gte: box.west, lte: box.east },
    },
    include: publicInclude,
  });
  const origin = { lat: input.latitude, lng: input.longitude };
  const now = new Date();
  let stations = rows
    .map((row) => toPublicListItem(row, origin, now))
    .filter((station) => station.distanceKm != null && station.distanceKm <= radiusKm);

  if (input.connectorTypes && input.connectorTypes.length > 0) {
    const wanted = new Set(input.connectorTypes);
    const compatible = stations.filter((station) =>
      station.connectors.some((connector) => wanted.has(connector.connectorType)),
    );
    if (compatible.length > 0) stations = compatible;
  }

  stations.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  return stations.slice(0, limit);
}

export async function getPublicStationBySlug(slug: string) {
  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { slug, ...publicStationWhere },
    include: publicInclude,
  });
  if (!station) return null;
  return toPublicStation(station);
}

export async function estimatePublicTariff(
  slug: string,
  query: {
    energyKwhMilli: number;
    idleMinutes?: number;
    parkingMinutes?: number;
    includeReservation?: boolean;
    connectorId?: string;
    at?: Date;
  },
) {
  const prisma = getPrisma();
  const station = await prisma.station.findFirst({
    where: { slug, ...publicStationWhere },
    include: {
      tariffs: { where: { approvalStatus: "approved" }, include: { lineItems: true } },
    },
  });
  if (!station) return { ok: false as const, notFound: true as const };

  const at = query.at ?? new Date();
  const version = station.tariffs.find((tariff) => {
    if (query.connectorId && tariff.connectorId && tariff.connectorId !== query.connectorId) {
      return false;
    }
    if (tariff.effectiveFrom > at) return false;
    if (tariff.effectiveTo && tariff.effectiveTo <= at) return false;
    return true;
  });
  if (!version) {
    return { ok: false as const, unpublished: true as const };
  }

  const extraLines = version.lineItems
    .filter((item) => item.code === "custom")
    .map((item) => ({
      code: "custom" as const,
      label: item.label,
      calculation: item.calculation,
      ratePaise: item.ratePaise,
    }));

  return {
    ok: true as const,
    estimate: estimateTariff({
      tariffVersionId: version.id,
      effectiveFrom: version.effectiveFrom.toISOString(),
      effectiveTo: version.effectiveTo?.toISOString() ?? null,
      energyPaisePerKwh: version.energyPaisePerKwh,
      servicePaisePerKwh: version.servicePaisePerKwh,
      parkingPaiseFlat: version.parkingPaiseFlat,
      parkingPaisePerMin: version.parkingPaisePerMin,
      idlePaisePerMin: version.idlePaisePerMin,
      idleGraceMinutes: version.idleGraceMinutes,
      reservationPaise: version.reservationPaise,
      gstRateBps: version.gstRateBps,
      discountKind: version.discountKind,
      discountName: version.discountName,
      discountValue: version.discountValue,
      extraLines,
      energyKwhMilli: query.energyKwhMilli,
      idleMinutes: query.idleMinutes,
      parkingMinutes: query.parkingMinutes,
      includeReservation: query.includeReservation,
      disclaimer: version.estimateDisclaimer,
    }),
  };
}
