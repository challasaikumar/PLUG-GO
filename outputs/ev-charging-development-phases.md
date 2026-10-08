# EV charging website — phased build roadmap

## The outcome

Build this as a **trusted charging-network experience**, not a generic green-energy brochure. A driver should be able to find a compatible charger, understand the price and access rules, get directions, and get help—all comfortably from a phone.

The product should be developed in small, completed slices. Do not begin a later phase just because the screens look nice: move forward only after the **exit gate** for the current phase passes.

```text
Strategy → visual language → code foundation → public trust site
  → station data → finder → SEO/conversion → driver account
  → payments/booking → OCPP/live charging → operations → launch and improve
```

## Rules for the whole project

1. **Mobile first, then expand.** Design the 360–430px version first. A map must always have an equivalent usable list; a user must not need a precise drag gesture.
2. **Truth before polish.** Never use fake charger availability, invented customer logos, made-up reviews, or undated counters. Until live data exists, label content as `Demo`, `Planned`, or `Last verified on …`.
3. **One design system.** Do not build every page as a different visual experiment. Reuse layout, type, status, buttons, form, and station-card primitives.
4. **One data source.** A station’s address, hours, connector, tariff, availability, and photo must come from one approved record—not copied manually into several pages.
5. **Finish the unhappy paths.** Each interactive feature needs loading, empty, offline/stale, permission-denied, validation-error, and success states before it is called complete.
6. **No direct browser-to-charger control.** The public site and app call your secured backend. The backend/CSMS controls the physical charger over OCPP only after authorization and audit logging.
7. **Ship by phase.** Use one Git branch/PR per phase, a staging URL, a visual QA checklist, and a release tag such as `phase-04-finder-complete`.

## Quality bar: make it feel designed, not AI-generated

The visual character should be **calm infrastructure with human guidance**: precise, useful, slightly warm, and recognizably tied to the actual charging locations.

### Deliberate design decisions

- Use real station photography: entrance, parking bay, charger, signage, connector, amenities, and team. A driver needs to recognize the place on arrival.
- Use a restrained palette: deep ink/navy or graphite, warm off-white surfaces, and one electric teal/green action colour. Availability colours are semantic: green, amber, red, and grey, always paired with words and icons.
- Use a clear type scale, generous spacing, readable 16px+ body type, 44px+ touch targets, and a well-defined grid. Choose the typeface because it is legible in navigation and numbers—not because it looks futuristic.
- Let live facts create visual interest: availability, time-to-charge, tariff, connector type, route distance, and station photos. Do not rely on decorative 3D blobs or motion.
- Treat the map/finder as the product’s visual signature. It should have a thoughtful list/map relationship, honest freshness timestamps, and clear paths when something is unavailable.

### Things to avoid

- Generic neon gradients, random glass cards, floating 3D electric cars, or a stock car as the only proof of a charging business.
- Every section using the same oversized heading + three rounded cards pattern.
- Autoplay hero video, heavy map scripts, chat widgets, or animation that delays the first useful action.
- “100% uptime”, “fastest”, “trusted by thousands”, partner logos, ratings, or sustainability claims without proof.
- Controls that use colour alone, tiny tap targets, carousels with hidden information, or desktop-first tables on mobile.

### Mandatory visual review for every phase

Review the feature at **360px, 390px, 768px, 1280px, and 1440px**, with keyboard-only use and a slow network simulation. Check it in light/dark conditions, at 200% zoom, and with real Indian city/station content—not lorem ipsum. Capture before/after screenshots in the pull request.

---

## Phase 0 — scope, content, and product decisions

**Purpose:** decide what the first release actually promises before any UI or code is made.

**Build / decide**

- Choose the initial service area, customer priority (driver, fleet, host), supported connectors, and the first conversion action: `Get directions`, `Enquire`, `Book`, or `Start charging`.
- Confirm whether current station data is real, who owns it, how it is updated, and whether the charger already connects to a CSMS/OCPP backend.
- Define the release boundary. Recommended website MVP: public brand site + station discovery + station details + lead/support forms. Do not include live charging/payment until the operator workflow is ready.
- Create a page inventory from the main blueprint and mark each page `MVP`, `later`, or `not needed`.
- Create the station-data spreadsheet/schema: station, latitude/longitude, address, access/hours, EVSE, connector, kW, amenities, photos, tariff, fees, support route, source, verifier, and `last_updated_at`.
- Collect brand inputs: legal entity name, GST/support details, real photographs, approved customer/partner proof, policy copy, and the exact customer-support escalation route.
- Define success metrics: finder search → station view → directions, form completion, station-data freshness, LCP, zero-result searches, and qualified leads.

