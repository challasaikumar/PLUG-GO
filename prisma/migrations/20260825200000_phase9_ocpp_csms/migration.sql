-- Phase 9 CSMS/OCPP foundation, sessions, remote commands

CREATE TYPE "OcppProtocolVersion" AS ENUM ('ocpp_1_6', 'ocpp_2_0_1', 'ocpp_2_1');
CREATE TYPE "ChargePointCommissioningState" AS ENUM ('draft', 'test', 'pilot', 'production', 'disabled');
CREATE TYPE "ChargePointConnectionState" AS ENUM ('disconnected', 'connecting', 'connected', 'rejected');
CREATE TYPE "OcppSecurityProfile" AS ENUM ('unconfigured', 'basic_auth', 'tls_server', 'tls_mutual');
CREATE TYPE "RemoteCommandType" AS ENUM ('remote_start', 'remote_stop');
CREATE TYPE "RemoteCommandStatus" AS ENUM ('queued', 'dispatching', 'accepted', 'rejected', 'timeout', 'failed', 'cancelled', 'reconciled_started', 'reconciled_stopped');
CREATE TYPE "ChargingSessionStatus" AS ENUM ('requested', 'authorizing', 'starting', 'charging', 'stopping', 'completed', 'failed', 'timed_out', 'interrupted', 'support_review');
CREATE TYPE "DeviceHealthSeverity" AS ENUM ('info', 'warning', 'critical');
CREATE TYPE "OcppParseResult" AS ENUM ('accepted', 'ignored', 'duplicate', 'malformed', 'unsupported_version', 'unauthorized');

ALTER TABLE "SupportIssue" ADD COLUMN "chargingSessionId" TEXT;

