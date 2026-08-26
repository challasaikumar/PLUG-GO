# Plug and Go — Phase 6 SEO and editorial content

**Phase:** 6 — local discovery pages, guides, insights, and route templates from approved real information  
**Not in this phase:** driver login, booking, waitlist, payment, invoices, OCPP, remote charger control, live sessions, fleet portal, technician portal

## SEO principle

Create **fewer, richer pages** from approved facts. Never mass-generate thin city, area, route, connector, or AI-written keyword pages. Public HTML is server-rendered. Structured data must match visible content.

## Routes added or enhanced

| Route | Public when | Indexable |
|---|---|---|
| `/ev-charging/[city]` | Approved `CityLandingContent` **and** at least one published non-demo station in that city | Yes, only then. Other slugs **404**. |
| `/how-to-charge` | Always (structured copy) | Yes |
| `/connector-guide` | Always (catalogue connector model) | Yes |
| `/pricing` | Always; calculator uses labelled example values unless an approved station tariff is looked up | Yes |
| `/insights` | Index of **published** articles only | Yes (empty state is honest) |
| `/insights/[slug]` | Published, non-demo, reviewed article | Yes. Drafts **404**. |
| `/routes/[origin]-to-[destination]` | Editor-approved route with researched notes and at least one currently published stop | Yes, only then. Other pairs **404**. |
| `/admin/content/*` | Staff only | **noindex** |
| `/admin/content/preview/*` | Staff preview of drafts | **noindex** (under `/admin`) |

Area pages are **not** created.

## Content models

Prisma (migration `20260825140000_phase6_editorial`):

- `ContentAuthor` — display name, role, bio
- `CityLandingContent` — unique intro, access/connector guidance, optional fleet module, SEO, FAQs, review/publish fields
- `InsightArticle` — title, excerpt, body (plain text), author/reviewer, related station slugs, allow-listed guide hrefs, related city slug, SEO, FAQs
- `RouteGuide` + `RouteStop` — origin/destination, notes, caveats, published station stops
- `ContentFaq` — attached to city, insight, or route

`internalNotes` never appear on public payloads. `isDemo` rows cannot be published.

## Publishing / review workflow

Staff (`content_manager` / `super_admin`) via `/admin/content` and `/api/admin/content/*` (same `guardStaff` / `ADMIN_ENABLED` rules as Phase 4):

1. Create as **draft**
2. **Mark reviewed** (sets `lastReviewedAt`)
3. **Publish** only if extra gates pass:
   - City: unique intro, review date, ≥1 published station in that city name, not demo
   - Insight: substantial body, author, review date, not demo
   - Route: researched notes, review date, ≥1 stop whose station is currently published, not demo
4. **Unpublish** archives the record (public 404, removed from sitemap)

Preview is staff-only. There is no public CMS or `?preview=` query.

## Rules preventing thin / duplicate pages

- City URLs resolve only from stored slugs, not arbitrary path text.
- No city page without published inventory **and** unique reviewed copy.
- No automatic city-combination route pages.
- Insights index does not list drafts. Demo templates cannot be published.
- Connector guide lists catalogue types; it does not invent vehicle-model compatibility.
- How-to-charge does not claim app/QR/RFID/session start on this website.
- Finder query/filter/zero-result URLs remain `noindex` (Phase 5).

## Sitemap and structured data

`src/lib/seo/sitemap-entries.ts` assembles:

- core `publicRoutes` (including `/how-to-charge`, `/connector-guide`, `/insights`)
- published station canonical URLs
- approved city pages
- published insights
- approved route guides

Absolute canonical URLs only. Excluded: `/admin`, `/api`, `/design-system`, query strings, drafts.

JSON-LD:

- **Organization** sitewide from `siteConfig` (address/phone/email/`sameAs` only if published)
- **BreadcrumbList** where visible breadcrumbs exist
- **FAQPage** only when those FAQs are on the page
- **ElectricVehicleChargingStation / LocalBusiness** only on real station pages
- **Article** on published insights
- **No** Review / AggregateRating schema

Open Graph images: `next/og` using the real page title and location facts only (`src/lib/seo/og.tsx`).

## Analytics events added

Consent-aware no-op `track()` in `src/lib/analytics.ts`. Typed events:

`location_search`, `filter_applied`, `station_viewed`, `directions_clicked`, `guide_viewed`, `city_page_viewed`, `route_page_viewed`, `lead_started`, `lead_qualified`, `support_opened` (plus existing host/fleet/workplace lead names).

Payloads strip lat/lng, phone, and payment keys. No third-party vendor is activated.

## Content still required from the Plug and Go team

- Unique city introductions, access notes, and FAQs for each city that has published stations
- Author/reviewer identities for insights
- Researched route plans with real stop slugs (do not invent highway corridors)
- Reviewed insight articles (seed rows are **demo drafts** and cannot go live)
- Approved tariffs before any public page shows a Plug and Go rupee estimate
- NAP, hours, and GBP listing owners — see `docs/local-seo-and-google-business-profile-checklist.md`
- Legal entity, support phone/email, social profiles (Organization schema stays minimal until those are published)
- Human review before any additional locale / translated pages

## Deferred to Phase 7+

- Driver accounts, booking, payment, invoices
- OCPP / charger control / live sessions
- Fleet and technician portals
- Area-level landing pages
- Machine-translated locales
- Ratings/reviews schema (only with genuine eligible reviews)
- Third-party analytics after consent configuration
- Mass programmatic SEO
