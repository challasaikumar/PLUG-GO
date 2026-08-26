# Plug and Go — Phase 10 operations portals

**Phase:** 10 — protected operational portals for staff, technicians, hosts, and fleets  
**Security principle:** The public website helps drivers discover stations. The operations portals run the network. They stay separate, noindex, role-protected, audited, and least-privilege.

**Not in this phase:** roaming/OCPI, smart charging/load balancing, AI analytics, uncontrolled charger commands, public device controls, fleet-driver invitations, full cost allocation, payroll/accounting, automatic government or third-party portal submits.

## Routes and portal capabilities

| Route | Portal | Capability |
| --- | --- | --- |
| `/ops` | Staff operations | Network health: connector status, fresh/stale/offline, incidents by severity, pending/failed commands, heartbeat issues, role-gated exceptions. Filters by city, station, host, connector status, severity, technician. |
| `/ops/stations` | Staff operations | Scoped station list with public status chips. |
| `/ops/stations/[station-id]` | Staff operations | Access/contact/tariff/EVSE/device summary, heartbeat/meter/boot/fault, incidents, assignments, tariff history, audit, public station link. Status override (reason + expiry + audit). Remote command request (not OCPP from the browser). |
| `/ops/incidents` | Staff operations | Incident queue, manual create, suggest-from-signals. |
| `/ops/incidents/[incident-id]` | Staff operations | Lifecycle, internal vs customer notes, technician assignment, vendor escalation, verification. |
| `/ops/commands` | Staff operations | Command approval / break-glass / Phase 9 remote-command log. No generic “control charger” button. |
| `/ops/support` | Staff operations | Internal ticket queue. **Not** public `/support`. |
| `/ops/finance` | Finance only | Refund exceptions, receipts, refund initiation via Phase 8 services, async exports. |
| `/technician` | Technician | Assigned work orders only. |
| `/technician/incidents/[incident-id]` | Technician | Mobile checklist, evidence URL, start/pause/complete. |
| `/partner` | Host | Assigned locations: health, availability, booking counts, incident counts. No driver PII or payments. |
| `/fleet` | Fleet | Own organisation: approved driver/vehicle refs, aggregates, cost centres, invoice numbers. |

`/admin` remains the catalogue/content workbench from Phase 4.

All of these routes are `robots: noindex`, omitted from the sitemap, `Cache-Control: private, no-store`, and treated as private by the PWA service worker.

## Role / permission matrix

`super_admin` bypasses matrix checks but is still production-denied until an identity provider with MFA is wired.

