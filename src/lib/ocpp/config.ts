/**
 * CSMS / OCPP environment. Secrets stay server-side. Fail closed for remote control.
 */

export const CSMS_MODES = ["simulator", "test", "pilot", "production"] as const;
export type CsmsMode = (typeof CSMS_MODES)[number];

function flag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function csv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getCsmsMode(): CsmsMode {
  const raw = process.env.CSMS_MODE?.trim().toLowerCase();
  if (raw && (CSMS_MODES as readonly string[]).includes(raw)) {
    return raw as CsmsMode;
  }
  return "simulator";
}

export function ocppEnabled(): boolean {
  return flag("OCPP_ENABLED");
}

export function ocppRemoteCommandsEnabled(): boolean {
  return ocppEnabled() && flag("OCPP_REMOTE_COMMANDS_ENABLED");
}

export function hardwareInventoryComplete(): boolean {
  return flag("OCPP_HARDWARE_INVENTORY_COMPLETE");
}

export function productionControlApproved(): boolean {
  return flag("OCPP_PRODUCTION_CONTROL_APPROVED") && hardwareInventoryComplete();
}

export function publicLiveUpdatesEnabled(): boolean {
  return ocppEnabled() && flag("OCPP_PUBLIC_LIVE_UPDATES") && flag("FLAG_PUBLIC_LIVE_AVAILABILITY");
}

export function csmsListenHost(): string {
  return process.env.CSMS_LISTEN_HOST?.trim() || "127.0.0.1";
}

export function csmsListenPort(): number {
  return intEnv("CSMS_LISTEN_PORT", 9000, 1, 65535);
}

export function csmsWssBaseUrl(): string {
  return (process.env.CSMS_WSS_BASE_URL?.trim() || `ws://${csmsListenHost()}:${csmsListenPort()}`).replace(
    /\/+$/,
    "",
  );
}

export function csmsControlBaseUrl(): string {
  return (process.env.CSMS_CONTROL_URL?.trim() || `http://${csmsListenHost()}:${csmsListenPort()}`).replace(
    /\/+$/,
    "",
  );
}

export function csmsTlsCertPath(): string | null {
  return process.env.CSMS_TLS_CERT_PATH?.trim() || null;
}

export function csmsTlsKeyPath(): string | null {
  return process.env.CSMS_TLS_KEY_PATH?.trim() || null;
}

export function csmsAllowInsecureLocal(): boolean {
  return flag("CSMS_ALLOW_INSECURE_LOCAL");
}

export function heartbeatStaleSeconds(): number {
  return intEnv("OCPP_HEARTBEAT_STALE_SECONDS", 180, 30, 3600);
}

export function commandTimeoutSeconds(): number {
  return intEnv("OCPP_COMMAND_TIMEOUT_SECONDS", 30, 5, 180);
}

export function startEvidenceTimeoutSeconds(): number {
  return intEnv("OCPP_START_EVIDENCE_TIMEOUT_SECONDS", 120, 15, 900);
}

export function maxOcppPayloadBytes(): number {
  return intEnv("OCPP_MAX_PAYLOAD_BYTES", 65_536, 1024, 262_144);
}

export function maxCsmsConnections(): number {
  return intEnv("OCPP_MAX_CONNECTIONS", 200, 1, 10_000);
}

export function maxConnectionsPerIp(): number {
  return intEnv("OCPP_MAX_CONNECTIONS_PER_IP", 8, 1, 100);
}

export function remoteCommandRatePerHour(): number {
  return intEnv("OCPP_REMOTE_COMMAND_PER_DRIVER_HOUR", 10, 1, 60);
}

export function pilotStationIds(): string[] {
  return csv("OCPP_PILOT_STATION_IDS");
}

export function pilotConnectorIds(): string[] {
  return csv("OCPP_PILOT_CONNECTOR_IDS");
}

export function pilotDriverIds(): string[] {
  return csv("OCPP_PILOT_DRIVER_IDS");
}

export function credentialPepper(): string | null {
  const pepper = process.env.CSMS_CREDENTIAL_PEPPER?.trim() || process.env.AUTH_SECRET?.trim();
  return pepper && pepper.length >= 16 ? pepper : null;
}

export function csmsInternalHmacSecret(): string | null {
  const secret = process.env.CSMS_INTERNAL_HMAC_SECRET?.trim() || credentialPepper();
  return secret && secret.length >= 16 ? secret : null;
}

export function csmsHeartbeatIntervalSeconds(): number {
  return intEnv("OCPP_HEARTBEAT_INTERVAL_SECONDS", 60, 10, 600);
}
