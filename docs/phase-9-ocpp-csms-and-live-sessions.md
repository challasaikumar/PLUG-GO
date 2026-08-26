# Plug and Go — Phase 9 CSMS, OCPP, and live sessions

**Phase:** 9 — secure CSMS/OCPP foundation, real-time status pipeline, charging sessions, protected pilot remote start/stop  
**Not activated:** production charger control, energy-session settlement / final consumption invoices, fleet portal, technician field portal, generic multi-version OCPP handlers

## Selected CSMS architecture

Plug and Go does **not** host persistent inbound OCPP WebSockets inside Next.js routes or serverless handlers.

```
Driver web/PWA
  → authenticated Plug and Go business API (`/api/sessions/*`)
  → CsmsCommandService + immutable RemoteCommand audit
  → CSMS control API (HMAC) over HTTP(S)
  → version-specific WSS to the physical charger

Physical charger
  → OCPP frames on WSS
  → services/csms/ (long-running Node process)
  → CsmsEventNormalizer + database
  → RealTimeEventPublisher → Next.js `/api/internal/realtime` (HMAC)
  → SSE `/api/realtime/sse` (normalized public/session events only)
```

- Process: `services/csms/src/index.ts` (`npm run csms:start`)
- Shared domain: `src/lib/ocpp/` (Next.js and CSMS both import this; Next.js does not import `services/csms`)
- No approved external/vendor CSMS was already wired. This is Plug and Go’s own CSMS boundary. An external CSMS would replace the WSS server with a secure adapter, not a second OCPP stack in the browser.

Health: `GET /health` on the CSMS HTTP port (no identities, secrets, or serials).

## OCPP version and charger capability matrix

| Version | Adapter | Implemented handlers | When it is used |
| --- | --- | --- | --- |
| OCPP 1.6 JSON | `Ocpp16Adapter` | BootNotification, Heartbeat, StatusNotification, Authorize, StartTransaction, StopTransaction, MeterValues, RemoteStart/Stop CALL + CALLRESULT | **Only verified protocol** for the lab simulator. Physical chargers must still present vendor evidence before they are called 1.6-capable. |
| OCPP 2.0.1 | `Ocpp201Adapter` | Stub. Parse/command throw `unsupported_version`. | Not commissioned. Do not parse 2.0.1 with the 1.6 handler. |
| OCPP 2.1 | `Ocpp21Adapter` | Stub. | No Plug and Go charger requires 2.1 today. |

`ocppCertifiedClaim` defaults to **false**. Staff must not set it without evidence.

Capabilities are stored per charge point (`remote_start`, `remote_stop`, `meter_values`) and re-verified on hardware — the simulator flags are not proof of a physical charger.

## WSS endpoint and configuration procedure

1. Commission a charge point in staff admin (technician / station operator). Production state is rejected.
2. Copy the **one-time** Basic-auth password. It is not stored in plaintext.
3. Configure the charger (or simulator) CSMS URL:
   - `{CSMS_WSS_BASE_URL}/ocpp/1.6/{identity}`
4. Non-local environments require WSS/TLS (`CSMS_TLS_CERT_PATH` / `CSMS_TLS_KEY_PATH`).
5. Production listen without TLS is refused unless `CSMS_ALLOW_INSECURE_LOCAL=true` **and** bind host is `127.0.0.1` / `localhost`.

Unknown, disabled, draft, duplicate, wrong-path-version, unimplemented-protocol, and failed-auth connections are rejected at upgrade (401/403). Duplicate live sockets are not silently replaced.

## Environment variables and credential handling

See `.env.example`. Charger passwords are HMAC-hashed with `CSMS_CREDENTIAL_PEPPER` or `AUTH_SECRET` plus a per-credential `secretKid`. Certificate material is a **reference string**, not a PEM in PostgreSQL.

Internal CSMS ↔ Next.js calls use `CSMS_INTERNAL_HMAC_SECRET` over `{timestamp}.{body}` with a 60-second skew window.

## Event normalization mapping (OCPP 1.6 → public)

| 1.6 `status` / condition | Internal (operator) | Recorded / public |
| --- | --- | --- |
| Available | Available | available (only if freshness policy allows) |
| Preparing, Charging, SuspendedEVSE, SuspendedEV, Finishing, Reserved | same 1.6 name | in_use |
| Faulted or `errorCode` ≠ NoError | Faulted / error code | faulted |
| Unavailable | Unavailable | offline |
| Heartbeat/status expired | heartbeat_timeout | **offline** written so Available is not preserved; public also uses stale/unknown via `computePublicStatus` |
| Missing / unusable | — | unknown |

Public APIs never expose charge point identity, serial, firmware, credentials, raw OCPP, or CSMS URLs. Finder/station pages already use `computePublicStatus` plus timestamps. Optional SSE (`OCPP_PUBLIC_LIVE_UPDATES=true`) pushes normalized connector events by station slug. A **browser** reconnect is labelled as such and is not a charger reconnect.

## Session state machine

`Requested` → `Authorizing` → `Starting` → `Charging` → `Stopping` → `Completed`

Failures: `Failed`, `Timed out`, `Interrupted`, `Support review`.

Rules:

- `RemoteStart` CALLRESULT `Accepted` → **Starting…**, never Charging.
- Charging requires `StartTransaction` and/or verified energy `MeterValues`.
- `RemoteStop` Accepted → **Stopping…** until `StopTransaction`.
- Timeouts do **not** blindly retry start/stop (the command may have executed).
- Protocol acceptance is not a payment or energy invoice. Phase 8 placeholders remain `not_issuable_until_session` until a **separate** settlement approval.

Private route: `/session/[session-id]` (publicRef), `noindex`, owner-only, `Cache-Control: private, no-store`.

## Remote command lifecycle

1. Authorize driver/staff, pilot policy, connector freshness (`available` for start), capabilities, commissioning.
2. Create immutable `RemoteCommand` (id, idempotency key, actor, station/EVSE/connector, reason, timestamps).
3. Dispatch once via CSMS. Record `RemoteCommandAttempt`.
4. Store protocol response. Evidence state stays `protocol_accepted_not_charging` until transaction/meter/stop evidence.
5. Reconcile timeouts with `CsmsCommandService.reconcileTimeouts`.

Least privilege: drivers start/stop **their** pilot session. Staff emergency path is `ROLE_MATRIX.remoteCommandStaff` (technician) and still hits the same production/pilot gates. Production staff writes remain denied until an identity provider is wired (`requireStaffRole`).

**Staff MFA:** charger-control roles (commission, remote command, credential rotation) require MFA at the future identity provider. The development adapter is not MFA. Do not enable production staff charger control without MFA.

## Pilot enablement conditions

Remote start is shown and dispatched only when **all** are true:

- `OCPP_ENABLED=true` and `OCPP_REMOTE_COMMANDS_ENABLED=true`
- `CSMS_MODE` is `simulator`, `test`, or `pilot` for Test/Pilot chargers
- Charge point commissioning is `test` or `pilot` (not `draft` / `disabled`)
- `OCPP_PILOT_STATION_IDS`, `OCPP_PILOT_CONNECTOR_IDS`, and `OCPP_PILOT_DRIVER_IDS` are **non-empty** and include this triple
- Connector mapped, installed, published station, fresh **Available**
- Capability flags enabled

Production chargers additionally require `CSMS_MODE=production`, `OCPP_PRODUCTION_CONTROL_APPROVED=true`, `OCPP_HARDWARE_INVENTORY_COMPLETE=true`, and a completed inventory row. The commission API currently **rejects** moving a charger to `production`.

Empty allow-lists deny everyone (fail closed).

## Simulator and physical-charger test procedure

### Simulator (required before hardware)

1. `npm run db:up` and `npx prisma migrate deploy`
2. `npm run csms:start` (separate terminal)
3. Commission a Test charge point; keep the one-time password out of Git
4. `npm run csms:simulator -- --identity <id> --password <once> --scenario boot-heartbeat-available`
5. Integration tests in `src/lib/ocpp/*.test.ts` cover boot, heartbeat, status, authorize, remote start accept/reject, StartTransaction, meter, stop, duplicate uniqueId, delayed/out-of-order status, stale heartbeat, command timeout, fault, unknown/disabled reject, driver isolation, public redaction

### Isolated physical charger (NOT RUN)

Use a non-public bay. Do **not** send uncontrolled remote commands to a customer-facing production charger.

Checklist: vendor identity and firmware match inventory; WSS path and auth succeed; Boot/Heartbeat/Status map correctly; remote start rejected when allow-list does not include the driver; remote start accepted only in Test/Pilot; Charging UI waits for transaction/meter; stop evidence; disconnect/reconnect; duplicate frames ignored; support reference on timeout.

## Incident / rollback

1. Set `OCPP_REMOTE_COMMANDS_ENABLED=false` (and/or `OCPP_ENABLED=false`) on web and CSMS, then restart CSMS.
2. Set affected charge points to `disabled` (staff). New sockets are rejected.
3. Do not retry in-flight start/stop blindly. Open support review with the session support reference.
4. Restore PostgreSQL from the last verified backup if protocol/session tables are corrupted. Charge point **passwords** are not in the DB; rotate credentials after restore and re-enter them on each charger.
5. TLS certificate rotation: update `CSMS_TLS_*` paths / secret store references and restart CSMS; chargers may need a reconnect.

Backup: standard PostgreSQL dump of the Plug and Go database. Exclude copying `.env.local` into Git. CSMS is stateless besides DB + live sockets.

## Risks / blockers before production activation

- Hardware inventory document incomplete (no physical rows)
- No Plug and Go verification that a named vendor/model/firmware speaks the assumed OCPP version
- Security profile may need mutual TLS (profile 2/3) — only Basic-auth is implemented
- Multi-instance Next.js SSE is process-local; production fan-out needs `OCPP_EVENT_PUBLISHER_URL` / a shared bus
- Staff identity provider and MFA not wired; production admin writes stay denied
- Energy settlement / GST consumption invoice not approved
- Horizontal connection limits, SOC, and vendor-specific quirks unverified
