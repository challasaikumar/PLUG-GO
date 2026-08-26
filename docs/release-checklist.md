# Plug and Go — release checklist

**Owner:** Release manager (client-appointed) with platform on-call  
**Evidence required:** Signed copy of this checklist plus CI logs (`lint`, `typecheck`, `test`, `build`, `secret-scan`)  
**Pass/fail status:** **FAIL** until every hard blocker is closed with evidence  
**Unresolved issue:** See launch blockers in `docs/plug-and-go-launch-readiness-summary.md`  
**Approval needed:** Product owner + operations lead + finance before any stage beyond B  
**Rollback or remediation:** Unset `FLAG_*`, disable `OCPP_REMOTE_COMMANDS_ENABLED`, disable `ADMIN_ENABLED`, keep payments on the provider dashboard only

Mark each row `pass`, `fail`, or `blocked`. Do not mark pass without the evidence column.

| Item | Evidence | Status | Notes |
| --- | --- | --- | --- |
| Fail-closed flags reviewed | Env dump with secrets redacted | fail | Defaults are off; staging must opt in explicitly |
| Production remote charging off | `FLAG_PRODUCTION_REMOTE_CHARGING` unset | pass (code default) | Must remain off until isolated OCPP acceptance |
| Payment checkout off until gateway verified | Razorpay dashboard webhook test | fail | No verified live webhook in this task |
| Booking off until policy + capacity approved | Approved `BookingPolicy` row | fail | Catalogue policy still required per station |
| OTP security configured | SMS vendor + rate limits in env | fail | Production login stays unavailable without SMS |
| Distinct staging database | Host names differ | fail | Client must provision |
| HTTPS site URL | `NEXT_PUBLIC_SITE_URL` | fail | Production validation requires https |
| Security headers on | Production response headers | pass (code) | Confirm on the deployed host |
| CSRF/same-origin on driver mutations | Existing `isSameOriginMutation` tests | pass (code) | |
| Staff IdP + MFA | IdP app + `STAFF_MFA_ENFORCED=true` | fail | Production portals remain denied |
| Backup schedule + restore test | Restore onto a **copy** | fail | This task does not restore |
| Support escalation owner | Named human + hours | fail | `siteConfig.contact` still unpublished |
| Station facts verified | Field checklist per station | fail | No live station certified here |
| Physical charger flow tested | Lab/pilot charger log | fail | Not performed |
| Stale status never shown as Available | `computePublicStatus` tests | pass (code) | |
| Accessibility of critical flows | Keyboard + SR notes + screenshots | fail | Screenshots not captured in-repo |
| Performance budget | Lighthouse on staging | fail | Commands documented; live profile pending |
| Secret scan clean | `npm run secret-scan` | pending this run | |
| Sitemap excludes private routes | `seo.test.ts` | pass (code) | |
| No fake reviews / empty city pages | Editorial rules | pass (code) | Empty cities stay unpublished |

Hard launch blockers (any one fails the launch):

1. Unverified station data  
2. Missing support escalation owner  
3. Untested payment webhook  
4. Missing OTP security configuration  
5. Incomplete backup/restore test  
6. Inaccessible critical user flow  
7. Stale status shown as available  
8. Untested physical charger flow  
9. No isolated pilot acceptance for OCPP  
10. No approved tariff/booking/cancellation policy  
11. Missing remote-command authorization/audit controls (IdP/MFA still missing in production)
