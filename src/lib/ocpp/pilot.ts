import type { ChargePointCommissioningState } from "@prisma/client";
import {
  getCsmsMode,
  ocppRemoteCommandsEnabled,
  pilotConnectorIds,
  pilotDriverIds,
  pilotStationIds,
  productionControlApproved,
} from "./config";
import { featureEnabledSync } from "@/lib/release/flags";

export type PilotGate =
  | { ok: true }
  | { ok: false; reason: string };

function remoteChargingFlagGate(commissioningState: ChargePointCommissioningState): PilotGate {
  if (commissioningState === "production") {
    if (!featureEnabledSync("productionRemoteCharging")) {
      return {
        ok: false,
        reason:
          "Production remote charging is disabled. FLAG_PRODUCTION_REMOTE_CHARGING must be true after isolated OCPP acceptance.",
      };
    }
    return { ok: true };
  }
  if (!featureEnabledSync("pilotRemoteCharging")) {
    return {
      ok: false,
      reason: "Pilot remote charging is disabled. FLAG_PILOT_REMOTE_CHARGING must be true for test and pilot chargers.",
    };
  }
  return { ok: true };
}

export function remoteChargingPolicyGate(input: {
  commissioningState: ChargePointCommissioningState;
  stationId: string;
  connectorId: string;
  driverId: string;
  capabilityEnabled: boolean;
}): PilotGate {
  if (!ocppRemoteCommandsEnabled()) {
    return {
      ok: false,
      reason: "Remote charging is disabled. OCPP_ENABLED and OCPP_REMOTE_COMMANDS_ENABLED must both be true.",
    };
  }
  const flagGate = remoteChargingFlagGate(input.commissioningState);
  if (!flagGate.ok) return flagGate;
  if (!input.capabilityEnabled) {
    return { ok: false, reason: "This charge point is not recorded as supporting remote start/stop." };
  }
  if (input.commissioningState === "disabled" || input.commissioningState === "draft") {
    return { ok: false, reason: "This charge point is not in Test or Pilot commissioning." };
  }

  const mode = getCsmsMode();
  if (input.commissioningState === "test" && mode !== "simulator" && mode !== "test") {
    return { ok: false, reason: "Test chargers can only be commanded when CSMS_MODE is simulator or test." };
  }
  if (input.commissioningState === "pilot" && (mode === "production" && !productionControlApproved())) {
    return { ok: false, reason: "Pilot chargers cannot use production control until inventory and approval flags are set." };
  }
  if (input.commissioningState === "production") {
    if (mode !== "production" || !productionControlApproved()) {
      return {
        ok: false,
        reason:
          "Production remote charging stays blocked until CSMS_MODE=production, OCPP_PRODUCTION_CONTROL_APPROVED=true, and OCPP_HARDWARE_INVENTORY_COMPLETE=true.",
      };
    }
  }

  const stations = pilotStationIds();
  const connectors = pilotConnectorIds();
  const drivers = pilotDriverIds();
  if (stations.length === 0 || connectors.length === 0 || drivers.length === 0) {
    return {
      ok: false,
      reason: "Pilot allow-lists are empty. Remote start stays denied until station, connector, and driver IDs are listed.",
    };
  }
  if (!stations.includes(input.stationId)) {
    return { ok: false, reason: "This station is not on the remote-charging allow-list." };
  }
  if (!connectors.includes(input.connectorId)) {
    return { ok: false, reason: "This connector is not on the remote-charging allow-list." };
  }
  if (!drivers.includes(input.driverId)) {
    return { ok: false, reason: "This driver is not authorised for the remote-charging pilot." };
  }
  return { ok: true };
}

export function staffRemoteStopPolicyGate(input: {
  commissioningState: ChargePointCommissioningState;
  stationId: string;
  connectorId: string;
  capabilityEnabled: boolean;
}): PilotGate {
  if (!ocppRemoteCommandsEnabled()) {
    return {
      ok: false,
      reason: "Remote charging is disabled. OCPP_ENABLED and OCPP_REMOTE_COMMANDS_ENABLED must both be true.",
    };
  }
  const flagGate = remoteChargingFlagGate(input.commissioningState);
  if (!flagGate.ok) return flagGate;
  if (process.env.OPS_STAFF_REMOTE_COMMANDS_ENABLED?.trim().toLowerCase() !== "true") {
    return {
      ok: false,
      reason: "Staff remote commands are disabled. OPS_STAFF_REMOTE_COMMANDS_ENABLED must be true, and there is no generic charger-control action.",
    };
  }
  if (!input.capabilityEnabled) {
    return { ok: false, reason: "This charge point is not recorded as supporting remote stop." };
  }
  if (input.commissioningState === "disabled" || input.commissioningState === "draft") {
    return { ok: false, reason: "This charge point is not in Test or Pilot commissioning." };
  }

  const mode = getCsmsMode();
  if (input.commissioningState === "test" && mode !== "simulator" && mode !== "test") {
    return { ok: false, reason: "Test chargers can only be commanded when CSMS_MODE is simulator or test." };
  }
  if (input.commissioningState === "pilot" && mode === "production" && !productionControlApproved()) {
    return { ok: false, reason: "Pilot chargers cannot use production control until inventory and approval flags are set." };
  }
  if (input.commissioningState === "production") {
    if (mode !== "production" || !productionControlApproved()) {
      return {
        ok: false,
        reason:
          "Production remote charging stays blocked until CSMS_MODE=production, OCPP_PRODUCTION_CONTROL_APPROVED=true, and OCPP_HARDWARE_INVENTORY_COMPLETE=true.",
      };
    }
  }

  const stations = pilotStationIds();
  const connectors = pilotConnectorIds();
  if (stations.length === 0 || connectors.length === 0) {
    return {
      ok: false,
      reason: "Pilot station/connector allow-lists are empty. Staff remote stop stays denied.",
    };
  }
  if (!stations.includes(input.stationId)) {
    return { ok: false, reason: "This station is not on the remote-charging allow-list." };
  }
  if (!connectors.includes(input.connectorId)) {
    return { ok: false, reason: "This connector is not on the remote-charging allow-list." };
  }
  return { ok: true };
}

export function staffMfaRequiredForChargerControl(): boolean {
  return process.env.NODE_ENV === "production";
}
