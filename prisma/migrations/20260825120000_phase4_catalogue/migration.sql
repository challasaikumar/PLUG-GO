-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('staff_survey', 'host_report', 'operator_admin', 'csms_ocpp', 'photo_evidence', 'other');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('draft', 'pending_approval', 'published', 'archived');

-- CreateEnum
CREATE TYPE "HostType" AS ENUM ('mall', 'hotel', 'workplace', 'fuel_station', 'depot', 'residential', 'highway', 'other');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('prospect', 'active', 'paused', 'ended', 'unknown');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('public', 'restricted', 'guest_only', 'hotel_guest', 'members', 'private', 'unknown');

-- CreateEnum
CREATE TYPE "OperationalLifecycle" AS ENUM ('planned', 'commissioning', 'open', 'temporarily_closed', 'decommissioned');

-- CreateEnum
CREATE TYPE "PowerType" AS ENUM ('ac', 'dc', 'unknown');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('installed', 'planned', 'removed');

-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('ccs2', 'type2_ac', 'chademo', 'gbt_dc', 'gbt_ac', 'bharat_dc_001', 'bharat_ac_001', 'other', 'unknown');

-- CreateEnum
CREATE TYPE "RecordedStatus" AS ENUM ('available', 'in_use', 'faulted', 'offline', 'unknown');

-- CreateEnum
CREATE TYPE "AvailabilitySource" AS ENUM ('csms_ocpp', 'operator_override', 'technician', 'heartbeat_timeout', 'manual_import');