**Deliverables**

- `MVP scope.md`, user-journey map, approved sitemap, content/data inventory, page ownership list, and a testable definition of done.
- A small backlog organized as **Must / Should / Later**. Every item needs a business reason and acceptance criteria.

**Exit gate**

- The client can clearly say what a visitor can do at launch and what is intentionally unavailable.
- Every planned station page has an accountable data owner; there are no mystery fields or fake live states.
- The actual charger brand, OCPP version, CSMS/vendor access, and test-charger availability are confirmed before any “start charging” promise is sold.

**Do not build yet:** pages, a map, login, payment, or OCPP control.

---

## Phase 1 — experience direction and design system

**Purpose:** establish a distinctive, repeatable visual language before producing many screens.

**Build / decide**

- Turn the positioning into a short design statement, for example: **“Find a compatible charger. Know the price. Charge with confidence.”**
- Create a reference board from real infrastructure, wayfinding, urban night/day lighting, hardware materials, local station signage, and calm editorial design. Use it for direction, not copying.
- Define the visual tokens: colour roles, typography, spacing (an 8px rhythm), radii, shadows, borders, breakpoints, z-index, icon style, focus states, and motion durations.
- Design the essential components with every state: header, footer, button, text/link, input, search/autocomplete, filter, chip, card, status badge, price row, alert, accordion, tabs, modal/drawer, map marker, toast, skeleton, empty state, error state, and consent banner.
- Design signature charging components: `AvailabilityChip`, `ConnectorBadge`, `StationCard`, `PriceBreakdown`, `DataFreshness`, `ArrivalInstructions`, and `SupportEscalation`.
- Design desktop and mobile versions of the home hero, finder/list, station page, and one B2B landing section. These are the reference screens for the entire product.
- Write content rules: sentence case, direct English, local units (`₹/kWh`, `kW`, km), explicit times/dates, and honest status language such as `Offline — last updated 18 min ago`.

**Deliverables**

- A small design system/specimen page or Figma library, token file plan, component-state library, and high-fidelity reference screens.
- A `design-decisions.md` document explaining what makes the visual system specific to this charging network.

**Exit gate**

- You can assemble a new page entirely from approved components and tokens.
- The visual system works in greyscale, on a small phone, and with status colours removed.
- A driver can identify availability, price, connector, primary action, and help route in five seconds on the station reference screen.

**Do not build yet:** one-off page styles, motion effects before task flow, or a different card/button design on every screen.

---

## Phase 2 — engineering foundation and responsive shell

**Purpose:** create a maintainable, fast website foundation so future pages do not need rebuilding.

**Recommended baseline**

- **Web:** Next.js + TypeScript, with server-rendered public pages.
- **UI:** tokens plus Tailwind or CSS modules; component stories/examples if possible.
- **Data initially:** typed mock fixtures matching the eventual API; move them behind a repository/service boundary so UI code does not care where data comes from.
- **Deployment:** separate local, staging, and production environments; CI checks for lint, type check, tests, and build.

**Build**

- Create the app routes, semantic page shell, header/footer, error boundary, 404/500 pages, loading states, fonts, image optimization, and responsive container/grid utilities.
- Implement the Phase 1 tokens and primitive components; document usage in a local component playground/story route.
- Set up environment-variable validation. Keep map, payment, analytics, CMS, SMS, and OCPP secrets server-side—never in browser code or Git.
- Add consent-aware analytics scaffolding and event names, but do not fire marketing trackers before a valid consent flow/policy exists.
- Configure metadata defaults, Open Graph image template, robots rules, XML sitemap framework, canonical URL helper, and noindex protection for private routes.
- Build accessibility foundations: skip link, focus visibility, semantic landmarks, accessible form errors, reduced-motion support, and a keyboard-test checklist.
- Establish performance budgets: optimized AVIF/WebP imagery, reserved image dimensions, lazy-loaded map/chat/widgets, and no blocking hero video.

