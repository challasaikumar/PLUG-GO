-- Phase 8 booking, payments, receipts, refunds, support recovery

ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'booking_unavailable';
ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'cancellation';
ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'refund_status';
ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'billing_receipt';
ALTER TYPE "SupportIssueCategory" ADD VALUE IF NOT EXISTS 'general_issue';

CREATE TYPE "BookingPolicyApprovalStatus" AS ENUM ('draft', 'approved', 'archived');
CREATE TYPE "BookingStatus" AS ENUM ('draft', 'pending_payment', 'payment_processing', 'confirmed', 'cancelled', 'expired', 'no_show', 'payment_failed', 'refund_pending', 'refunded', 'support_review');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('created', 'processing', 'succeeded', 'failed', 'cancelled', 'expired');
CREATE TYPE "RefundStatus" AS ENUM ('requested', 'pending_review', 'pending_provider', 'processing', 'completed', 'failed', 'rejected');
CREATE TYPE "FinancialDocumentKind" AS ENUM ('booking_receipt', 'charging_invoice_placeholder');
CREATE TYPE "FinancialDocumentStatus" AS ENUM ('issued', 'void', 'not_issuable_until_session');
CREATE TYPE "BookingActorType" AS ENUM ('driver', 'staff', 'system', 'webhook');

ALTER TABLE "SupportIssue" ADD COLUMN "driverId" TEXT;
ALTER TABLE "SupportIssue" ADD COLUMN "bookingId" TEXT;
ALTER TABLE "SupportIssue" ADD COLUMN "paymentState" TEXT;

CREATE TABLE "BookingPolicy" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" "BookingPolicyApprovalStatus" NOT NULL DEFAULT 'draft',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "eligibleConnectorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "arrivalWindowMinutes" INTEGER NOT NULL,
    "reservationDurationMinutes" INTEGER NOT NULL,
    "capacityLimit" INTEGER NOT NULL,
    "bookingFeePaise" INTEGER NOT NULL DEFAULT 0,
    "gstRateBps" INTEGER NOT NULL,
    "cancellationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "cancellationCutoffMinutes" INTEGER,
    "refundOnCancel" BOOLEAN NOT NULL DEFAULT false,
    "refundPercentBps" INTEGER NOT NULL DEFAULT 0,
    "cancellationPolicyText" TEXT NOT NULL,
    "noShowPolicyText" TEXT NOT NULL,
    "refundPolicyText" TEXT NOT NULL,
    "supportContactText" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending_payment',
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "holdExpiresAt" TIMESTAMP(3),
    "feePaise" INTEGER NOT NULL,
    "gstPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "policySnapshot" JSONB NOT NULL,
    "tariffSnapshot" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservationHold" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationHold_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "actorType" "BookingActorType" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'created',
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "checkoutMode" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "processingResult" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinancialDocument" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "kind" "FinancialDocumentKind" NOT NULL,
    "status" "FinancialDocumentStatus" NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "subtotalPaise" INTEGER NOT NULL,
    "gstPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "breakdown" JSONB NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentAttemptId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT NOT NULL,
    "requestedByType" "BookingActorType" NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "providerRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefundStatusHistory" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "fromStatus" "RefundStatus",
    "toStatus" "RefundStatus" NOT NULL,
    "actorType" "BookingActorType" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Booking_publicRef_key" ON "Booking"("publicRef");
CREATE UNIQUE INDEX "Booking_referenceCode_key" ON "Booking"("referenceCode");
CREATE INDEX "Booking_driverId_createdAt_idx" ON "Booking"("driverId", "createdAt");
CREATE INDEX "Booking_connectorId_windowStart_windowEnd_idx" ON "Booking"("connectorId", "windowStart", "windowEnd");
CREATE INDEX "Booking_status_holdExpiresAt_idx" ON "Booking"("status", "holdExpiresAt");
CREATE INDEX "BookingPolicy_stationId_approvalStatus_effectiveFrom_idx" ON "BookingPolicy"("stationId", "approvalStatus", "effectiveFrom");
CREATE UNIQUE INDEX "ReservationHold_bookingId_key" ON "ReservationHold"("bookingId");
CREATE INDEX "ReservationHold_connectorId_windowStart_windowEnd_idx" ON "ReservationHold"("connectorId", "windowStart", "windowEnd");
CREATE INDEX "ReservationHold_expiresAt_releasedAt_idx" ON "ReservationHold"("expiresAt", "releasedAt");
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");
CREATE INDEX "PaymentAttempt_bookingId_createdAt_idx" ON "PaymentAttempt"("bookingId", "createdAt");
CREATE INDEX "PaymentAttempt_providerOrderId_idx" ON "PaymentAttempt"("providerOrderId");
CREATE UNIQUE INDEX "PaymentWebhookEvent_providerEventId_key" ON "PaymentWebhookEvent"("providerEventId");
CREATE INDEX "PaymentWebhookEvent_createdAt_idx" ON "PaymentWebhookEvent"("createdAt");
CREATE UNIQUE INDEX "FinancialDocument_number_key" ON "FinancialDocument"("number");
CREATE INDEX "FinancialDocument_driverId_createdAt_idx" ON "FinancialDocument"("driverId", "createdAt");
CREATE INDEX "FinancialDocument_bookingId_kind_idx" ON "FinancialDocument"("bookingId", "kind");
CREATE INDEX "Refund_bookingId_createdAt_idx" ON "Refund"("bookingId", "createdAt");
CREATE INDEX "Refund_driverId_createdAt_idx" ON "Refund"("driverId", "createdAt");
CREATE INDEX "RefundStatusHistory_refundId_createdAt_idx" ON "RefundStatusHistory"("refundId", "createdAt");
CREATE INDEX "SupportIssue_driverId_createdAt_idx" ON "SupportIssue"("driverId", "createdAt");
CREATE INDEX "SupportIssue_bookingId_idx" ON "SupportIssue"("bookingId");

ALTER TABLE "BookingPolicy" ADD CONSTRAINT "BookingPolicy_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BookingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReservationHold" ADD CONSTRAINT "ReservationHold_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationHold" ADD CONSTRAINT "ReservationHold_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefundStatusHistory" ADD CONSTRAINT "RefundStatusHistory_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
