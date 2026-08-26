-- CreateTable
CREATE TABLE "ContentAuthor" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleTitle" TEXT,
    "bio" TEXT,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "internalNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityLandingContent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "accessGuidance" TEXT NOT NULL,
    "connectorGuidance" TEXT NOT NULL,
    "localNotes" TEXT,
    "showFleetModule" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "lastReviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityLandingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "authorId" TEXT,
    "reviewerId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "relatedStationSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedGuideHrefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCitySlug" TEXT,
    "internalNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteGuide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "originSlug" TEXT NOT NULL,
    "destinationSlug" TEXT NOT NULL,
    "routeNotes" TEXT NOT NULL,
    "accessCaveats" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-IN',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "lastReviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stationId" TEXT,
    "stationSlug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "stopNotes" TEXT,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "cityId" TEXT,
    "insightId" TEXT,
    "routeId" TEXT,

    CONSTRAINT "ContentFaq_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CityLandingContent_slug_key" ON "CityLandingContent"("slug");
CREATE INDEX "CityLandingContent_publicationStatus_slug_idx" ON "CityLandingContent"("publicationStatus", "slug");
CREATE INDEX "CityLandingContent_cityName_idx" ON "CityLandingContent"("cityName");

CREATE UNIQUE INDEX "InsightArticle_slug_key" ON "InsightArticle"("slug");
CREATE INDEX "InsightArticle_publicationStatus_idx" ON "InsightArticle"("publicationStatus");

CREATE UNIQUE INDEX "RouteGuide_slug_key" ON "RouteGuide"("slug");
CREATE UNIQUE INDEX "RouteGuide_originSlug_destinationSlug_key" ON "RouteGuide"("originSlug", "destinationSlug");
CREATE INDEX "RouteGuide_publicationStatus_slug_idx" ON "RouteGuide"("publicationStatus", "slug");

CREATE INDEX "RouteStop_routeId_sortOrder_idx" ON "RouteStop"("routeId", "sortOrder");

ALTER TABLE "CityLandingContent" ADD CONSTRAINT "CityLandingContent_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ContentAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsightArticle" ADD CONSTRAINT "InsightArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "ContentAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InsightArticle" ADD CONSTRAINT "InsightArticle_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ContentAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RouteGuide" ADD CONSTRAINT "RouteGuide_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ContentAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "RouteGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentFaq" ADD CONSTRAINT "ContentFaq_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityLandingContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentFaq" ADD CONSTRAINT "ContentFaq_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "InsightArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentFaq" ADD CONSTRAINT "ContentFaq_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "RouteGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
