# Plug and Go — soft-launch plan

**Owner:** Product owner (approves stage gates), network operations lead (monitoring), release manager (flags)  
**Evidence required:** Written go/no-go per stage with metrics below  
**Pass/fail status:** **Not started.** Code supports the gates; no station or driver is enrolled by this task  
**Unresolved issue:** All Stage B–E vendor and policy approvals  
**Approval needed:** See each stage  
**Rollback or remediation:** Return to the previous stage’s flag set; never enable production remote charging to “get unblocked”

Customer communication stays factual. No fake reviews, no “available everywhere,” no guaranteed charge time.

## Stage A — Internal / staging verification

| Field | Value |
| --- | --- |
| Flags | `FLAG_PUBLIC_FINDER`, `FLAG_PUBLISHED_CONTENT` optional, `FLAG_OPS_PORTAL`, `FLAG_HOST_PORTAL`, `FLAG_FLEET_PORTAL` on **staging only**. OTP/booking/payment/remote **off** unless using test credentials |
| Eligible | Staging database, test chargers in simulator/test CSMS mode, staff via `STAFF_DEV_*` on non-production |
| Success metrics | Lint/typecheck/tests/build green; ready health; flags fail closed; no secrets in git |
| Monitoring owner | Platform on-call |
| Rollback trigger | Startup validation error; production DB host detected |
| Approval owner | Release manager |
| Customer communication | None. Staging is not public. |

## Stage B — One test charger and internal pilot users

| Field | Value |
| --- | --- |
| Flags | Stage A + `FLAG_DRIVER_OTP` (test SMS or remaining non-prod dev OTP), `FLAG_PILOT_REMOTE_CHARGING`, OCPP test mode, empty production remote flag |
| Eligible | Named test charger + named internal driver IDs on allow-lists |
| Success metrics | Remote start pending → verified session → stop; command timeout and disconnect paths observed |
| Monitoring owner | CSMS engineer |
| Rollback trigger | Unexpected RemoteStart on a non-allow-listed connector; session marked Charging without meter/transaction evidence |
| Approval owner | Network operations lead |
| Customer communication | Internal only. |

## Stage C — One real station / city, limited drivers

| Field | Value |
| --- | --- |
| Flags | Finder + content for that city if facts are verified. Booking/payment only with approved policy **and** staging-like webhook proof on the live gateway using a tiny allow-list. Production remote charging **off** |
| Eligible | One published station, named drivers, support owner on duty |
| Success metrics | Search → station → support works; no stale-as-available; webhook-confirmed booking if enabled |
| Monitoring owner | Network operations lead |
| Rollback trigger | Unverified tariff, webhook mismatch, inaccessible flow, missing support owner |
| Approval owner | Product owner + finance (if money) + legal (if public terms) |
| Customer communication | Direct invite only. No nationwide marketing. |

## Stage D — Controlled public discovery launch

| Field | Value |
| --- | --- |
| Flags | `FLAG_PUBLIC_FINDER` + published stations. Live availability off unless freshness is proven. OTP/booking/payment only if Stage C money/identity passed. Remote production **off** |
| Eligible | Published stations with verified address/hours/connectors/tariff |
| Success metrics | Organic search to correct station pages; support route works; no empty city pages |
| Monitoring owner | Product owner |
| Rollback trigger | Empty city indexed, fake claim, PII leak, payment incident |
| Approval owner | Product owner |
| Customer communication | “Find a compatible charger. Know the price.” No availability guarantees if live updates are off. |

## Stage E — Gradual expansion by station / city

| Field | Value |
| --- | --- |
| Flags | Repeat Stage C/D per city. Production remote charging remains off until a separate hardware acceptance sign-off |
| Eligible | Stations that pass the data and physical checklist |
| Success metrics | Stale/offline rate within alert thresholds; incident SLAs held |
| Monitoring owner | Network operations lead |
| Rollback trigger | Offline rate > 25% for 15 minutes; command failure spike |
| Approval owner | Network operations lead |
| Customer communication | City pages only when stations exist. |

Recommended first scope: **Stage A on staging, then Stage B on one lab charger.** Do not skip to public discovery.
