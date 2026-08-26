# Plug and Go — Phase 5 finder and station pages

**Phase:** 5 — public station finder and server-rendered station pages  
**Not in this phase:** driver login, booking, waitlist, payment, invoices, OCPP, remote charger control, live sessions, fleet portal, technician portal

## Routes and components

| Route | Role |
|---|---|
| `/find-charger` | List-first published-station finder. Canonical URL has no query string. Query/filter combinations are `noindex`. |
| `/stations/[state]/[city]/[station-slug]` | Server-rendered public station page. Canonical path uses slugified state and city. Non-canonical valid slugs **308** to the canonical URL. Unpublished/demo/missing → **404**. |
| `GET /api/public/stations` | Extended search, filter, sort, pagination, optional geo (request-scoped). |
| `GET /api/public/stations/[slug]` | Published station detail (unchanged contract, `Cache-Control: private, no-store`). |
| `GET /api/public/stations/[slug]/tariff-estimate` | Integer-paise estimate (unchanged). |

Primary UI:

- `src/components/finder/FinderShell.tsx` — search, filters, list, optional map, geolocation after a user action
- `src/components/finder/FinderFilters.tsx` — desktop toolbar + mobile bottom sheet
- `src/components/finder/StationMap.tsx` — lazy map adapter (`mapbox` / `google` / unavailable)
- `src/components/ui/StationCard.tsx` — public + design-system specimen cards
- `src/components/stations/StationDetail.tsx` — station page sections

The list is always complete. The map is secondary and never the only discovery path. Primary CTA is **View station** / **Get directions**. There is no Booking or Start charging control.

## Public API query / filter contract

`GET /api/public/stations`

| Param | Rules |
|---|---|
| `q` | Optional, max 80 chars. Case-insensitive match on name, city, state, landmark, address lines, locality, district, pincode |
| `city`, `state` | Optional exact (insensitive) match |
| `connectorType` | One of the catalogue connector enums |
| `minKw` | Integer 1–1000; at least one installed connector at that power |
| `availability` | `available` \| `in_use` \| `faulted` \| `offline` \| `unknown` \| `stale` (computed public status) |
| `access` | Catalogue access enum |
| `openNow` | `1`/`true` — only stations with `is24_7` or parseable structured weekly hours that are open in Asia/Kolkata |
| `amenity` | Exact amenity string (case-insensitive) |
| `accessible` | `1`/`true` — accessible bay count above zero or accessibility notes |
| `sort` | `name` (default), `nearest`, `availability`, `power`, `price` |
| `page`, `pageSize` | Page ≥ 1; pageSize 1–50 (default 20) |
| `lat`, `lng` | Optional, must be paired. Used for distance and `nearest`. **Not written to shareable finder URLs.** |
| `radiusKm` | 1–250, requires lat/lng |
| `north,south,east,west` | Optional bounds; all four required together |

Invalid params → **400** `validation_error` with field errors. Responses include `publishedTotal`, `total` (matched), `sortApplied`, `nearestRequiresLocation`, and the Phase 4 freshness note. `availableConnectorCount` still counts only public `available`.

`Cache-Control: private, no-store` on public station APIs so live-status claims are not cached as certain.

## Map-provider setup and environment variables

No map vendor was configured in earlier phases. Phase 5 adds a provider adapter:

1. `NEXT_PUBLIC_MAPS_PROVIDER` = `mapbox` \| `google` \| `none` (or omit)
2. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — public token, URL-restricted to this site’s domains
3. `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` — Maps JavaScript API browser key, HTTP-referrer restricted

Never put a server secret in `NEXT_PUBLIC_*`. `MAPS_API_KEY` remains unused (later geocoding). Map SDKs load only from the finder map component (not marketing pages). If keys are missing, the finder stays a full list and states **Map display is unavailable**.

## Staleness / status logic

Unchanged core: `src/lib/status.ts` `computePublicStatus()`.

- Freshness minutes: `AVAILABILITY_FRESHNESS_MINUTES`. If unset, **Available is never shown**.
- Station cards aggregate connectors: Available (if any fresh) → In use → Faulted → Offline → Stale → Unknown.
- Every shown status includes copy such as `Status last updated 3 min ago` or `Live status unavailable`.
- Stale/offline/unknown never display as Available. Guidance may say the charger may be offline and to check nearby options.

Open-now does **not** use free-text hours alone.

## SEO / structured data

**Station pages (published only):** unique title and description from approved facts, canonical URL, Open Graph, one `h1`, visible breadcrumbs, visible last-updated status. JSON-LD `@graph` of `LocalBusiness` + `ElectricVehicleChargingStation` and `BreadcrumbList` matching visible facts. **No** review/aggregateRating schema.

**Finder:** canonical `/find-charger`. Any shareable query/filter/page combination is `noindex`. Zero-result searches are query URLs and therefore not indexed.

**Sitemap:** static public routes plus canonical published station paths only (demo/draft/archived omitted).

## Data fields required before publishing a station

Admin publish rules from Phase 4 still apply (installed connector, verification). For a useful public page and finder card, confirm:

- Name, slug, city, state, pincode, address line 1
- Real WGS84 latitude/longitude (directions use these)
- At least one **installed** connector (type + max power in watts)
- Access type and hours summary; structured weekly hours or `is24_7` if Open now should work
- Verification (`lastVerifiedAt`)
- Optional: locality, landmark, arrival/parking notes, amenities, accessibility, approved tariff (paise + GST), rights-confirmed published photos, vehicle compatibility notes, site emergency instructions

Without an approved effective tariff the UI omits a rupee price (it does not guess). Without published photos the gallery is omitted. Without nearby published stations the alternatives section is omitted.

## Test plan and verification results

Automated (this phase):

- Finder query validation, shareable URL (no lat/lng), index rule
- Structured hours / open-now reliability
- Canonical station paths and maps links
- Staleness conversion and freshness copy
- Tariff estimate display (energy + service + parking/idle/reservation + GST − discount; not an invoice)
- Published-only search (draft/archived/demo excluded even when names match)
- Filter: connector, min kW, amenity; stale never shown as Available

Commands run in this phase: `npm run lint` (pass), `npm run typecheck` (pass), `npm run test` (45 passed), `npm run build` (pass). Viewport script `scripts/phase-2-visual-qa.py` at 360, 390, 768, 1024, 1280, 1440: **PASS**, including `/find-charger` (search present, map unavailable or map canvas, no Booking/Start charging, one `h1`, no horizontal overflow).

Manual checks: list usable without map; filters in a sheet on small screens (no drag-only gestures); keyboard search/filter; status not colour-only; no Booking/Start charging.

## Scope explicitly deferred to Phase 6+

- Driver accounts, OTP, saved vehicles
- Booking, waitlist, Start charging, remote start/stop
- Payments, invoices, session history
- OCPP / CSMS live event ingest (catalogue still accepts manual/operator status)
- Fleet and technician portals
- Storing precise browser location or a geocoding service
- Reviews, uptime SLAs, certification badges
- Offline-capable finder
