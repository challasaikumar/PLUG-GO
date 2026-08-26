# Plug and Go — Phase 9 hardware integration inventory

**Status:** Incomplete for physical chargers. Production remote control is **blocked**.

This checklist must be filled for **every** physical charger before Plug and Go enables Pilot or Production remote start/stop. Empty rows mean the charger is **not commissioned**. Do not mark a charger “OCPP compliant” or “certified” unless Plug and Go holds verification evidence.

The browser never connects to a charger. Credentials stay in the vendor CSMS configuration and Plug and Go server-side secret storage.

## How to use

1. Copy the physical-charger template for each serial.
2. Complete every field, including test location and cutover owner.
3. Keep this file in Git **without** passwords, private keys, or certificate PEMs.
4. Set `OCPP_HARDWARE_INVENTORY_COMPLETE=true` only after every production-bound charger in the cutover set is complete **and** an owner has signed the cutover section.

---

## Simulator / lab harness (filled)

| Field | Value |
| --- | --- |
| Charger vendor | Plug and Go lab simulator |
| Model | SIM-1.6 |
| Serial number | SIM-SERIAL-NOT-PRODUCTION |
| Firmware | sim-0.1.0 |
| Station / EVSE / connector mapping | Created per test run; OCPP connectorId `1` maps to one installed catalogue connector |
| Supported OCPP version and transport | **OCPP 1.6 JSON** over WebSocket. Not 2.0.1. Not 2.1. |
| Vendor CSMS configuration procedure | Run `npm run csms:start`, commission a Test charge point in staff admin, paste the one-time Basic-auth password into `npm run csms:simulator -- --identity … --password …` |
| Charge point identity format | `[A-Za-z0-9._-]{1,48}` example `PNG-SIM-001` |
| WSS endpoint format/path | `{CSMS_WSS_BASE_URL}/ocpp/1.6/{identity}` local example `ws://127.0.0.1:9000/ocpp/1.6/PNG-SIM-001` |
| Authentication / security profile | `basic_auth` (Security Profile 1 analogue). Unique password per charge point. Hash + kid stored; plaintext shown once. |
| Credential / certificate ownership and rotation | Plug and Go staff rotate via `POST /api/admin/charge-points/{id}/rotate-credential`. Password is not in Git. TLS cert/key paths are env **references**. |
| Heartbeat interval | `OCPP_HEARTBEAT_INTERVAL_SECONDS` (default 60). Stale after `OCPP_HEARTBEAT_STALE_SECONDS` (default 180). |
| Remote start/stop support | Simulated for 1.6 `RemoteStartTransaction` / `RemoteStopTransaction`. Physical support is **unverified**. |
| Meter value support and unit | Simulator emits `Energy.Active.Import.Register` in **Wh**. Stored raw + integer milliWh. |
| Transaction / session event support | 1.6 `StartTransaction` / `StopTransaction` / `MeterValues` |
| Fault / status mapping | See `docs/phase-9-ocpp-csms-and-live-sessions.md` |
| Test charger ID and isolated test location | Identity `PNG-SIM-001` (or per-test identity). Isolated process on localhost. **Not** a customer-facing charger. |
| Firmware update policy | Simulator only. No remote firmware update API in this phase. |
| Vendor support escalation contact | Internal engineering. Not a hardware vendor. |
| Production cutover approval owner | **Not approved.** Simulator must never be cut over as a production charger. |

---

## Physical charger template (NOT COMPLETED)

Copy this block per serial. Leave “NOT COMPLETED” until every line has a real value.

```
Charger vendor:
Model:
Serial number:
Firmware:
Station id / slug:
EVSE id / label:
Connector id / publicRef:
OCPP connector id:
Supported OCPP version (from vendor evidence, not assumed):
Transport (WSS required outside local lab):
Vendor CSMS configuration procedure (link or steps, no secrets):
Charge point identity format and assigned identity:
WSS endpoint format/path:
Authentication / security profile:
Credential or certificate owner:
Rotation procedure and last rotation date:
Heartbeat interval:
Remote start supported? (vendor evidence):
Remote stop supported? (vendor evidence):
Meter values supported? Measurand and unit:
Transaction/session events supported?
Fault/status mapping verified against Plug and Go public states?
Test charger ID:
Isolated test location (not a public bay):
Firmware update policy:
Vendor support escalation contact:
Production cutover approval owner:
Plug and Go verification evidence (ticket / report id):
ocppCertifiedClaim (default false):
```

### Physical charger 1 — NOT COMPLETED

No physical charger has been inventoried for Plug and Go in this repository.

---

## Gate

| Control | Allowed while this document is incomplete? |
| --- | --- |
| Simulator ingest and tests | Yes |
| Staff Test/Pilot commissioning (non-production) | Yes, allow-listed only |
| Production commissioning state | **No** (API rejects) |
| `OCPP_PRODUCTION_CONTROL_APPROVED` | **Must stay false** |
| Customer-facing remote start | **No** |
