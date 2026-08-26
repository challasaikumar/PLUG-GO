-- Phase 11: auditable staff feature-flag kill-switches (cannot enable env-off or env-only flags)

CREATE TABLE "FeatureFlagOverride" (
    "id" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedByRole" "StaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlagOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeatureFlagOverride_flagKey_key" ON "FeatureFlagOverride"("flagKey");
CREATE INDEX "FeatureFlagOverride_updatedById_updatedAt_idx" ON "FeatureFlagOverride"("updatedById", "updatedAt");
