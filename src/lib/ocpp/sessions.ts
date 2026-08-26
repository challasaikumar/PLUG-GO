import type { ChargingSession, ChargingSessionStatus, Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { formatKwhFromMilliWh } from "./energy";
import { realTimeEventPublisher } from "./publisher";
import { OcppError } from "./types";

const OPEN_STATUSES: ChargingSessionStatus[] = [
  "requested",
  "authorizing",
  "starting",
  "charging",
  "stopping",
];

export class ChargingSessionService {
  async transition(
    sessionId: string,
    toStatus: ChargingSessionStatus,
    source: string,
    note?: string,
    extra?: Prisma.ChargingSessionUpdateInput,
  ) {
    const prisma = getPrisma();
    const current = await prisma.chargingSession.findUnique({ where: { id: sessionId } });
    if (!current) throw new OcppError(404, "not_found", "Charging session not found.");
    if (current.status === toStatus && !extra) return current;

    const updated = await prisma.chargingSession.update({
      where: { id: sessionId },
      data: {
        status: toStatus,
        ...extra,
        events: {
          create: {
            fromStatus: current.status,
            toStatus,
            source,
            note,
          },
        },
      },
      include: {
        station: { select: { slug: true } },
        connector: { select: { publicRef: true } },
      },
    });
    await realTimeEventPublisher.publish({
      type: "session",
      eventId: crypto.randomUUID(),
      sessionPublicRef: updated.publicRef,
      status: updated.status,
      lastUpdatedAt: updated.updatedAt.toISOString(),
      energyMilliWh: updated.energyMilliWh?.toString() ?? null,
      startedAt: updated.startedAt?.toISOString() ?? null,
      endedAt: updated.endedAt?.toISOString() ?? null,
    });
    return updated;
  }

  async openForConnector(connectorId: string) {
    const prisma = getPrisma();
    return prisma.chargingSession.findFirst({
      where: { connectorId, status: { in: OPEN_STATUSES } },
      orderBy: { createdAt: "desc" },
    });
  }

  async byTransaction(chargePointId: string, transactionId: string) {
    const prisma = getPrisma();
    return prisma.chargingSession.findFirst({
      where: { chargePointId, ocppTransactionId: transactionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async byIdTag(idTagHash: string) {
    const prisma = getPrisma();
    return prisma.chargingSession.findFirst({
      where: { idTagHash, status: { in: OPEN_STATUSES } },
      orderBy: { createdAt: "desc" },
    });
  }

  driverView(
    session: ChargingSession & {
      station: { name: string; slug: string; city: string };
      connector: { publicRef: string; connectorType: string; maxPowerWatts: number };
    },
  ) {
    return toDriverSessionView(session);
  }
}

export const chargingSessionService = new ChargingSessionService();

export function toDriverSessionView(session: {
  publicRef: string;
  status: ChargingSessionStatus;
  failReason: string | null;
  supportReference: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  lastEvidenceAt: Date | null;
  energyMilliWh: bigint | null;
  meterUnit: string | null;
  updatedAt: Date;
  createdAt: Date;
  station: { name: string; slug: string; city: string };
  connector: { publicRef: string; connectorType: string; maxPowerWatts: number };
}) {
  const charging = session.status === "charging";
  return {
    publicRef: session.publicRef,
    status: session.status,
    stationName: session.station.name,
    stationSlug: session.station.slug,
    stationCity: session.station.city,
    connectorPublicRef: session.connector.publicRef,
    connectorType: session.connector.connectorType,
    maxKw: session.connector.maxPowerWatts / 1000,
    lastUpdatedAt: session.updatedAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    lastEvidenceAt: session.lastEvidenceAt?.toISOString() ?? null,
    energyKwh:
      charging || session.status === "completed" || session.status === "stopping"
        ? session.energyMilliWh != null
          ? formatKwhFromMilliWh(session.energyMilliWh)
          : null
        : null,
    meterUnit: session.energyMilliWh != null ? session.meterUnit : null,
    failReason: session.failReason,
    supportReference: session.supportReference,
    createdAt: session.createdAt.toISOString(),
  };
}

export function sessionStatusCopy(status: ChargingSessionStatus): { title: string; body: string } {
  switch (status) {
    case "requested":
      return { title: "Requested", body: "A start was requested. The charger has not confirmed a session yet." };
    case "authorizing":
      return { title: "Authorizing", body: "Waiting for the charger to accept this driver authorization." };
    case "starting":
      return {
        title: "Starting…",
        body: "The charger accepted the command. Charging is shown only after a transaction or meter event is received.",
      };
    case "charging":
      return { title: "Charging", body: "Verified session evidence is being received from the charger." };
    case "stopping":
      return { title: "Stopping…", body: "A stop was requested. This stays pending until the charger reports the session ended." };
    case "completed":
      return { title: "Completed", body: "The charger reported a stop. This is not a final energy invoice." };
    case "failed":
      return { title: "Failed", body: "The start did not become a verified charging session." };
    case "timed_out":
      return {
        title: "Timed out",
        body: "No session evidence arrived in time. This is not proof that energy was or was not delivered. Use the support reference.",
      };
    case "interrupted":
      return { title: "Interrupted", body: "The charger disconnected or faulted before a clean stop." };
    case "support_review":
      return { title: "Support review", body: "This session needs operator review. Keep the support reference." };
  }
}
