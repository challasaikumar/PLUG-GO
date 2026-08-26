import { CONNECTOR_TYPES } from "@/lib/catalogue/validation";

export const VEHICLE_MAKE_MAX = 40;
export const VEHICLE_MODEL_MAX = 40;
export const VEHICLE_NICKNAME_MAX = 40;

const VEHICLE_TOKEN = /^[\p{L}0-9][\p{L}0-9\s.'’+-]*$/u;

export type VehicleInput = {
  make: string;
  model: string;
  connectorType: (typeof CONNECTOR_TYPES)[number];
  batteryKwh?: number | null;
  nickname?: string | null;
};

export type VehicleParseResult =
  | { ok: true; value: VehicleInput }
  | { ok: false; errors: Record<string, string> };

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseVehicleInput(raw: unknown): VehicleParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: { form: "The vehicle details could not be read." } };
  }
  const body = raw as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const make = clip(body.make, VEHICLE_MAKE_MAX);
  const model = clip(body.model, VEHICLE_MODEL_MAX);
  const nicknameRaw = clip(body.nickname, VEHICLE_NICKNAME_MAX);
  const connectorType = typeof body.connectorType === "string" ? body.connectorType : "";
  const batteryRaw = body.batteryKwh;

  if (make.length < 2) errors.make = "Enter the vehicle make.";
  else if (!VEHICLE_TOKEN.test(make)) errors.make = "Use letters or numbers in the make.";
  if (model.length < 1) errors.model = "Enter the vehicle model.";
  else if (!VEHICLE_TOKEN.test(model)) errors.model = "Use letters or numbers in the model.";
  if (nicknameRaw && !VEHICLE_TOKEN.test(nicknameRaw)) {
    errors.nickname = "Use letters or numbers in the nickname, or leave it blank.";
  }
  if (!(CONNECTOR_TYPES as readonly string[]).includes(connectorType)) {
    errors.connectorType = "Choose a connector type.";
  }

  let batteryKwh: number | null = null;
  if (batteryRaw !== undefined && batteryRaw !== null && batteryRaw !== "") {
    const parsed = typeof batteryRaw === "number" ? batteryRaw : Number.parseInt(String(batteryRaw), 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 300) {
      errors.batteryKwh = "Battery capacity must be a whole number between 1 and 300 kWh, or left blank.";
    } else {
      batteryKwh = parsed;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      make,
      model,
      connectorType: connectorType as VehicleInput["connectorType"],
      batteryKwh,
      nickname: nicknameRaw || null,
    },
  };
}