**Pages / modules finished in this phase**

- Shared shell, `/404`, error/loading states, internal `/design-system` specimen route (noindex), and a private staging-only content preview.

**Exit gate**

- Production build is repeatable and has no secrets in the client bundle.
- Navigation, forms, and focus work by keyboard; every core component has loading/disabled/error states.
- At phone, tablet, and desktop widths the layout reflows without horizontal scroll or clipped actions.
- Lighthouse/Web Vitals baseline is close to target before maps and third-party tools are introduced.

---

## Phase 3 — public trust and brand website

**Purpose:** launch a credible public face before the complex product features.

**Build**

- Home page with a useful finder entry point, real proof, how-it-works, compatibility/pricing clarity, safety/support, and audience split for drivers, fleets, and hosts.
- Core trust pages: `/about`, `/contact`, `/support`, `/safety`, `/pricing`, `/legal/privacy`, `/legal/terms`, `/legal/refunds`, `/legal/accessibility`, and `/legal/grievance`.
- Business conversion pages: `/solutions/fleets`, `/solutions/workplace`, and `/host-a-charger`, each with a distinct use case and qualified lead form.
- Contact and lead forms with server-side validation, spam protection, success/error states, CRM/email routing, and an owner/SLA for follow-up.
- Replace placeholder imagery and copy with proof from the actual business. Add a realistic station-photo plan where no photos exist yet.
- Build `/status` only if there is a real operational owner who can keep it current; otherwise do not imply real-time service monitoring.

**Key interaction details**

- Hero search accepts a city, address, landmark, or saved/default city; `Use my location` is optional and explains why permission is requested.
- On mobile, use a persistent but unobtrusive `Find a charger` action, not a large sticky banner that hides content.
- Lead forms reveal only necessary fields first; request documents only after qualification.

**Exit gate**

- A new visitor understands what the network offers, how to find a charger, what to do when help is needed, and how to contact the company.
- All public claims are source-backed and every form has a tested success and failure delivery path.
- Public pages are usable without login, pass basic mobile/accessibility QA, and feel coherent rather than like separate templates.

**First release option:** If the client needs a brand/lead-generation site quickly, this is a professional launch point. Clearly label the finder as `Coming soon` if no usable station catalogue is ready.

---

## Phase 4 — approved station catalogue and content administration

**Purpose:** create the operational source of truth that will power station pages, maps, SEO, app, invoices, and later OCPP status.

**Build**

- Database or CMS records for: organisation → host → station → EVSE → connector/gun → tariff version → availability event → support issue/photo.
- Required station fields: canonical name/slug, exact address and coordinates, arrival directions, access/hours/restrictions, connector type, kW, installed and available count, vehicle compatibility, amenities, accessibility, payment/authentication options, support contact, data source, owner, and verification/freshness dates.
- Versioned tariffs by station/connector/time band. Separate energy, service, parking/idle/reservation fees, GST, discount, effective date, and approval owner.
- A protected staff admin to create/edit/publish station records, tariffs, photos, and content. Use roles: content manager, station operator, support, finance, technician, super-admin.
- Approval workflow and audit log for public facts, price changes, published content, status overrides, and images.
- Public read API for station summary, search, station detail, and tariff estimate. Return a freshness timestamp for operational data.

**Data model rule**

```text
Station facts are editable information.
Live connector availability is an event stream.
Tariff is versioned financial data.
They must not be merged into one untraceable “station status” field.
```

**Exit gate**

- An authorized staff member can publish one real station and it appears consistently in the public API and page preview.
- A changed tariff has an approver, effective date, historical record, and a visible customer-facing breakdown.
- The system can mark any field as `Unknown`/`Offline`/`Outdated` rather than silently showing an old value as live.

**Do not build yet:** direct OCPP commands. This phase is reliable business data, not charger control.

---

## Phase 5 — finder, map/list experience, and station pages

**Purpose:** deliver the core driver experience and the most valuable SEO/conversion surface.

**Build**

