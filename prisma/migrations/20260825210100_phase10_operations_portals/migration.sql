-- Phase 10 operations portals: memberships, incidents, technician work, command approval, exports

CREATE TYPE "IncidentSeverity" AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE "IncidentStatus" AS ENUM ('new', 'acknowledged', 'diagnosing', 'technician_assigned', 'waiting_on_vendor', 'resolved', 'verification_required', 'closed');
CREATE TYPE "IncidentTrigger" AS ENUM ('manual', 'heartbeat_stale', 'heartbeat_offline', 'command_failure', 'connector_faulted', 'meter_anomaly', 'support_repeat');
CREATE TYPE "IncidentEventKind" AS ENUM ('status', 'assignment', 'note_internal', 'note_customer', 'evidence', 'escalation', 'verification');
CREATE TYPE "WorkOrderStatus" AS ENUM ('queued', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE "ChecklistOutcome" AS ENUM ('pass', 'fail', 'not_applicable');
CREATE TYPE "CommandApprovalAction" AS ENUM ('remote_start', 'remote_stop', 'reset', 'change_configuration');
CREATE TYPE "CommandApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'break_glass', 'dispatched', 'denied');
CREATE TYPE "ExportJobKind" AS ENUM ('finance_refunds', 'ops_incidents', 'compliance_station', 'host_summary', 'fleet_activity');
CREATE TYPE "ExportJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'expired');

CREATE TABLE "StaffMembership" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "organisationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMembership_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffMembership_actorId_active_idx" ON "StaffMembership"("actorId", "active");
CREATE INDEX "StaffMembership_organisationId_idx" ON "StaffMembership"("organisationId");
CREATE UNIQUE INDEX "StaffMembership_actorId_role_organisationId_key" ON "StaffMembership"("actorId", "role", "organisationId");

CREATE TABLE "HostMembership" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HostMembership_actorId_hostId_key" ON "HostMembership"("actorId", "hostId");
CREATE INDEX "HostMembership_hostId_active_idx" ON "HostMembership"("hostId", "active");
CREATE INDEX "HostMembership_actorId_active_idx" ON "HostMembership"("actorId", "active");

CREATE TABLE "FleetOrganisation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetOrganisation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FleetOrganisation_organisationId_idx" ON "FleetOrganisation"("organisationId");

CREATE TABLE "FleetMembership" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "fleetOrganisationId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FleetMembership_actorId_fleetOrganisationId_key" ON "FleetMembership"("actorId", "fleetOrganisationId");
CREATE INDEX "FleetMembership_fleetOrganisationId_active_idx" ON "FleetMembership"("fleetOrganisationId", "active");
CREATE INDEX "FleetMembership_actorId_active_idx" ON "FleetMembership"("actorId", "active");

CREATE TABLE "CostCentre" (
    "id" TEXT NOT NULL,
    "fleetOrganisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostCentre_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CostCentre_fleetOrganisationId_code_key" ON "CostCentre"("fleetOrganisationId", "code");

CREATE TABLE "FleetDriverRef" (
    "id" TEXT NOT NULL,
    "fleetOrganisationId" TEXT NOT NULL,
    "driverId" TEXT,
    "label" TEXT NOT NULL,
    "costCentreId" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetDriverRef_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FleetDriverRef_fleetOrganisationId_idx" ON "FleetDriverRef"("fleetOrganisationId");
CREATE INDEX "FleetDriverRef_driverId_idx" ON "FleetDriverRef"("driverId");

CREATE TABLE "FleetVehicleRef" (
    "id" TEXT NOT NULL,
    "fleetOrganisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "connectorType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetVehicleRef_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FleetVehicleRef_fleetOrganisationId_idx" ON "FleetVehicleRef"("fleetOrganisationId");

CREATE TABLE "StationAssignment" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StationAssignment_actorId_stationId_role_key" ON "StationAssignment"("actorId", "stationId", "role");
CREATE INDEX "StationAssignment_stationId_active_idx" ON "StationAssignment"("stationId", "active");
CREATE INDEX "StationAssignment_actorId_active_idx" ON "StationAssignment"("actorId", "active");

CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "connectorId" TEXT,
    "chargePointId" TEXT,
    "chargingSessionId" TEXT,
    "supportIssueId" TEXT,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'new',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "customerVisibleStatus" TEXT,
    "assignedActorId" TEXT,
    "assignedTechnicianId" TEXT,
    "suggestedFrom" "IncidentTrigger" NOT NULL DEFAULT 'manual',
    "vendorEscalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Incident_publicRef_key" ON "Incident"("publicRef");
CREATE INDEX "Incident_stationId_status_idx" ON "Incident"("stationId", "status");
CREATE INDEX "Incident_status_severity_idx" ON "Incident"("status", "severity");
CREATE INDEX "Incident_assignedTechnicianId_status_idx" ON "Incident"("assignedTechnicianId", "status");
CREATE INDEX "Incident_chargePointId_status_idx" ON "Incident"("chargePointId", "status");

CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "fromStatus" "IncidentStatus",
    "toStatus" "IncidentStatus",
    "actorId" TEXT NOT NULL,
    "actorRole" "StaffRole" NOT NULL,
    "kind" "IncidentEventKind" NOT NULL,
    "body" TEXT,
    "customerVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IncidentEvent_incidentId_createdAt_idx" ON "IncidentEvent"("incidentId", "createdAt");

CREATE TABLE "TechnicianWorkOrder" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "assignedActorId" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianWorkOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TechnicianWorkOrder_assignedActorId_status_idx" ON "TechnicianWorkOrder"("assignedActorId", "status");
CREATE INDEX "TechnicianWorkOrder_stationId_status_idx" ON "TechnicianWorkOrder"("stationId", "status");
CREATE INDEX "TechnicianWorkOrder_incidentId_idx" ON "TechnicianWorkOrder"("incidentId");

CREATE TABLE "MaintenanceChecklist" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "outcome" "ChecklistOutcome",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceChecklist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintenanceChecklist_workOrderId_code_key" ON "MaintenanceChecklist"("workOrderId", "code");

CREATE TABLE "MaintenanceEvidence" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'photo',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaintenanceEvidence_workOrderId_idx" ON "MaintenanceEvidence"("workOrderId");

CREATE TABLE "CommandApproval" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "action" "CommandApprovalAction" NOT NULL,
    "status" "CommandApprovalStatus" NOT NULL DEFAULT 'pending',
    "actorId" TEXT NOT NULL,
    "actorRole" "StaffRole" NOT NULL,
    "approverId" TEXT,
    "stationId" TEXT NOT NULL,
    "connectorId" TEXT,
    "sessionPublicRef" TEXT,
    "chargePointId" TEXT,
    "commandId" TEXT,
    "reason" TEXT NOT NULL,
    "riskNote" TEXT NOT NULL,
    "mfaAssertion" BOOLEAN NOT NULL DEFAULT false,
    "breakGlass" BOOLEAN NOT NULL DEFAULT false,
    "breakGlassExpiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommandApproval_publicRef_key" ON "CommandApproval"("publicRef");
CREATE INDEX "CommandApproval_stationId_status_idx" ON "CommandApproval"("stationId", "status");
CREATE INDEX "CommandApproval_status_createdAt_idx" ON "CommandApproval"("status", "createdAt");
CREATE INDEX "CommandApproval_commandId_idx" ON "CommandApproval"("commandId");

CREATE TABLE "SupportTicketAssignment" (
    "id" TEXT NOT NULL,
    "supportIssueId" TEXT NOT NULL,
    "assigneeActorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicketAssignment_supportIssueId_createdAt_idx" ON "SupportTicketAssignment"("supportIssueId", "createdAt");
CREATE INDEX "SupportTicketAssignment_assigneeActorId_idx" ON "SupportTicketAssignment"("assigneeActorId");

CREATE TABLE "SupportIssueNote" (
    "id" TEXT NOT NULL,
    "supportIssueId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "customerVisible" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportIssueNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportIssueNote_supportIssueId_createdAt_idx" ON "SupportIssueNote"("supportIssueId", "createdAt");

CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "kind" "ExportJobKind" NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'queued',
    "actorId" TEXT NOT NULL,
    "actorRole" "StaffRole" NOT NULL,
    "filters" JSONB NOT NULL,
    "csvContent" TEXT,
    "fileRef" TEXT,
    "rowCount" INTEGER,
    "error" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExportJob_publicRef_key" ON "ExportJob"("publicRef");
CREATE INDEX "ExportJob_actorId_createdAt_idx" ON "ExportJob"("actorId", "createdAt");
CREATE INDEX "ExportJob_status_expiresAt_idx" ON "ExportJob"("status", "expiresAt");

ALTER TABLE "StaffMembership" ADD CONSTRAINT "StaffMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HostMembership" ADD CONSTRAINT "HostMembership_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FleetOrganisation" ADD CONSTRAINT "FleetOrganisation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FleetMembership" ADD CONSTRAINT "FleetMembership_fleetOrganisationId_fkey" FOREIGN KEY ("fleetOrganisationId") REFERENCES "FleetOrganisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostCentre" ADD CONSTRAINT "CostCentre_fleetOrganisationId_fkey" FOREIGN KEY ("fleetOrganisationId") REFERENCES "FleetOrganisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FleetDriverRef" ADD CONSTRAINT "FleetDriverRef_fleetOrganisationId_fkey" FOREIGN KEY ("fleetOrganisationId") REFERENCES "FleetOrganisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FleetDriverRef" ADD CONSTRAINT "FleetDriverRef_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FleetVehicleRef" ADD CONSTRAINT "FleetVehicleRef_fleetOrganisationId_fkey" FOREIGN KEY ("fleetOrganisationId") REFERENCES "FleetOrganisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StationAssignment" ADD CONSTRAINT "StationAssignment_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_chargingSessionId_fkey" FOREIGN KEY ("chargingSessionId") REFERENCES "ChargingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_supportIssueId_fkey" FOREIGN KEY ("supportIssueId") REFERENCES "SupportIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicianWorkOrder" ADD CONSTRAINT "TechnicianWorkOrder_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicianWorkOrder" ADD CONSTRAINT "TechnicianWorkOrder_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceChecklist" ADD CONSTRAINT "MaintenanceChecklist_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "TechnicianWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceEvidence" ADD CONSTRAINT "MaintenanceEvidence_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "TechnicianWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandApproval" ADD CONSTRAINT "CommandApproval_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommandApproval" ADD CONSTRAINT "CommandApproval_chargePointId_fkey" FOREIGN KEY ("chargePointId") REFERENCES "ChargePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommandApproval" ADD CONSTRAINT "CommandApproval_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "RemoteCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicketAssignment" ADD CONSTRAINT "SupportTicketAssignment_supportIssueId_fkey" FOREIGN KEY ("supportIssueId") REFERENCES "SupportIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportIssueNote" ADD CONSTRAINT "SupportIssueNote_supportIssueId_fkey" FOREIGN KEY ("supportIssueId") REFERENCES "SupportIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
