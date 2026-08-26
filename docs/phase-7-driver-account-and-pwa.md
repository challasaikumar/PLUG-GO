# Plug and Go — Phase 7 driver account and PWA

**Phase:** 7 — driver authentication, account data, privacy controls, QR handoff, PWA foundation  
**Not in this phase:** booking, waitlists, payment, invoices, active charging sessions, OCPP, remote start/stop, fleet portal, technician portal

## Authentication architecture

Driver authentication is a **phone OTP adapter** on the existing Next.js App Router and Prisma/PostgreSQL stack. No third-party identity provider was already approved for drivers.

Staff/admin authorization is unchanged: `src/lib/auth/staff.ts` and `requireStaffRole()` remain the only path into `/admin` and `/api/admin/*`. Driver cookies do not grant staff roles. Staff development adapters (`STAFF_DEV_ROLE`, `ADMIN_ENABLED`) do not sign in drivers.

Flow:

1. `POST /api/auth/otp/request` — validate Indian mobile number, rate-limit, store a hashed OTP challenge, send SMS (or development OTP).
2. `POST /api/auth/otp/verify` — check hash, expiry, attempts, single-use consumption, then create/update `Driver` and issue a session.
3. Session token is a 32-byte random value. Only the HMAC hash is stored. Cookie `png_driver` is HttpOnly, `SameSite=Lax`, `Secure` in production.
4. `POST /api/auth/logout` revokes that session row and clears the cookie.

Driver rows are created only after a successful OTP. Request-OTP does not reveal whether the number is new.

## Required environment variables

See `.env.example` (placeholders only).

| Variable | Role |
| --- | --- |
| `AUTH_SECRET` | HMAC secret for OTP hashes, session hashes, and IP/phone rate-limit keys. Min 16 characters. |
| `AUTH_SESSION_DAYS` | Session lifetime (default 30). |
| `AUTH_OTP_EXPIRY_SECONDS` | Challenge lifetime (default 300). |
| `AUTH_OTP_RESEND_SECONDS` | Resend cooldown (default 60). |
| `AUTH_OTP_MAX_ATTEMPTS` | Max verify attempts per challenge (default 5). |
| `AUTH_OTP_SEND_PER_PHONE_HOUR` | Send cap per phone (default 5). |
| `AUTH_OTP_SEND_PER_IP_HOUR` | Send cap per IP hash (default 10). |
| `AUTH_OTP_VERIFY_PER_PHONE_HOUR` | Verify cap per phone (default 20). |
| `SMS_OTP_PROVIDER` | `webhook` or `none`. |
| `SMS_OTP_WEBHOOK_URL` | Server-side SMS adapter endpoint. |
| `SMS_OTP_WEBHOOK_TOKEN` / `SMS_OTP_PROVIDER_KEY` | Bearer token for the webhook. |
| `SMS_OTP_FROM` | Optional sender id passed to the webhook. |
| `AUTH_DEV_OTP` | `true` enables development OTP **only when `NODE_ENV` is not `production`**. |
| `NEXT_PUBLIC_SITE_URL` | Public origin (already used for canonical URLs). |
| `NEXT_PUBLIC_ENABLE_SW` | Optional; register the service worker outside production. |

Production login is unavailable until `AUTH_SECRET` and an SMS provider are configured. Missing SMS is a configuration error, not a fake success.

## SMS provider setup still needed from Plug and Go

Plug and Go must choose and configure an India-capable SMS vendor and expose it as an HTTPS webhook (or later a dedicated adapter). Until `SMS_OTP_PROVIDER=webhook` and `SMS_OTP_WEBHOOK_URL` are set, production `/login` stays unavailable.

Development: set `AUTH_SECRET` and `AUTH_DEV_OTP=true` locally. The verify API may return `developmentCode` for the login UI. This flag is ignored in production even if set. Raw OTP codes are not logged.

Supported webhook body (server-to-server): `{ source, purpose: "driver_otp", to, code, from? }`.

## OTP security and rate limits

- Codes are 6 digits, stored as HMAC-SHA256(`salt:code`, `AUTH_SECRET`).
- Challenges expire, count attempts, enforce resend cooldown, and are consumed on success (replay fails).
- Rate limits persist in `AuthRateBucket` by hashed phone and hashed IP.
- Mutating auth/account APIs require a same-origin check (`Origin` / `Sec-Fetch-Site`) in addition to SameSite cookies.
- Generic errors are returned for failed verification to avoid user enumeration.
- Soft-deleted accounts (`deletedAt`) cannot start a new session after a deletion request.

## Account data model

Prisma models: `Driver`, `DriverAuthChallenge`, `DriverSession`, `DriverVehicle`, `SavedStation` (unique `driverId + stationId`), `NotificationPreference`, `DataExportRequest`, `AccountDeletionRequest`, `DriverAuditEvent`, `AuthRateBucket`.

Station and connector gained `publicRef` (QR-safe, not the internal cuid used by admin APIs).

Server lookups always filter by the authenticated `driver.id`. Browser-supplied vehicle, saved-station, or user ids are not trusted.

## PWA caching and offline rules

- Manifest: name “Plug and Go”, short name “Plug and Go”, theme `#0b6f62`, background `#f3eee6`, maskable `/icon`.
- Service worker (`/sw.js`) caches `/offline` and hashed `/_next/static` assets only.
- It does **not** cache `/api/*`, `/account`, `/vehicles`, `/saved-stations`, `/login`, or treat live station/price data as fresh offline.
- Navigation failures show `/offline`. An offline banner appears without blocking finder or directions.
- Install prompt is optional and dismissible.

## Privacy, export, and deletion

`/account/privacy` lists data this website actually holds: mobile number, vehicles, saved stations, notification preferences, export/deletion audit rows. Support tickets are not attached to driver accounts in this phase. Payment data is not collected.

Download-my-data returns JSON for the signed-in driver only and writes a `DataExportRequest` audit row.

Deletion requires typing `DELETE` after an explicit acknowledgement. That creates an auditable `AccountDeletionRequest`, sets `driver.deletedAt`, and revokes sessions. It is **not** an instant hard-delete. Finance/invoice retention rules will be added only after Phase 8, when those records exist. This implementation is not a legal-compliance claim.

## QR handoff

Route: `/scan/[station-public-id]/[connector-public-id]` (noindex, not in the sitemap).

Resolves only **published**, non-demo stations and installed connectors by `publicRef`. Invalid, draft, archived, or mismatched identifiers return a safe 404. The page shows station/connector context, does not start a charge, and does not expose internal ids, secrets, or charger-control actions. Signed-out users can sign in with a safe return path.

## Explicit deferred scope (Phase 8+)

- Booking and waitlists
- Payments, wallets, invoices, and finance retention
- Active charging sessions, remote start/stop, OCPP/CSMS
- Fleet portal and technician portal
- Staff identity provider (still unconfigured; admin remains separately gated)
- Attaching support tickets to driver accounts
- Additional country calling codes beyond India (the E.164 column is already extensible)