-- CreateEnum
CREATE TYPE "TariffApprovalStatus" AS ENUM ('draft', 'approved', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "TimeBand" AS ENUM ('all_hours', 'solar', 'non_solar', 'peak', 'off_peak', 'custom');

-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('none', 'flat_paise', 'percent_bps');

-- CreateEnum
CREATE TYPE "LineItemCode" AS ENUM ('energy', 'service', 'parking', 'idle', 'reservation', 'custom');

-- CreateEnum
CREATE TYPE "LineCalculation" AS ENUM ('per_kwh', 'per_minute', 'flat');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('entrance', 'parking_bay', 'charger', 'signage', 'connector', 'amenities', 'team', 'other');

-- CreateEnum
CREATE TYPE "SupportIssueCategory" AS ENUM ('did_not_start', 'connector_issue', 'wrong_data', 'access_parking', 'payment', 'refund', 'unsafe_fault', 'billing', 'host_enquiry', 'fleet_enquiry', 'other');

-- CreateEnum
CREATE TYPE "SupportIssueStatus" AS ENUM ('open', 'pending_user', 'pending_ops', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "SupportChannel" AS ENUM ('web_form', 'phone', 'email', 'later_in_app');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('content_manager', 'station_operator', 'support', 'finance', 'technician', 'super_admin');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "registeredAddress" TEXT NOT NULL,
    "gstin" TEXT,
    "supportPhone" TEXT,
    "supportEmail" TEXT,
    "grievanceContact" TEXT,
    "website" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "DataSource" NOT NULL,
    "verifiedBy" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "hostLegalName" TEXT NOT NULL,
    "hostDisplayName" TEXT NOT NULL,
    "hostType" "HostType" NOT NULL,
    "primaryContactName" TEXT,
    "primaryContactPhone" TEXT,
    "primaryContactEmail" TEXT,
    "contractStatus" "ContractStatus" NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "DataSource" NOT NULL,
    "verifiedBy" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "locality" TEXT,
    "district" TEXT,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "landmark" TEXT,
    "arrivalInstructions" TEXT,
    "accessType" "AccessType" NOT NULL DEFAULT 'unknown',
    "accessHoursSummary" TEXT NOT NULL,
    "accessHoursStructured" JSONB,
    "accessRestrictions" TEXT,
    "is24_7" BOOLEAN,
    "parkingDetails" TEXT,
    "parkingFeeApplies" BOOLEAN,
    "bookingRequired" BOOLEAN,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessibilityNotes" TEXT,
    "accessibleBayCount" INTEGER,
    "supportPhoneOverride" TEXT,
    "supportEmailOverride" TEXT,
    "emergencyInstructions" TEXT,
    "operationalLifecycle" "OperationalLifecycle" NOT NULL DEFAULT 'planned',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "paymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authenticationMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compatibleVehicleNotes" TEXT,
    "internalNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "DataSource" NOT NULL,
    "verifiedBy" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "statusUpdatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationMedia" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "altText" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evse" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "evseLabel" TEXT NOT NULL,
    "ocppChargePointId" TEXT,
    "ocppEvseId" TEXT,
    "maxPowerWatts" INTEGER NOT NULL,
    "powerType" "PowerType" NOT NULL,
    "installationStatus" "InstallationStatus" NOT NULL DEFAULT 'installed',
    "serialNumber" TEXT,
    "firmwareNotes" TEXT,
    "dataSource" "DataSource" NOT NULL,
    "verifiedBy" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "evseId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorIndex" INTEGER NOT NULL,
    "ocppConnectorId" INTEGER,
    "connectorType" "ConnectorType" NOT NULL,
    "maxPowerWatts" INTEGER NOT NULL,
    "maxCurrentA" INTEGER,
    "voltageV" INTEGER,
    "cableAttached" BOOLEAN,
    "installationStatus" "InstallationStatus" NOT NULL DEFAULT 'installed',
    "vehicleCompatibilityNotes" TEXT,
    "dataSource" "DataSource" NOT NULL,
    "verifiedBy" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffVersion" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorId" TEXT,
    "connectorType" "ConnectorType",
    "timeBand" "TimeBand" NOT NULL DEFAULT 'all_hours',
    "timeBandNotes" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "energyPaisePerKwh" INTEGER NOT NULL,
    "servicePaisePerKwh" INTEGER NOT NULL DEFAULT 0,
    "parkingPaiseFlat" INTEGER NOT NULL DEFAULT 0,
    "parkingPaisePerMin" INTEGER NOT NULL DEFAULT 0,
    "idlePaisePerMin" INTEGER NOT NULL DEFAULT 0,
    "idleGraceMinutes" INTEGER NOT NULL DEFAULT 0,
    "reservationPaise" INTEGER NOT NULL DEFAULT 0,
    "gstRateBps" INTEGER NOT NULL,
    "discountKind" "DiscountKind" NOT NULL DEFAULT 'none',
    "discountName" TEXT,
    "discountValue" INTEGER NOT NULL DEFAULT 0,
    "estimateDisclaimer" TEXT NOT NULL DEFAULT 'This is an estimate, not a tax invoice. The session invoice may differ.',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "approvalStatus" "TariffApprovalStatus" NOT NULL DEFAULT 'draft',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "dataSource" "DataSource" NOT NULL,
    "verifiedBy" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffLineItem" (
    "id" TEXT NOT NULL,
    "tariffVersionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "code" "LineItemCode" NOT NULL,
    "label" TEXT NOT NULL,
    "calculation" "LineCalculation" NOT NULL,
    "ratePaise" INTEGER NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TariffLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorAvailabilityEvent" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "evseId" TEXT,
    "connectorId" TEXT NOT NULL,
    "recordedStatus" "RecordedStatus" NOT NULL,
    "source" "AvailabilitySource" NOT NULL,
    "sourceEventId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "overrideReason" TEXT,
    "overrideExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorAvailabilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentConnectorStatus" (
    "connectorId" TEXT NOT NULL,
    "recordedStatus" "RecordedStatus" NOT NULL,
    "source" "AvailabilitySource" NOT NULL,
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastEventId" TEXT,
    "overrideReason" TEXT,
    "overrideExpiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentConnectorStatus_pkey" PRIMARY KEY ("connectorId")
);

-- CreateTable
CREATE TABLE "StationVerification" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "StationVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "StaffRole" NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "beforeSummary" JSONB,
    "afterSummary" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportIssue" (
    "id" TEXT NOT NULL,
    "publicReference" TEXT NOT NULL,
    "stationId" TEXT,
    "connectorId" TEXT,
    "category" "SupportIssueCategory" NOT NULL,
    "channel" "SupportChannel" NOT NULL DEFAULT 'web_form',
    "status" "SupportIssueStatus" NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Host_organisationId_idx" ON "Host"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "Station_slug_key" ON "Station"("slug");

-- CreateIndex
CREATE INDEX "Station_publicationStatus_city_idx" ON "Station"("publicationStatus", "city");

-- CreateIndex
CREATE INDEX "Station_state_city_idx" ON "Station"("state", "city");

-- CreateIndex
CREATE INDEX "Station_isDemo_idx" ON "Station"("isDemo");

-- CreateIndex
CREATE INDEX "StationMedia_stationId_publicationStatus_idx" ON "StationMedia"("stationId", "publicationStatus");

-- CreateIndex
CREATE INDEX "Evse_stationId_idx" ON "Evse"("stationId");

-- CreateIndex
CREATE INDEX "Connector_stationId_idx" ON "Connector"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "Connector_evseId_connectorIndex_key" ON "Connector"("evseId", "connectorIndex");

-- CreateIndex
CREATE INDEX "TariffVersion_stationId_approvalStatus_effectiveFrom_idx" ON "TariffVersion"("stationId", "approvalStatus", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TariffVersion_connectorId_idx" ON "TariffVersion"("connectorId");

-- CreateIndex
CREATE INDEX "TariffLineItem_tariffVersionId_idx" ON "TariffLineItem"("tariffVersionId");

-- CreateIndex
CREATE INDEX "ConnectorAvailabilityEvent_connectorId_occurredAt_idx" ON "ConnectorAvailabilityEvent"("connectorId", "occurredAt");

-- CreateIndex
CREATE INDEX "ConnectorAvailabilityEvent_stationId_occurredAt_idx" ON "ConnectorAvailabilityEvent"("stationId", "occurredAt");

-- CreateIndex
CREATE INDEX "StationVerification_stationId_verifiedAt_idx" ON "StationVerification"("stationId", "verifiedAt");

-- CreateIndex
CREATE INDEX "StaffAuditEvent_targetType_targetId_createdAt_idx" ON "StaffAuditEvent"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffAuditEvent_actorId_createdAt_idx" ON "StaffAuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportIssue_publicReference_key" ON "SupportIssue"("publicReference");

-- CreateIndex
CREATE INDEX "SupportIssue_stationId_status_idx" ON "SupportIssue"("stationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_key_actorId_route_key" ON "IdempotencyRecord"("key", "actorId", "route");

-- AddForeignKey
ALTER TABLE "Host" ADD CONSTRAINT "Host_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationMedia" ADD CONSTRAINT "StationMedia_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evse" ADD CONSTRAINT "Evse_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffVersion" ADD CONSTRAINT "TariffVersion_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffVersion" ADD CONSTRAINT "TariffVersion_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffLineItem" ADD CONSTRAINT "TariffLineItem_tariffVersionId_fkey" FOREIGN KEY ("tariffVersionId") REFERENCES "TariffVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAvailabilityEvent" ADD CONSTRAINT "ConnectorAvailabilityEvent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAvailabilityEvent" ADD CONSTRAINT "ConnectorAvailabilityEvent_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorAvailabilityEvent" ADD CONSTRAINT "ConnectorAvailabilityEvent_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentConnectorStatus" ADD CONSTRAINT "CurrentConnectorStatus_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationVerification" ADD CONSTRAINT "StationVerification_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

