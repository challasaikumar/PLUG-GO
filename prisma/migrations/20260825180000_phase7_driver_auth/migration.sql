-- CreateEnum
CREATE TYPE "DeletionRequestStatus" AS ENUM ('received', 'cancelled');

-- CreateEnum
CREATE TYPE "DataExportStatus" AS ENUM ('completed');

-- AlterTable
ALTER TABLE "Station" ADD COLUMN "publicRef" TEXT;
ALTER TABLE "Connector" ADD COLUMN "publicRef" TEXT;

UPDATE "Station" SET "publicRef" = 'st_' || substr(md5("id"), 1, 20) WHERE "publicRef" IS NULL;
UPDATE "Connector" SET "publicRef" = 'cn_' || substr(md5("id"), 1, 20) WHERE "publicRef" IS NULL;

ALTER TABLE "Station" ALTER COLUMN "publicRef" SET NOT NULL;
ALTER TABLE "Connector" ALTER COLUMN "publicRef" SET NOT NULL;

CREATE UNIQUE INDEX "Station_publicRef_key" ON "Station"("publicRef");
CREATE UNIQUE INDEX "Connector_publicRef_key" ON "Connector"("publicRef");

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "phoneCountry" TEXT NOT NULL DEFAULT 'IN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAuthChallenge" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "resendAvailableAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverAuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverSession" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverVehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "connectorType" "ConnectorType" NOT NULL,
    "batteryKwh" INTEGER,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedStation" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "productUpdates" BOOLEAN NOT NULL DEFAULT true,
    "marketingSms" BOOLEAN NOT NULL DEFAULT false,
    "marketingEmail" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "DataExportStatus" NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'received',
    "confirmedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAuditEvent" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "summary" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStartsAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateBucket_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "Driver_phoneE164_key" ON "Driver"("phoneE164");
CREATE INDEX "DriverAuthChallenge_phoneE164_createdAt_idx" ON "DriverAuthChallenge"("phoneE164", "createdAt");
CREATE INDEX "DriverAuthChallenge_expiresAt_idx" ON "DriverAuthChallenge"("expiresAt");
CREATE UNIQUE INDEX "DriverSession_tokenHash_key" ON "DriverSession"("tokenHash");
CREATE INDEX "DriverSession_driverId_revokedAt_idx" ON "DriverSession"("driverId", "revokedAt");
CREATE INDEX "DriverVehicle_driverId_createdAt_idx" ON "DriverVehicle"("driverId", "createdAt");
CREATE UNIQUE INDEX "SavedStation_driverId_stationId_key" ON "SavedStation"("driverId", "stationId");
CREATE INDEX "SavedStation_driverId_idx" ON "SavedStation"("driverId");
CREATE UNIQUE INDEX "NotificationPreference_driverId_key" ON "NotificationPreference"("driverId");
CREATE INDEX "DataExportRequest_driverId_createdAt_idx" ON "DataExportRequest"("driverId", "createdAt");
CREATE INDEX "AccountDeletionRequest_driverId_createdAt_idx" ON "AccountDeletionRequest"("driverId", "createdAt");
CREATE INDEX "DriverAuditEvent_driverId_createdAt_idx" ON "DriverAuditEvent"("driverId", "createdAt");
CREATE INDEX "DriverAuditEvent_action_createdAt_idx" ON "DriverAuditEvent"("action", "createdAt");

ALTER TABLE "DriverSession" ADD CONSTRAINT "DriverSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverVehicle" ADD CONSTRAINT "DriverVehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedStation" ADD CONSTRAINT "SavedStation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedStation" ADD CONSTRAINT "SavedStation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverAuditEvent" ADD CONSTRAINT "DriverAuditEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