- `/find-charger`: location search, geolocation with consent, map/list toggle, radius/bounds search, filters for connector, kW, availability, access/hours, amenities, and price where reliable.
- Accessible list is a first-class experience—not a fallback. It has sort order (nearest, available, fastest, price), clear zero-results, and nearby alternatives.
- `StationCard`: name, distance, availability + last updated time, connector/kW, access summary, starting price/fee clarity, and primary action.
- `/stations/[state]/[city]/[station-slug]`: address/directions, arrival photo/instructions, availability/freshness, connector/gun detail, compatibility, accurate tariffs/fees/GST/estimate, payment/auth options, access restrictions, amenities, safety/support, report issue, FAQs, reviews if genuine, and alternatives.
- Direction links: Google Maps / Apple Maps plus copy-address fallback. Treat directions as the no-login primary CTA.
- Search performance and maps: use PostGIS/geospatial query or a suitable index; cache list data briefly, but never hide the freshness time.

**Required interaction states**

| Scenario | User-facing behaviour |
|---|---|
| Location permission denied | Ask for city/pincode/landmark; do not block search. |
| No results | Explain why, show a wider radius/clear filters, and offer city/contact path. |
| Status stale or unknown | Show timestamp and a neutral state; do not display it as available. |
| Connector occupied/faulted | Explain it, disable unavailable actions, and show compatible alternatives. |
| Map unavailable / slow network | Keep the full sortable list and textual directions usable. |
| Bad station data reported | Collect station/session context and create a support ticket. |

**Exit gate**

- A driver can go from a city/address to a compatible station, understand whether it is accessible and what it costs, and open directions in under a minute without an account.
- No card/page says `Available` when status is stale, unknown, or manually overridden without a timestamp.
- Every station page has unique useful information and complete metadata; do not publish empty/generated location pages.

---

## Phase 6 — SEO, education, and conversion engine

**Purpose:** make the website discoverable and credible without creating thin SEO pages.

**Build**

- City landing template: `/ev-charging/[city]` with real inventory, local arrival/parking guidance, connector availability, FAQs, and links to station pages.
- Editorial guides: `/how-to-charge`, `/connector-guide`, `/pricing`, vehicle/connector explainers, and only genuinely researched route pages such as `/routes/[origin]-to-[destination]`.
- Content model with title, author/reviewer, last-updated date, FAQ, hero image, linked stations, language status, and publish/review dates.
- Structured data that matches visible text: Organization, LocalBusiness/ElectricVehicleChargingStation per verified station, BreadcrumbList, and visible FAQPage where appropriate.
- XML sitemaps segmented for stations/cities/guides; robots/canonical rules; Search Console/Bing Webmaster setup; Open Graph sharing cards.
- Google Business Profile operating checklist: pin, address, hours/special hours, phone, photos, access rules, and station page must stay consistent.
- Analytics funnel: `location_search`, `filter_applied`, `station_viewed`, `directions_clicked`, `lead_started`, `lead_qualified`, and `support_opened`—only after consent rules are in place.

**Content quality rule**

Create a city or route page only if it includes real, maintained information that a driver cannot get from a generic directory. Every page needs an accountable reviewer and refresh date.

**Exit gate**

- Each indexable page has one canonical URL, title, description, H1, OG metadata, internal links, and appropriate structured data.
- Private/admin/session/booking/zero-result/filter pages are `noindex`.
- First 10–20 station/city pages pass a human usefulness review. Quality beats a massive number of weak pages.

---

## Phase 7 — driver account and PWA foundation

**Purpose:** let repeat drivers save details and use the site like an app, while keeping station discovery open to everyone.

**Build**

- OTP/passwordless sign-in with rate limiting, verified mobile-number handling, session management, account deletion/export/correction pathways, and privacy controls.
- `/account`, `/vehicles`, `/saved-stations`, `/bookings`, `/invoices`, `/support/tickets`, and optional PWA install prompt.
- Vehicle profile: make/model, connector, battery size/range only where needed. Use it to pre-filter compatible stations; do not over-collect data.
- Save/favourite stations, recent searches, support history, and clear notification preferences.
- QR handoff: scan a station/connector QR to open the correct authenticated station screen. QR URLs must not expose a booking/session or allow a control action without server authorization.
- PWA app shell with safe offline behaviour: show saved stations/basic documents, last updated time, and a reconnect message—never pretend live charger status is current while offline.

