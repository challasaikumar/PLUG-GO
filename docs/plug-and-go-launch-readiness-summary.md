# Plug and Go — launch readiness summary

**Owner:** Product owner (client)  
**Evidence required:** Phase 0–11 documents, CI logs, this summary  
**Pass/fail status:** **NOT PRODUCTION-READY** for charging real customers, taking real payments, sending real SMS, or controlling production chargers  
**Unresolved issue:** Identity, payments, SMS, backups, physical OCPP, support contacts, legal approval  
**Approval needed:** See production approval checklist below  
**Rollback or remediation:** Keep all launch-sensitive flags off (`docs/soft-launch-plan.md` Stage A only)

This task did **not** deploy to production, charge customers, send SMS, process real payments, or command production chargers.

## Completed capabilities by phase

| Phase | Capability |
| --- | --- |
| 0 | Product promise, data honesty, India-focused discovery |
| 1 | Brand and design system, 44px targets, reduced motion |
| 2 | Next.js App Router implementation notes |
| 3 | Public marketing website, enquiry fail-closed |
| 4 | Station catalogue, admin, audit, publication |
| 5 | Finder, station pages, maps optional, stale ≠ available |
| 6 | SEO, city/route/insights, no fake reviews |
| 7 | Driver OTP account, PWA shell, privacy export/deletion request |
| 8 | Booking holds, webhook-only payment success, refunds |
| 9 | Separate CSMS/OCPP, fail-closed remote commands, live sessions |
| 10 | Ops / technician / host / fleet portals, incidents, scoped RBAC |
| 11 | Flags, health, headers, tests, runbooks, soft-launch plan |

## Enabled / disabled features (intended initial production)

Unless a human sets the env flag **and** the dependency gate, the feature is **off**.

**Must remain disabled initially:** payment checkout, refunds, booking, driver OTP (until SMS), PWA prompt, public live availability, pilot remote charging on production hosts, **production remote charging**, ops/host/fleet portals (until IdP+MFA), public status page (optional).

**May be enabled on staging for Stage A:** public finder, published content, ops portals with the development staff adapter (`NODE_ENV` not production).

## Launch blockers still remaining

- Unverified station data and unpublished support/grievance contacts  
- Staff identity provider + MFA not wired (`requireStaffRole` still denies production)  
- SMS OTP provider not configured  
- Payment provider + **tested** signed webhook not configured  
- Backup **restore** not evidenced (only a non-destructive tooling check exists)  
- No physical charger / isolated OCPP acceptance  
- No approved tariff/booking/cancellation policy on a real station  
- Accessibility screenshot and Lighthouse field evidence missing  
- Legal entity, GSTIN, and policy effective dates unpublished  

## Required client / vendor configuration

- `PNG_ENV`, distinct staging vs production `DATABASE_URL` hosts  
- `NEXT_PUBLIC_SITE_URL` https for production  
- `AUTH_SECRET`, SMS provider keys  
- Razorpay (or chosen) key id/secret/webhook secret; public checkout key if required  
- `CSMS_*` TLS and HMAC secrets in a vault, never git  
- Staff IdP + `STAFF_MFA_ENFORCED=true`  
- Observability webhook if alerts should leave the logs  
- Encrypted backup storage and a restore drill on a copy  

## Test evidence

Run in this phase (see the agent’s closing report for live results):

- `npm run lint`  
- `npm run typecheck`  
- `npm test` (includes fail-closed flags and failure-path journeys)  
- `npm run build`  
- `npm run secret-scan`  
- `npx prisma migrate deploy` against the **local/dev** database only  

## Production approval checklist

- [ ] Hard blockers in `docs/release-checklist.md` all pass with evidence  
- [ ] Stage B OCPP lab sign-off  
- [ ] Finance signs webhook + refund operating procedure  
- [ ] Legal signs privacy/terms/refunds/grievance  
- [ ] Support owner named with hours  
- [ ] Production remote charging remains **off** until a separate safety sign-off  

## Recommended first soft-launch scope

**Stage A (staging) then Stage B (one lab charger, internal users).** Public discovery only after station facts, support owner, and (if money) webhook proof exist. Production remote charging stays off.
