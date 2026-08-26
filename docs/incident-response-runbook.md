# Plug and Go — incident response runbook

**Owner:** Platform on-call (primary), network operations lead (charger/CSMS), finance operations lead (money)  
**Evidence required:** Pager/alert routing to those owners; this runbook linked from the status channel  
**Pass/fail status:** **FAIL as an operational programme** — the catalogue exists in code/docs; no on-call roster or vendor is wired  
**Unresolved issue:** `OBSERVABILITY_WEBHOOK_URL` unset; no named humans in this repository  
**Approval needed:** Client assigns the three owner seats before Stage B  
**Rollback or remediation:** Disable the matching `FLAG_*`, keep public status honest, do not invent availability or payment success

Do not create an alert without an owner and a response. Catalogue: `src/lib/release/alerts.ts`.

## Severity

| Severity | Meaning | First action |
| --- | --- | --- |
| Critical | Safety, money integrity, or major outage | Disable remote charging and/or checkout flags. Page the owner. |
| High | Station network, OTP, or payment provider down | Fail closed. Tell support the honest state. |
| Medium | Stale data growth, backlog, non-critical integrations | Ticket with owner. Do not hide stale connectors. |
| Low | SEO/content metadata | Content lead. Unpublish empty pages. |

## Critical plays

### Production remote-control safety

1. Set `FLAG_PRODUCTION_REMOTE_CHARGING=false` and `OCPP_REMOTE_COMMANDS_ENABLED=false`.  
2. Stop CSMS command dispatch (SIGTERM the CSMS process — it closes sockets and marks `shuttingDown`).  
3. Reconcile `RemoteCommand` / `ChargingSession` rows against charger evidence.  
4. Do not send further RemoteStart/Stop until the network operations lead approves.

### Payment or webhook corruption

1. Set `FLAG_PAYMENT_CHECKOUT=false` and `FLAG_BOOKING=false`.  
2. Browser return URLs are never success.  
3. Reconcile `PaymentAttempt` against the provider dashboard.  
4. Refunds stay with finance (`FLAG_REFUNDS` plus adapter). Do not improvise captures.

### Major web/database outage

1. Ready check `GET /api/health/ready` will 503.  
2. Keep payments/OTP/remote charging disabled if state is unknown.  
3. Restore only onto a copy, with an explicit restore approval. Never against production from this runbook automatically.

## High plays

- **Station network offline:** Do not map stale/unknown to Available. Open incidents. Support quotes Unknown/Stale.  
- **Command failures:** Disable `FLAG_PILOT_REMOTE_CHARGING` if safety is unclear. Leave sessions pending/failed.  
- **OTP outage:** Do not invent codes. Search still works.  
- **Payment provider outage:** Disable checkout. Holds expire.

## Communications

- Public `/status` only if `FLAG_PUBLIC_STATUS_PAGE=true`. It shows component states, not secrets.  
- Public `/support` is for drivers. Internal queue is `/ops/support`.  
- Do not publish invented phone numbers or tariffs during an incident.

## After-action

Record flag changes (staff UI audits `feature_flag.override`; env changes go in the release log). Re-enable flags only with the stage plan in `docs/soft-launch-plan.md`.