| Action | content_manager | station_operator | technician | support | finance | host_admin | host_viewer | fleet_admin | fleet_viewer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` catalogue | yes | yes | yes | yes | yes | no | no | no | no |
| `/ops` overview | no | yes | yes (scoped) | yes | yes | no | no | no | no |
| Status override | no | yes | yes (assigned stations) | no | no | no | no | no | no |
| Incidents write | no | yes | yes (assigned) | yes | no | no | no | no | no |
| Assign technician | no | yes | no | yes | no | no | no | no | no |
| Verify resolution | no | yes | no | no | no | no | no | no | no |
| Request remote command | no | yes | yes | no | no | no | no | no | no |
| Approve command | no | yes | no | no | no | no | no | no | no |
| Break-glass | no | yes | yes | no | no | no | no | no | no |
| `/ops/support` | no | yes | no | yes | no | no | no | no | no |
| `/ops/finance` + refunds | no | no | no | no | yes | no | no | no | no |
| `/technician` | no | no | yes | no | no | no | no | no | no |
| `/partner` | no | no | no | no | no | yes | yes | no | no |
| `/fleet` | no | no | no | no | no | no | no | yes | yes |
| Raw charge-point identity | no | yes | yes | no | no | no | no | no | no |
| Driver phone / payment detail | no | no | no | limited | yes | no | no | no | no |

Authorization is enforced in `requireStaffRole()` and in object lookups (`resolveOpsScope`, `assertStationAccess`). Client UI hiding is not access control.

## Scope-assignment rules

| Model | Who it binds | Effect |
| --- | --- | --- |
| `StaffMembership` | Plug and Go staff → organisation | If present, operators/support/finance see that organisation’s stations only. If absent, internal staff see all stations (employees of the network). |
| `StationAssignment` | technician → station | A technician assigned to one station cannot open another station’s incidents, sessions, or finance. Unassigned technicians see an empty queue. |
| `HostMembership` | host_admin / host_viewer → host | `/partner` lists only those hosts. |
| `FleetMembership` | fleet_admin / fleet_viewer → `FleetOrganisation` | `/fleet` lists only those organisations. |
| `FleetDriverRef` | optional driver id, `approved=true` | Fleet aggregates only approved refs. No invitation system. |

Driver OTP identity (`png_driver` cookie) is never used for these portals.

## Incident lifecycle

States: **New → Acknowledged → Diagnosing → Technician assigned | Waiting on vendor → Resolved → Verification required → Closed**.

Severity: Critical, High, Medium, Low (label + glyph; colour is not the only signal).

- Internal notes (`note_internal`) are not customer-visible.
- Customer-visible notes and `customerVisibleStatus` are stored separately.
- Technician assignment creates a `TechnicianWorkOrder` with a pass/fail/N-A checklist.
- Completing high/critical work requires evidence.
- Critical close requires operator verification (`verifyIncidentResolution`).
- Vendor escalation sets `waiting_on_vendor` and `vendorEscalatedAt`.

`suggestIncidents()` may **open** incidents from:

- Offline / stale heartbeat
- Repeated remote-command failure
- Faulted connector
- Completed session without meter energy
- Repeated support tickets at a station

It **never** closes an incident because a charger reconnects.

## Remote-command approval / break-glass

1. The browser never speaks OCPP and never holds charger credentials.
2. Staff choose a specific action (remote stop / start / reset / configuration). There is no generic control button.
3. Reset and configuration are recorded as `denied` and return `501` — not implemented in this phase.
4. Remote start is not dispatched from operations (drivers use the Phase 9 session flow).
5. Remote stop requires: MFA assertion, reason (≥ 8 characters), station/role scope, then **either** a second operator approval **or** a break-glass record that expires within 15 minutes.
6. Dispatch still goes only through `CsmsCommandService.requestStaffRemoteStop()` (Phase 9). Additional gates:
   - `OCPP_ENABLED` and `OCPP_REMOTE_COMMANDS_ENABLED`
   - `OPS_STAFF_REMOTE_COMMANDS_ENABLED` (default **false**)
   - charge-point `remote_stop` capability
   - commissioning / production control flags
   - non-empty station and connector allow-lists
   - an existing charger **transaction id** (protocol Accepted ≠ charging)

## Host / fleet privacy boundaries

- Hosts see location health, availability counts, open incident counts, and confirmed booking **counts**. They do not see driver names, phones, or payment instruments. Revenue reporting is a placeholder until a host settlement agreement and real payout data exist.
- Fleet users see their organisation’s approved driver/vehicle references, session aggregates, cost-centre codes, and financial document **numbers**. Phone numbers and payment provider ids are omitted. Driver invitations, payroll, and full cost allocation are deferred.

## Export authorization / security

`ExportJob` is request → queued/running → completed (or left queued if > 500 rows). Large exports are **not** generated synchronously.

- Requestor, filters, date range, generated time, expiry (24h), and audit trail are stored.
- Download is authorised (`GET /api/ops/exports/[publicRef]/download`) with `Cache-Control: private, no-store`.
- Kinds: `finance_refunds`, `ops_incidents`, `compliance_station` (stable station/EVSE/connector ids, location, status timestamps, tariff energy rate, heartbeat/meter times), `host_summary`, `fleet_activity`.
- Nothing is submitted to a government or third-party portal.

## MFA / identity-provider configuration required

Production `requireStaffRole()` still **denies all staff, host, and fleet portals** until:

1. `ADMIN_ENABLED=true`
2. `STAFF_IDENTITY_PROVIDER` is set to a real provider name **and that provider is wired into `requireStaffRole()`** (not yet implemented)
3. `STAFF_MFA_ENFORCED=true` and the provider requires MFA for staff/host/fleet roles

`STAFF_DEV_ROLE` / `STAFF_DEV_ACTOR_ID` are ignored in production. Driver OTP is a different identity.

Local development still uses the Phase 4 adapter. Assign `StationAssignment`, `HostMembership`, or `FleetMembership` rows for the actor id you set.

Technician evidence URLs must be `https` (or `http://127.0.0.1` in lab). Optional `OPS_EVIDENCE_STORAGE_PREFIX` further restricts the host.

## Explicit deferred scope after Phase 10

- Identity provider + real MFA enrollment and session
- OCPI / roaming
- Smart charging / load balancing
- AI analytics
- OCPP Reset / ChangeConfiguration / generic charger control
- Staff remote start of driver sessions
- Fleet-driver invitations, payroll, full cost allocation
- Host settlement / revenue reports backed by payouts
- Automatic compliance filing to government portals
- Background worker for >500-row exports
- Object-store upload API (evidence is a storage URL reference only)

## Environment (placeholders only)

See `.env.example`: `STAFF_MFA_ENFORCED`, `OPS_STAFF_REMOTE_COMMANDS_ENABLED`, `OPS_EVIDENCE_STORAGE_PREFIX`.
