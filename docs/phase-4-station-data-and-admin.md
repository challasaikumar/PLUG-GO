# Plug and Go — Phase 4 station data and admin

**Phase:** 4 — approved catalogue, versioned tariffs, protected admin foundation, public read APIs  
**Not in this phase:** finder/map UI, live CSMS feed, driver login, booking, payment, invoices, OCPP, remote start/stop, fleet/technician portals

## Database / ORM

**PostgreSQL + Prisma 6.** The repo had no database. Prisma matches the existing TypeScript Next.js app: typed models, SQL migrations, and a single `DATABASE_URL`. Money is stored as **integer paise** (`Int`). Coordinates use `Decimal(9,6)`. kW is stored as **watts** (`Int`) to avoid floating-point power values.

A project-local Postgres cluster on port **54329** avoids the machine’s existing Postgres on 5432 (which requires credentials this repo must not store).

```text
npm run db:up
```

Writes `postgresql://plugandgo@127.0.0.1:54329/plugandgo` (trust auth, localhost only). Put that in `.env` (Prisma CLI) and `.env.local` (Next.js).

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Catalogue APIs/admin | Server-only |
| `ADMIN_ENABLED` | Admin UI/API | Must be `true` to enable. Default off. |
| `STAFF_DEV_ROLE` | Local admin only | One of: `content_manager`, `station_operator`, `support`, `finance`, `technician`, `super_admin`. **Ignored in production.** |
| `STAFF_DEV_ACTOR_ID` | Local admin only | Opaque actor string for audit. **Ignored in production.** |
| `STAFF_IDENTITY_PROVIDER` | Later | Placeholder; production still denies until `requireStaffRole()` is wired to a real identity provider |
| `AVAILABILITY_FRESHNESS_MINUTES` | Optional | If unset, public APIs **never** return `available` |
| `ALLOW_DEMO_SEED` | Seed only | Must be `true` for `npm run db:seed` |

## Migration and seed

```text
npm run db:up
# write DATABASE_URL into .env and .env.local
npx prisma migrate deploy
npm run db:seed          # labelled Draft demo only
npm run db:clear-demo    # removes isDemo rows
```

Migration: `prisma/migrations/20260825120000_phase4_catalogue/`.

Demo seed slug: `demo-draft-not-public`. It stays **Draft** and `isDemo=true`. Publishing demo stations is rejected. Public APIs filter `isDemo=false` and `publicationStatus=published`.

## Data model summary

```text
Organisation → Host → Station
                         ├── StationMedia
                         ├── StationVerification
                         ├── EVSE → Connector
                         │            ├── CurrentConnectorStatus
                         │            └── ConnectorAvailabilityEvent (append-only)
                         ├── TariffVersion → TariffLineItem
                         └── SupportIssue (reference only)
StaffAuditEvent
IdempotencyRecord
```

- **Facts** are editable station/EVSE/connector/media rows with `publicationStatus`.
- **Availability** is event-sourced. `stale` is computed, never stored on an event. `unknown` and `stale` are never mapped to `available`.
- **Tariffs** are versioned. Approving a draft supersedes the previous approved version for the same station/connector/time band. Historical rows remain.

Public payloads omit internal notes, host personal contacts, staff ids (`verifiedBy`), draft tariffs, unpublished media, and audit logs.

## Public API contracts

All return `{ ok: true, ... }` or `{ ok: false, code, error, errors? }`.

### GET `/api/public/stations`

Query: `page`, `pageSize` (max 50), `city`, `state`, `connectorType`.

Returns published, non-demo summaries plus `freshness` note. `availableConnectorCount` only counts public status `available`.

### GET `/api/public/stations/[slug]`

Published station detail, connectors with computed public status, approved-and-effective tariff header or `tariff: null`.

Draft/archived/demo slugs → **404** (does not leak existence).

### GET `/api/public/stations/[slug]/tariff-estimate`

Query: `energyKwhMilli` (required, integer thousandths of a kWh), `idleMinutes`, `parkingMinutes`, `includeReservation`, `connectorId`.

Integer paise breakdown: energy + service + parking/idle/reservation + GST − discount. `isEstimate: true`, `isInvoice: false`. Missing approved tariff → 404 “Price is not published”.

## Admin APIs

Require `ADMIN_ENABLED=true` and `requireStaffRole()`. Writes are validated server-side. `Idempotency-Key` is honoured on station create and tariff draft create.

| Method | Path | Roles (super_admin always) |
|---|---|---|
| GET/POST | `/api/admin/organisations` | read / station_operator |
| GET/POST | `/api/admin/hosts` | read / station_operator |
| GET/POST | `/api/admin/stations` | read / content_manager, station_operator |
| GET/PATCH | `/api/admin/stations/[id]` | read / facts writers |
| POST | `/api/admin/stations/[id]/verify` | facts writers |
| POST | `/api/admin/stations/[id]/publish` | station_operator |
| POST | `/api/admin/stations/[id]/archive` | station_operator |
| POST | `/api/admin/stations/[id]/evses` | station_operator, technician |
| PATCH | `/api/admin/evses/[id]` | hardware writers |
| POST | `/api/admin/evses/[id]/connectors` | hardware writers |
| PATCH | `/api/admin/connectors/[id]` | hardware writers |
| POST | `/api/admin/stations/[id]/tariffs` | finance, station_operator |
| POST | `/api/admin/tariffs/[id]/approve` | finance |
| POST | `/api/admin/stations/[id]/media` | content_manager, station_operator |
| POST | `/api/admin/status-overrides` | station_operator, technician |
| GET | `/api/admin/stations/[id]/audit` | operator, support, finance, technician |

Audit records: actor id/role, timestamp, action, target type/id, before/after summary, `x-request-id` when sent.

## Admin UI

`/admin` (noindex, not in sitemap or public nav):

- Station list with publication state
- Create/edit facts
- EVSE/connector editor
- Tariff draft + approve
- Publish / archive / verify
- Status override with reason and expiry
- Audit list
- Empty, loading, error, and permission-denied states

No charts or fake operational metrics.

## Authorization strategy

`src/lib/auth/staff.ts` → `requireStaffRole()`. There is **no** hard-coded password, client role header, or secret-URL bypass.

- Production: admin enabled flag is not enough; identity provider is unconfigured → **403**.
- Development: optional server-only `STAFF_DEV_ROLE` + `STAFF_DEV_ACTOR_ID`.

## How to add a real station and tariff

1. Confirm legal entity, host, address, connectors, and photos with the station-data owner.
2. Enable admin only on a trusted machine (`ADMIN_ENABLED=true`, staff adapter).
3. `POST /api/admin/organisations` and `/api/admin/hosts` with real names (not invented).
4. Create a **Draft** station. Add installed EVSE + connector.
5. `POST .../verify` so `lastVerifiedAt` is set.
6. Create a tariff **draft** (paise, GST bps). Finance **approves**. Public estimate uses only approved, effective versions.
7. Operator **publishes** the station. Confirm `GET /api/public/stations/[slug]` shows it and that demo/draft slugs 404.
8. Do not set `isDemo` on real rows. Do not publish without rights-confirmed photos if you show images.

## Deferred to Phase 5+

- Public finder/map UI on `/find-charger`
- Geospatial search, live availability from CSMS/OCPP
- Driver login, booking, payment, invoices
- Real staff IdP / MFA
- Operator/technician/fleet portals
- Charger remote start/stop
