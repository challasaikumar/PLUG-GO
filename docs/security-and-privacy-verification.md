# Plug and Go — security and privacy verification

**Owner:** Security reviewer (engineering) + privacy/grievance owner (client legal)  
**Evidence required:** This checklist + `src/lib/release/*.test.ts` + code paths cited  
**Pass/fail status:** **FAIL for production.** Code-level controls exist. No penetration test, no SOC/ISO/certification claim, no legal sign-off of privacy/terms  
**Unresolved issue:** Staff IdP+MFA not wired; live SMS and payment providers unset; backup restore unproven; grievance contacts unpublished  
**Approval needed:** Legal counsel for privacy notice, terms, refunds, grievance; vendor DPAs for SMS/payments  
**Rollback or remediation:** Disable `FLAG_DRIVER_OTP`, `FLAG_PAYMENT_CHECKOUT`, `FLAG_OPS_PORTAL`, `OCPP_REMOTE_COMMANDS_ENABLED`

This is a **code-level review**, not a penetration test.

| Control | Evidence | Status | Unresolved | Remediation |
| --- | --- | --- | --- | --- |
| Authentication / sessions | HttpOnly, SameSite=Lax, Secure on named prod/staging/pilot; separate staff vs driver | pass (code) | No IdP | Keep production staff denied |
| OTP brute-force / replay / rate limit | Existing OTP attempt caps, expiry, hashed codes | pass (code) | SMS vendor unset | Keep `FLAG_DRIVER_OTP` off |
| Object-level authorization | Station/host/fleet memberships; driver guards | pass (code) | Production staff adapter denied | Do not honour client-supplied roles |
| RBAC + scope isolation | Phase 10 matrix | pass (code) | MFA missing | Portals stay off in production |
| Payment webhook signatures | HMAC/provider verify; browser return is not success | pass (code) | Live webhook untested | Keep checkout off |
| Idempotency | Bookings, payments, commands | pass (code) | — | — |
| CSRF / CORS | Same-origin mutations; no `Access-Control-Allow-Origin: *` | pass (code) | — | — |
| Input validation | Finder/query, phone, amounts in paise | pass (code) | — | — |
| Secret management | `.env.example` placeholders; secret scan | pass (process) | Client vault not in repo | Never commit `.env.local` |
| Audit logs | Staff + driver audit events; flag overrides | pass (code) | — | — |
| Public API minimization | Public flags snapshot is booleans only | pass (code) | — | — |
| No OCPP in browser | CSMS is a separate process | pass (code) | — | — |
| Secure QR | Existing scan route; no credentials in QR | pass (code) | Physical labels untested | — |
| Backup / restore | `npm run backup-check` only | fail | Restore not run | Restore onto a copy with approval |
| Export / deletion | Phase 7 privacy centre | pass (code) | Legal process unset | Do not claim DPDP certification |
| Privacy notice / grievance / consent | Draft legal pages + analytics no-op | fail | Contacts unpublished | Do not launch accounts publicly |

Public APIs must not expose charger credentials, OCPP identities, or payment instruments. Flag snapshot and health endpoints were reviewed against that rule.