CREATE TABLE "ChargePoint" (
    "id" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "evseId" TEXT,
    "vendor" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "firmwareVersion" TEXT,
    "protocolVersion" "OcppProtocolVersion" NOT NULL,
    "securityProfile" "OcppSecurityProfile" NOT NULL DEFAULT 'unconfigured',
    "endpointPath" TEXT NOT NULL,
    "commissioningState" "ChargePointCommissioningState" NOT NULL DEFAULT 'draft',
    "connectionStatus" "ChargePointConnectionState" NOT NULL DEFAULT 'disconnected',
    "lastHeartbeatAt" TIMESTAMP(3),
    "lastBootAt" TIMESTAMP(3),
    "lastMeterAt" TIMESTAMP(3),
    "lastFaultAt" TIMESTAMP(3),
    "lastFaultCode" TEXT,
    "ownedByStaffId" TEXT,
    "inventoryComplete" BOOLEAN NOT NULL DEFAULT false,
    "ocppCertifiedClaim" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargePoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChargePoint_identity_key" ON "ChargePoint"("identity");
CREATE INDEX "ChargePoint_stationId_commissioningState_idx" ON "ChargePoint"("stationId", "commissioningState");
CREATE INDEX "ChargePoint_protocolVersion_connectionStatus_idx" ON "ChargePoint"("protocolVersion", "connectionStatus");

CREATE TABLE "ChargePointConnector" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "ocppConnectorId" INTEGER NOT NULL,

    CONSTRAINT "ChargePointConnector_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChargePointConnector_chargePointId_ocppConnectorId_key" ON "ChargePointConnector"("chargePointId", "ocppConnectorId");
CREATE UNIQUE INDEX "ChargePointConnector_connectorId_key" ON "ChargePointConnector"("connectorId");

CREATE TABLE "ChargePointCredential" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "secretKid" TEXT,
    "certificateRef" TEXT,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargePointCredential_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChargePointCredential_chargePointId_idx" ON "ChargePointCredential"("chargePointId");

CREATE TABLE "ChargerCapability" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ChargerCapability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChargerCapability_chargePointId_code_key" ON "ChargerCapability"("chargePointId", "code");

CREATE TABLE "ChargerConnection" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "state" "ChargePointConnectionState" NOT NULL,
    "reason" TEXT,
    "remoteAddressHash" TEXT,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargerConnection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChargerConnection_chargePointId_createdAt_idx" ON "ChargerConnection"("chargePointId", "createdAt");

CREATE TABLE "OcppProtocolEvent" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "protocolVersion" "OcppProtocolVersion" NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "parseResult" "OcppParseResult" NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "redactedPayload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "relatedSessionId" TEXT,

    CONSTRAINT "OcppProtocolEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OcppProtocolEvent_chargePointId_uniqueId_direction_key" ON "OcppProtocolEvent"("chargePointId", "uniqueId", "direction");
CREATE INDEX "OcppProtocolEvent_chargePointId_receivedAt_idx" ON "OcppProtocolEvent"("chargePointId", "receivedAt");
CREATE INDEX "OcppProtocolEvent_correlationId_idx" ON "OcppProtocolEvent"("correlationId");

CREATE TABLE "OcppMessageAudit" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "commandId" TEXT,
    "result" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcppMessageAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OcppMessageAudit_chargePointId_createdAt_idx" ON "OcppMessageAudit"("chargePointId", "createdAt");
CREATE INDEX "OcppMessageAudit_commandId_idx" ON "OcppMessageAudit"("commandId");

CREATE TABLE "ChargerFault" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "connectorId" TEXT,
    "code" TEXT NOT NULL,
    "vendorError" TEXT,
    "info" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargerFault_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChargerFault_chargePointId_occurredAt_idx" ON "ChargerFault"("chargePointId", "occurredAt");

CREATE TABLE "ChargingSession" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "status" "ChargingSessionStatus" NOT NULL DEFAULT 'requested',
    "driverId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "bookingId" TEXT,
    "ocppTransactionId" TEXT,
    "idTagHash" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "lastEvidenceAt" TIMESTAMP(3),
    "energyMilliWh" BIGINT,
    "meterUnit" TEXT,
    "failReason" TEXT,
    "supportReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargingSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChargingSession_publicRef_key" ON "ChargingSession"("publicRef");
CREATE INDEX "ChargingSession_driverId_createdAt_idx" ON "ChargingSession"("driverId", "createdAt");
CREATE INDEX "ChargingSession_connectorId_status_idx" ON "ChargingSession"("connectorId", "status");
CREATE INDEX "ChargingSession_chargePointId_ocppTransactionId_idx" ON "ChargingSession"("chargePointId", "ocppTransactionId");

CREATE TABLE "RemoteCommand" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "type" "RemoteCommandType" NOT NULL,
    "status" "RemoteCommandStatus" NOT NULL DEFAULT 'queued',
    "actorType" "BookingActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "driverId" TEXT,
    "chargePointId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "sessionId" TEXT,
    "reason" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "protocolResponse" TEXT,
    "timeoutAt" TIMESTAMP(3),
    "evidenceState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemoteCommand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RemoteCommand_publicRef_key" ON "RemoteCommand"("publicRef");
CREATE UNIQUE INDEX "RemoteCommand_idempotencyKey_key" ON "RemoteCommand"("idempotencyKey");
CREATE INDEX "RemoteCommand_chargePointId_createdAt_idx" ON "RemoteCommand"("chargePointId", "createdAt");
CREATE INDEX "RemoteCommand_driverId_createdAt_idx" ON "RemoteCommand"("driverId", "createdAt");
CREATE INDEX "RemoteCommand_sessionId_idx" ON "RemoteCommand"("sessionId");

CREATE TABLE "RemoteCommandAttempt" (
    "id" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "RemoteCommandAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RemoteCommandAttempt_commandId_attemptedAt_idx" ON "RemoteCommandAttempt"("commandId", "attemptedAt");

CREATE TABLE "ChargingSessionEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fromStatus" "ChargingSessionStatus",
    "toStatus" "ChargingSessionStatus" NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargingSessionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChargingSessionEvent_sessionId_createdAt_idx" ON "ChargingSessionEvent"("sessionId", "createdAt");

CREATE TABLE "MeterValue" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "chargePointId" TEXT NOT NULL,
    "connectorId" TEXT,
    "sampledAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawValue" TEXT NOT NULL,
    "rawUnit" TEXT NOT NULL,
    "measurand" TEXT NOT NULL,
    "context" TEXT,
    "source" TEXT NOT NULL,
    "energyMilliWh" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterValue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MeterValue_sessionId_sampledAt_idx" ON "MeterValue"("sessionId", "sampledAt");
CREATE INDEX "MeterValue_chargePointId_sampledAt_idx" ON "MeterValue"("chargePointId", "sampledAt");

CREATE TABLE "SessionAuthorization" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "driverId" TEXT,
    "idTagHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAuthorization_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessionAuthorization_idTagHash_idx" ON "SessionAuthorization"("idTagHash");
CREATE INDEX "SessionAuthorization_sessionId_idx" ON "SessionAuthorization"("sessionId");

CREATE TABLE "ConnectorStatusSnapshot" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "publicStatus" TEXT NOT NULL,
    "internalStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL,
    "heartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorStatusSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConnectorStatusSnapshot_connectorId_createdAt_idx" ON "ConnectorStatusSnapshot"("connectorId", "createdAt");

CREATE TABLE "DeviceHealthAlert" (
    "id" TEXT NOT NULL,
    "chargePointId" TEXT NOT NULL,
    "severity" "DeviceHealthSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceHealthAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeviceHealthAlert_chargePointId_createdAt_idx" ON "DeviceHealthAlert"("chargePointId", "createdAt");

ALTER TABLE "ChargePoint" ADD CONSTRAINT "ChargePoint_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChargePoint" ADD CONSTRAINT "ChargePoint_evseId_fkey" FOREIGN KEY ("evseId") REFERENCES "Evse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChargePointConnector" ADD CONSTRAINT "ChargePointConnector_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargePointConnector" ADD CONSTRAINT "ChargePointConnector_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChargePointCredential" ADD CONSTRAINT "ChargePointCredential_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargerCapability" ADD CONSTRAINT "ChargerCapability_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargerConnection" ADD CONSTRAINT "ChargerConnection_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OcppProtocolEvent" ADD CONSTRAINT "OcppProtocolEvent_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OcppMessageAudit" ADD CONSTRAINT "OcppMessageAudit_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargerFault" ADD CONSTRAINT "ChargerFault_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RemoteCommand" ADD CONSTRAINT "RemoteCommand_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RemoteCommand" ADD CONSTRAINT "RemoteCommand_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RemoteCommand" ADD CONSTRAINT "RemoteCommand_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChargingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RemoteCommandAttempt" ADD CONSTRAINT "RemoteCommandAttempt_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "RemoteCommand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChargingSessionEvent" ADD CONSTRAINT "ChargingSessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChargingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeterValue" ADD CONSTRAINT "MeterValue_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChargingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SessionAuthorization" ADD CONSTRAINT "SessionAuthorization_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChargingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SessionAuthorization" ADD CONSTRAINT "SessionAuthorization_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConnectorStatusSnapshot" ADD CONSTRAINT "ConnectorStatusSnapshot_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceHealthAlert" ADD CONSTRAINT "DeviceHealthAlert_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportIssue" ADD CONSTRAINT "SupportIssue_chargingSessionId_fkey" FOREIGN KEY ("chargingSessionId") REFERENCES "ChargingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "SupportIssue_chargingSessionId_idx" ON "SupportIssue"("chargingSessionId");