**Exit gate**

- A new driver can discover first, sign in only at a commitment point, save a vehicle/station, and safely access their own records.
- All account and session routes are `noindex`; object-level authorization is tested so one user cannot read another driver’s data.
- The app is pleasant on phone browsers before native Android/iOS apps are considered.

---

## Phase 8 — booking, payments, invoices, and support recovery

**Purpose:** turn directions/discovery into a reliable commercial driver experience.

**Build**

- Reservation/queue workflow only if the station operations can honor it. Model eligibility, connector assignment, arrival window, fee, cancellation/refund rule, expiry, no-show, and waitlist.
- Tariff estimate before commitment and a final invoice with energy charge + service fee + parking/idle/reservation fee + GST − discounts.
- Payment gateway integration for UPI plus supported card/wallet options; server-side payment-order creation, signed webhook verification, idempotency keys, reconciliation, and refund workflow. Use provider tokens—never store raw card data.
- Customer views for booking status, payment status, invoice, download/share, failed-charge/failed-payment recovery, refund progress, and a support ticket with station/session reference.
- Finance/support tools for reconciliation, charge dispute evidence, partial/full refund approval, invoice correction policy, and customer communication.

**Exit gate**

- No payment is marked successful from a browser redirect alone; the backend verifies the gateway webhook.
- Every booking/payment/refund path is idempotent, audited, and tested for duplicate clicks, no network, failed gateway, cancelled booking, unavailable connector, and refund request.
- Prices and additional fees are visible before commitment and invoices reconcile to the tariff version used.

**Do not promise:** “book any charger” or instant refunds unless the operation and policy can actually provide them.

---

## Phase 9 — live availability and OCPP/CSMS integration

**Purpose:** connect the digital product safely to the physical charging network.

**Architecture boundary**

```text
Driver web/PWA
    → authenticated business API
    → command service + audit log
    → CSMS/OCPP service over WSS
    → physical charger

physical charger → OCPP status/meter/session events → CSMS
    → normalized event service → API/SSE/WebSocket → driver/ops UI
```

**Build**

- Confirm the physical charger’s supported OCPP version, security method, remote-start/stop capability, firmware constraints, connector/EVSE identifiers, and vendor configuration access.
- Choose/build a CSMS (vendor platform, managed CSMS, or your own OCPP service). Configure secure WSS endpoint, unique charge-point identity, credentials/certificates, network/firewall rules, and charger heartbeats.
- Normalise OCPP events such as boot, heartbeat, status, authorization, transaction/session, meter values, stop, fault, and recovery into your business model.
- Show real-time data to the app/site by controlled SSE/WebSocket events or short polling. Every status shows `last updated` time.
- Build safe command workflows for remote start/stop: server-side authorization, station/connector state validation, idempotency key, command ID, audit log, timeout/retry policy, and human-support fallback.
- Use a charger simulator and one isolated test charger first. Add device-health alerts, dead-heartbeat detection, command failures, telemetry monitoring, and a runbook.

**Critical truth rule**

`Remote start accepted` is not `Charging`. Show `Starting…` until the backend receives actual session/meter evidence. If confirmation does not arrive, present a recovery path and support reference.

**Exit gate**

- The full test flow works repeatedly on an isolated physical charger: online → authorized → start request → actual energy/meter/session confirmation → stop → final session/invoice reconciliation.
- A failure at any step gives the driver an accurate state and creates actionable operator/support evidence.
- The web/app has no charger credentials and cannot control hardware by bypassing the backend/CSMS.

**This is a separate contract scope.** It is a charging-management system integration, not a normal marketing website feature.

---

## Phase 10 — operator, technician, partner, and fleet operations

**Purpose:** make the network operable at scale without exposing sensitive controls publicly.

**Build**

