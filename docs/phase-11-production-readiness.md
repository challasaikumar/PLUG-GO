# Plug and Go — Phase 11 production readiness

**Phase:** 11 — release configuration, verification, observability, and launch safety  
**Owner:** Release / reliability / security / accessibility / QA lead (this workstream)  
**Evidence required:** Automated tests in `src/lib/release/`, production build, secret scan, migration apply on a non-production database, this document  
**Pass/fail status:** **FAIL for production launch.** Engineering controls for a controlled soft launch are in place. Production customer charging, live payments, live SMS, and production charger control are not approved.  
**Unresolved issue:** No identity provider with MFA, no verified payment webhook on a staging gateway, no SMS provider, no backup restore test evidence, no physical charger OCPP acceptance, unpublished legal entity/support contacts, no visual QA screenshot evidence in this repository  
**Approval needed:** Client product owner, network operations lead, finance, legal/privacy, and identity/SMS/payment vendors before Stage C  
**Rollback or remediation:** Unset every `FLAG_*` in the environment, keep `FLAG_PRODUCTION_REMOTE_CHARGING` and `FLAG_PAYMENT_CHECKOUT` false, and revert this phase’s migration only with a forward-fix if `FeatureFlagOverride` must be dropped

**Not in this phase:** New driver or host product features, production deployment, real SMS, real charges, production OCPP command execution.

## What this phase added

- Typed, fail-closed feature flags (`src/lib/release/flags.ts`) with staff kill-switches that cannot enable env-off or safety-critical flags
- Startup environment validation (`PNG_ENV`, distinct database hosts, HTTPS in production)
- `GET /api/health`, `GET /api/health/ready`, optional `/status`
- Security headers, sitemap/robots exclusions, cookie `Secure` on named staging/pilot/production
- Observability no-op until `OBSERVABILITY_WEBHOOK_URL` is set
- Alert catalogue with owners and responses
- Secret scan and backup-tooling check scripts (restore is never executed here)
- Accessibility/performance guards in CSS and tests

## Feature flags (fail closed)

| Flag | Env | Default | Notes |
| --- | --- | --- | --- |
| Public station finder | `FLAG_PUBLIC_FINDER` | off | Staff may disable only |
| Published city/route content | `FLAG_PUBLISHED_CONTENT` | off | Insights can remain; empty city pages still unpublished by catalogue rules |
| Driver OTP login | `FLAG_DRIVER_OTP` | off | Env-only; still requires SMS or dev OTP |
| PWA install prompt | `FLAG_PWA_PROMPT` | off | Staff may disable |
| Booking | `FLAG_BOOKING` | off | Requires payment checkout + gateway + approved policy |
| Payment checkout | `FLAG_PAYMENT_CHECKOUT` | off | Env-only; mock blocked in `NODE_ENV=production` |
| Refunds | `FLAG_REFUNDS` | off | Env-only |
| Public live availability | `FLAG_PUBLIC_LIVE_AVAILABILITY` | off | Also needs `OCPP_PUBLIC_LIVE_UPDATES` |
| Pilot remote charging | `FLAG_PILOT_REMOTE_CHARGING` | off | Env-only; allow-lists still required |
| Production remote charging | `FLAG_PRODUCTION_REMOTE_CHARGING` | **off** | Env-only; also needs CSMS production approval flags |
| Ops portal | `FLAG_OPS_PORTAL` | off | Still denied in production until IdP + MFA |
| Host portal | `FLAG_HOST_PORTAL` | off | Same staff identity gate |
| Fleet portal | `FLAG_FLEET_PORTAL` | off | Same staff identity gate |
| Public status page | `FLAG_PUBLIC_STATUS_PAGE` | off | noindex, not in sitemap |

`siteConfig.featureFlags` is **not** a runtime switch.

## Environments

| Name | `PNG_ENV` | Database | Credentials |
| --- | --- | --- | --- |
| Development | `development` | Local `127.0.0.1:54329` only | Dev OTP / mock payments allowed when `NODE_ENV` is not production |
| Staging | `staging` | Distinct host (`PNG_STAGING_DATABASE_HOST`) | Test Razorpay/SMS keys only |
| Pilot | `pilot` | Distinct from production | Limited allow-lists; no production remote charging |
| Production | `production` | `PNG_PRODUCTION_DATABASE_HOST` | Live secrets; HTTPS site URL; no mock OTP/payments |

Startup validation refuses a production database host in non-production `PNG_ENV`.

## Health

- Web liveness: `GET /api/health`
- Web readiness: `GET /api/health/ready` (database, CSMS if configured, payment/SMS configured-or-not, queue/cache honestly `not_configured`)
- CSMS: `GET /health` and `GET /ready` on the CSMS process (graceful shutdown sets `shuttingDown`)

## Verification this phase can claim

This phase **does** claim: fail-closed flags, no production remote charging or payment checkout without explicit configuration, noindex/private routes excluded from the sitemap, secret-pattern scan of the repository, unit/integration tests for failure paths.

This phase **does not** claim: a penetration test, a compliance certification, legal approval of policies, a successful production backup restore, or that Plug and Go is ready to charge real customers.
