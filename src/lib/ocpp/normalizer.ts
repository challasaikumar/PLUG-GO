import type { AvailabilitySource, RecordedStatus } from "@prisma/client";
import { computePublicStatus, type PublicStatus } from "@/lib/status";
import type { NormalizedStatus } from "./types";

export type NormalizedPublicStatus = {
  recordedStatus: RecordedStatus;
  publicStatus: PublicStatus;
  internalStatus: string;
  source: AvailabilitySource;
};

export class CsmsEventNormalizer {
  fromOcpp16Status(status: NormalizedStatus, source: AvailabilitySource = "csms_ocpp"): NormalizedPublicStatus {
    return {
      recordedStatus: status.recordedStatus,
      publicStatus: computePublicStatus({
        recordedStatus: status.recordedStatus,
        statusUpdatedAt: status.timestamp ?? new Date(),
      }).publicStatus,
      internalStatus: status.internalStatus,
      source,
    };
  }

  fromHeartbeatTimeout(previous: RecordedStatus | null): NormalizedPublicStatus {
    const recorded: RecordedStatus = previous === "faulted" ? "faulted" : "offline";
    return {
      recordedStatus: recorded,
      publicStatus: recorded === "faulted" ? "faulted" : "offline",
      internalStatus: "heartbeat_timeout",
      source: "heartbeat_timeout",
    };
  }
}

export const csmsEventNormalizer = new CsmsEventNormalizer();