- Operator dashboard: live station/connector health, stale/offline list, tariff status, session exceptions, command log, and support queue.
- Technician workspace: assigned incidents, site/connector identity, safety checklist, maintenance history, evidence upload, and resolution verification. Do not give unrestricted finance/customer access.
- Support/finance: session search, controlled refund tools, invoice/reconciliation status, customer communication, audit history, and escalation SLAs.
- Host/fleet portals only after their actual contract/reporting needs are defined: assigned locations, utilization/revenue (host), driver access/cost centres (fleet), invoices/reports.
- Role-based access control, MFA for staff, least privilege, approval workflow for prices/refunds/remote actions, tamper-evident audit trails, secure backups, monitoring, and incident runbooks.
- Compliance/reporting exports after confirmation with the relevant state agency/operator obligations; include stable station/EVSE/connector IDs, coordinates, status/downtime, tariffs/fees, and energy/meter records as required.

**Exit gate**

- Staff can resolve a real fault or payment issue end to end with all actions logged and without using spreadsheets as the source of truth.
- Each role can see only the data/actions needed for its job; staff MFA and break-glass admin controls have been tested.
- Alerts have owners, priority definitions, response times, and a tested incident communication procedure.

---

## Phase 11 — production readiness, soft launch, and optimization

**Purpose:** prove that the complete experience is accurate, fast, secure, and supportable before broad promotion.

**Build / test**

- Run content/data audit for every published station: address, navigation, access/hours, connector, price/fees/GST, support number, photos, structured data, and freshness timestamp.
- Test the driver journey with real people and real devices: search → station → directions → sign in → booking/payment (if enabled) → QR/start → live session → invoice → support.
- Test under poor connectivity, stale data, disconnected charger, occupied connector, payment timeout, and support escalation.
- Accessibility audit to a WCAG 2.2 AA target; security review of auth, object authorization, payment webhooks, staff roles, secrets, rate limiting, logs, and backup restore.
- Validate performance targets: LCP ≤2.5s, INP <200ms, CLS <0.1 on field-like mobile conditions. Defer/lazy-load everything that is not essential to finding a charger.
- Submit sitemap to Search Console, verify analytics/CRM attribution, set alerting, establish an on-call/support owner, and prepare rollback/runbook documentation.
- Soft-launch with a limited station/city cohort. Review real conversion, zero-result searches, stale-status rate, failed-start rate, support contact rate, and customer feedback before expanding.

**Exit gate**

- All launch claims are accurate; all critical workflows have an accountable support/operations owner.
- The website remains useful if GPS, map provider, payment provider, or live charger feed is unavailable.
- The first cohort’s issues are fixed before adding more cities, pages, chargers, or marketing spend.

---

## Recommended release boundaries

| Release | Includes | Best use |
|---|---|---|
| **A. Brand and lead website** | Phases 0–3 | A new operator building trust and collecting fleet/host leads. |
| **B. Driver discovery MVP** | Phases 0–6 | A live charging network needing station discovery, SEO, maps, transparent station information, and direction conversion. |
| **C. Driver transaction product** | Phases 0–8 | A network ready for accounts, booking policies, payments, invoices, and customer support. |
| **D. Connected charging platform** | Phases 0–11 | A network with tested OCPP/CSMS integration and operational staff to support real-time charging. |

Do not sell Release D as “just a website.” It includes financial, operational, hardware, security, and customer-support responsibilities.

## Suggested build order for Cursor IDE

```text
01  docs/phase-0-product-and-data.md
02  app/design-system/              ← internal component specimen
03  app/(public)/                   ← marketing pages and trust content
04  lib/stations + database/CMS     ← approved data source
05  app/find-charger + station page ← map/list and station experience
06  app/(content)/                  ← city, guide, route, SEO pages
07  app/(driver)/                   ← account and PWA
08  services/payments + booking
09  services/csms-ocpp + real-time
10  app/(ops)/                      ← protected operational portals
11  qa/, monitoring/, launch checklist
```

Use the existing `ev-charging-website-blueprint.md` as the master requirements document. Add a small `README` to each phase folder describing its scope, API contracts, components, tests, and exit gate. That discipline will preserve design consistency while the system becomes more complex.

## The next thing to do

Start with **Phase 0**, then spend the next sprint only on **Phase 1 and Phase 2**. The first coded feature should be the shared shell plus the station-status and station-card components—not the entire homepage and not the OCPP connection.
