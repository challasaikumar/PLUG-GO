import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { StaffActor } from "@/lib/auth/staff";
import { overrideStatus } from "@/lib/catalogue/hardware-service";
import { requestCommandApproval } from "@/lib/ops/commands";
import { listFinanceExceptions, opsInitiateRefund } from "@/lib/ops/finance";
import { getFleetPortal } from "@/lib/ops/fleet";
import {
  assignTechnician,
  createIncident,
  getIncident,
  transitionIncident,
} from "@/lib/ops/incidents";
import { getHostPortal } from "@/lib/ops/partner";
import { OpsError } from "@/lib/ops/roles";
import { resolveOpsScope } from "@/lib/ops/scope";
import { suggestIncidents } from "@/lib/ops/suggest";
import { addMaintenanceEvidence, getIncidentForTechnician, setChecklistOutcome, transitionWorkOrder } from "@/lib/ops/technician";

const db = process.env.DATABASE_URL?.trim();

function actor(id: string, role: StaffActor["role"]): StaffActor {
  return { id, role, source: "dev_env" };
}

describe.skipIf(!db)("phase 10 operations portals", () => {
  const prisma = new PrismaClient();
  const suffix = `p10-${Date.now()}`;
  const ids = {
    org: `p10-org-${suffix}`,
    hostA: `p10-host-a-${suffix}`,
    hostB: `p10-host-b-${suffix}`,
    fleet: `p10-fleet-${suffix}`,
  };

  afterAll(async () => {
    await prisma.maintenanceEvidence.deleteMany({ where: { workOrder: { station: { slug: { startsWith: `p10-${suffix}` } } } } });
    await prisma.maintenanceChecklist.deleteMany({ where: { workOrder: { station: { slug: { startsWith: `p10-${suffix}` } } } } });
    await prisma.technicianWorkOrder.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.incidentEvent.deleteMany({ where: { incident: { station: { slug: { startsWith: `p10-${suffix}` } } } } });
    await prisma.incident.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.commandApproval.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.stationAssignment.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.staffMembership.deleteMany({ where: { organisationId: ids.org } });
    await prisma.hostMembership.deleteMany({ where: { hostId: { in: [ids.hostA, ids.hostB] } } });
    await prisma.fleetMembership.deleteMany({ where: { fleetOrganisationId: ids.fleet } });
    await prisma.costCentre.deleteMany({ where: { fleetOrganisationId: ids.fleet } });
    await prisma.fleetOrganisation.deleteMany({ where: { id: ids.fleet } });
    await prisma.staffAuditEvent.deleteMany({ where: { actorId: { startsWith: `p10-${suffix}` } } });
    await prisma.connectorAvailabilityEvent.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.currentConnectorStatus.deleteMany({ where: { connector: { station: { slug: { startsWith: `p10-${suffix}` } } } } });
    await prisma.connector.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.evse.deleteMany({ where: { station: { slug: { startsWith: `p10-${suffix}` } } } });
    await prisma.station.deleteMany({ where: { slug: { startsWith: `p10-${suffix}` } } });
    await prisma.host.deleteMany({ where: { id: { in: [ids.hostA, ids.hostB] } } });
    await prisma.organisation.deleteMany({ where: { id: ids.org } });
    await prisma.$disconnect();
  });

  it("isolates station/host/fleet access, incidents, technician completion, overrides, and finance", async () => {
    const organisation = await prisma.organisation.create({
      data: {
        id: ids.org,
        legalName: "Phase 10 org",
        brandName: "Phase 10",
        registeredAddress: "Test",
        isDemo: false,
        dataSource: "other",
      },
    });
    const hostA = await prisma.host.create({
      data: {
        id: ids.hostA,
        organisationId: organisation.id,
        hostLegalName: "Host A",
        hostDisplayName: "Host A",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    const hostB = await prisma.host.create({
      data: {
        id: ids.hostB,
        organisationId: organisation.id,
        hostLegalName: "Host B",
        hostDisplayName: "Host B",
        hostType: "other",
        isDemo: false,
        dataSource: "other",
      },
    });
    async function station(hostId: string, name: string, slug: string) {
      const created = await prisma.station.create({
        data: {
          organisationId: organisation.id,
          hostId,
          name,
          slug,
          city: "Hyderabad",
          state: "Telangana",
          latitude: "17.385000",
          longitude: "78.486700",
          addressLine1: "Test road",
          pincode: "500001",
          accessHoursSummary: "24/7",
          accessType: "public",
          publicationStatus: "published",
          operationalLifecycle: "open",
          isDemo: false,
          dataSource: "other",
        },
      });
      const evse = await prisma.evse.create({
        data: {
          stationId: created.id,
          evseLabel: "Bay 1",
          maxPowerWatts: 7000,
          powerType: "ac",
          installationStatus: "installed",
          dataSource: "other",
        },
      });
      const connector = await prisma.connector.create({
        data: {
          evseId: evse.id,
          stationId: created.id,
          connectorIndex: 1,
          connectorType: "type2_ac",
          maxPowerWatts: 7000,
          installationStatus: "installed",
          dataSource: "other",
        },
      });
      await prisma.currentConnectorStatus.create({
        data: {
          connectorId: connector.id,
          recordedStatus: "faulted",
          source: "csms_ocpp",
          statusUpdatedAt: new Date(),
        },
      });
      return { station: created, connector };
    }
    const a = await station(hostA.id, "Station A", `p10-${suffix}-a`);
    const b = await station(hostB.id, "Station B", `p10-${suffix}-b`);

    const tech = actor(`p10-${suffix}-tech`, "technician");
    await prisma.stationAssignment.create({
      data: { actorId: tech.id, stationId: a.station.id, role: "technician", active: true },
    });
    const techScope = await resolveOpsScope(tech);
    expect(techScope.stationIds).toEqual([a.station.id]);

    const operator = actor(`p10-${suffix}-ops`, "station_operator");
    await prisma.staffMembership.create({
      data: { actorId: operator.id, role: "station_operator", organisationId: organisation.id, active: true },
    });
    await expect(getIncident(tech, "missing")).rejects.toBeInstanceOf(OpsError);

    const incidentA = await createIncident(operator, {
      stationId: a.station.id,
      title: "Bay fault A",
      summary: "Connector faulted",
      severity: "high",
    });
    await createIncident(operator, {
      stationId: b.station.id,
      title: "Bay fault B",
      summary: "Other station",
      severity: "low",
    });
    await expect(getIncident(tech, (await prisma.incident.findFirstOrThrow({ where: { stationId: b.station.id } })).id)).rejects.toMatchObject({
      status: 403,
    });

    await transitionIncident(operator, incidentA.id, "acknowledged");
    await transitionIncident(operator, incidentA.id, "diagnosing");
    await assignTechnician(operator, incidentA.id, tech.id);
    const assigned = await getIncidentForTechnician(tech, incidentA.id);
    expect(assigned.assignedTechnicianId).toBe(tech.id);
    const work = assigned.workOrders[0];
    expect(work).toBeTruthy();
    await transitionWorkOrder(tech, work.id, "in_progress");
    for (const item of work.checklist) {
      await setChecklistOutcome(tech, work.id, item.code, "pass");
    }
    await addMaintenanceEvidence(tech, work.id, "https://evidence.example/p10.jpg", "Bay after repair");
    await transitionWorkOrder(tech, work.id, "completed");
    const resolved = await getIncident(operator, incidentA.id);
    expect(resolved.status).toBe("resolved");

    const events = await prisma.incidentEvent.findMany({ where: { incidentId: incidentA.id } });
    expect(events.some((row) => row.kind === "assignment")).toBe(true);

    const suggested = await suggestIncidents(operator);
    expect(suggested.note).toMatch(/Reconnect does not close/i);
    const stillOpen = await prisma.incident.findUniqueOrThrow({ where: { id: incidentA.id } });
    expect(stillOpen.status).not.toBe("closed");

    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const override = await overrideStatus(
      operator,
      {
        connectorId: a.connector.id,
        recordedStatus: "offline",
        reason: "Site isolation for repair",
        expiresAt: expires,
        source: "operator_override",
      },
      "p10-override",
    );
    expect(override.ok).toBe(true);

    await expect(
      requestCommandApproval(tech, {
        action: "reset",
        stationId: a.station.id,
        reason: "Need a hardware reset now",
        mfaAssertion: true,
      }),
    ).rejects.toMatchObject({ status: 501 });
    const denied = await prisma.commandApproval.findFirst({ where: { stationId: a.station.id, action: "reset" } });
    expect(denied?.status).toBe("denied");

    const finance = actor(`p10-${suffix}-fin`, "finance");
    await expect(listFinanceExceptions(tech)).rejects.toMatchObject({ status: 403 });
    const exceptions = await listFinanceExceptions(finance);
    expect(exceptions.refunds).toEqual([]);

    await prisma.hostMembership.create({
      data: { actorId: `p10-${suffix}-host`, hostId: hostA.id, role: "host_admin", active: true },
    });
    const hostActor = actor(`p10-${suffix}-host`, "host_admin");
    const partner = await getHostPortal(hostActor);
    expect(partner.hosts).toHaveLength(1);
    expect(partner.hosts[0]?.stations.some((row) => row.id === b.station.id)).toBe(false);

    await prisma.fleetOrganisation.create({
      data: { id: ids.fleet, name: "Fleet A", costCentres: { create: { code: "CC1", name: "North" } } },
    });
    await prisma.fleetMembership.create({
      data: { actorId: `p10-${suffix}-fleet`, fleetOrganisationId: ids.fleet, role: "fleet_admin", active: true },
    });
    const fleet = await getFleetPortal(actor(`p10-${suffix}-fleet`, "fleet_admin"));
    expect(fleet.fleets).toHaveLength(1);
    const otherFleet = await getFleetPortal(actor("p10-unrelated-fleet", "fleet_admin"));
    expect(otherFleet.fleets).toHaveLength(0);

    await expect(
      opsInitiateRefund(tech, { bookingPublicRef: "nope", amountPaise: 100, reason: "should fail role" }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
