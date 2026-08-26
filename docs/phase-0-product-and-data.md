# Plug and Go — Phase 0: product and data foundations

**Phase:** 0 — product, content, and data decisions only  
**Product:** Plug and Go (India-focused EV charging network website and future driver platform)  
**Status:** Draft for client confirmation. No public claims, station inventory, prices, partners, or launch metrics have been approved.  
**Sources:** `ev-charging-website-blueprint.md` (workspace copy: `design.md`), `outputs/ev-charging-development-phases.md`  
**Out of scope for this phase:** UI, website pages, authentication, payment, map integration, OCPP charger control, and any live or demo availability presented as current.

This document records what Plug and Go will promise at first public release, who it is for, which pages exist in the product, which journeys are in MVP, and which facts still require a named business owner.

---

## 1. Product promise

> **Find a compatible charger. Know the price. Charge with confidence.**

This is a proof-based promise, not a marketing slogan. Each clause has a product meaning:

| Clause | What the product must make true | What it must not do |
|---|---|---|
| Find a compatible charger | A visitor can search by location and see whether a station’s connector and power match their vehicle, using approved catalogue data. | Do not imply nationwide coverage, “a charger near everyone”, or compatibility that is not in the station record. |
| Know the price | A visitor can see an approved, dated tariff breakdown before they travel: energy, service fee, parking/idle/reservation fee, GST, and discount. | Do not invent rates, hard-code policy figures, or show an undated “from ₹…” price. If a tariff is missing, say that the price is not published yet. |
| Charge with confidence | A visitor can judge access rules, hours, arrival instructions, data freshness, and how to get help. | Do not show stale or unknown status as Available. Do not claim uptime, safety certification, 24/7 support, or “charge now” unless operations can honour it. |

The first conversion action recommended for MVP is **Get directions** (with **Enquire** / **Get support** as the fallback). **Book** and **Start charging** are later-scope actions and must not appear as available until booking operations and CSMS/OCPP readiness are confirmed.

---

## 2. Primary users

| User | Job to be done | MVP relationship | Later relationship |
|---|---|---|---|
| EV driver | Find a compatible station, understand access and price, get there, get help if something is wrong. | Public discovery and station detail; directions; support/report form. No account required. | Account, saved vehicle/stations, booking, payment, live session, invoice. |
| Fleet manager | Judge whether the network can support a vehicle fleet and start a qualified conversation. | Solutions page and consultation/lead form. | Fleet portal, driver access, cost centres, reporting, invoicing. |
| Property / host partner | Understand whether a site can host charging and request assessment. | Host landing page and qualified lead form. | Host portal, assigned sites, utilisation/revenue as contracted. |
| Support / operator | Keep published facts honest and resolve driver/host problems. | Receive tickets/leads; own station-data verification (process, not a portal). | Operator, technician, support, and finance portals; CSMS; refunds. |

Existing hosts and technicians are recognised users of the full platform. They are not MVP website users beyond the public host lead path and the support intake path.

---

## 3. Release boundary

### 3.1 MVP (first public product)

Public brand website + station discovery + station detail + support/lead forms.

A visitor at launch should be able to:

1. Understand what Plug and Go is and what it does **not** yet offer.
2. Search or browse published stations (list is first-class; a map may be added in a later discovery phase without changing this boundary).
3. Open a station page and see approved facts: location, access, connectors, tariff (if published), photos, support route, and data freshness.
4. Get directions or copy the address.
5. Contact support, report a data/access problem, or submit a fleet/host/workplace lead.

MVP does **not** include login, booking, payment, invoices, live charger control, or staff portals.

### 3.2 Later scope

| Area | Included later | Why it waits |
|---|---|---|
| Driver account / PWA | OTP sign-in, vehicles, saved stations, tickets, installable app shell | Discovery must work without an account. |
| Booking | Reservation, queue, waitlist, no-show rules | Only if operations can honour a reservation. |
| Payment and invoices | UPI/card/wallet via gateway, webhook verification, refunds, GST invoices | Financial and legal readiness required. |
| Live availability from chargers | Normalised CSMS events on the public station page | Requires confirmed OCPP version, vendor access, and a test charger. |
| OCPP / CSMS | Remote start/stop, meter, session, device health | Separate operational/hardware contract; never a public-site feature. |
| Operator portal | Station health, overrides, command log, support queue | Needs roles, MFA, and an accountable ops owner. |
| Host / fleet portals | Contracted reporting and access | Needs signed commercial model. |
| SEO city/route/guide engine | Maintained city, route, and editorial pages | Only where real inventory and a reviewer exist. |

### 3.3 Not needed (do not build)

- Public or browser-direct charger control.
- Native iOS/Android apps before the web/PWA path is proven.
- Mass-generated empty city, area, station, or route pages.
- Invented reviews, partner logos, customer names, uptime percentages, or undated counters.
- Availability labelled **Available** when the status is Unknown, Stale, Offline, Faulted, or missing a freshness timestamp.
- Autoplay hero video, chat widgets, or other third-party extras that delay the first useful action.
- `/status` as a live operations board unless a named owner will keep it current.

---

## 4. Sitemap

Legend: **MVP** = first public release; **Later** = planned after MVP exit; **Not needed** = out of product unless a later decision reverses it.

### 4.1 Public, indexable

| Route | Purpose | Scope | Primary CTA |
|---|---|---|---|
| `/` | Brand promise, finder entry, how-it-works, audience split, support path | **MVP** | Find a charger |
| `/find-charger` | Location search; accessible list; filters; freshness; optional map in a later discovery slice | **MVP** | View station / Get directions |
| `/stations/[state]/[city]/[station-slug]` | Station conversion page: facts, access, connectors, tariff, photos, help | **MVP** | Get directions / Get support |
| `/about` | Legal identity, what the network is, what is not yet offered | **MVP** | Contact / Find a charger |
| `/contact` | Real contact path and hours (only if confirmed) | **MVP** | Send message |
| `/support` | Help routes: cannot charge, wrong data, access issue, fleet/host enquiry | **MVP** | Open support / Report a problem |
| `/safety` | User safety steps, emergency/support contacts if confirmed, report-fault path | **MVP** | Get support |
| `/pricing` | How pricing is explained (energy, fees, GST, effective date). No invented rates. | **MVP** | Find a charger / Enquire |
| `/host-a-charger` | Host eligibility narrative and qualified lead form | **MVP** | Check site eligibility |
| `/solutions/fleets` | Fleet conversation starter and qualified lead form | **MVP** | Plan fleet charging |
| `/solutions/workplace` | Workplace/visitor charging conversation and lead form | **MVP** | Talk to an expert |
| `/legal/privacy` | Privacy notice and rights/grievance route | **MVP** | Contact / grievance |
| `/legal/terms` | Website and (later) service terms | **MVP** | Contact |
| `/legal/grievance` | Grievance officer / complaint route | **MVP** | File grievance |
| `/legal/accessibility` | Accessibility statement and contact | **MVP** | Contact |
| `/legal/refunds` | Refund/cancellation policy | **Later** | Contact support |
| `/how-to-charge` | First-charge guide | **Later** | Find a charger |
| `/connector-guide` | Connector and kW explainer | **Later** | Find compatible charger |
| `/ev-charging/[city]` | City landing with real local inventory only | **Later** | View stations |
| `/routes/[origin]-to-[destination]` | Maintained route with compatible stops | **Later** | Plan the route |
| `/insights/*` | Expert-reviewed guides | **Later** | Related station / guide |
| `/status` | Public incident/status board | **Not needed** until a named operations owner exists; then **Later** | View incidents |

Home may include a short how-it-works and connector/price explainer. Dedicated education and city/route SEO pages wait until there is real inventory and a content reviewer.

### 4.2 Authenticated, non-indexable

All of the following are **Later**, `noindex`, and strongly authorised. None are in MVP.

| Route | Purpose |
|---|---|
| `/login` | Driver or staff sign-in |
| `/account` | Driver profile and preferences |
| `/vehicles` | Saved vehicle / connector profile |
| `/saved-stations` | Favourites |
| `/bookings` | Reservations / queue |
| `/session/[id]` | Live or past charging session |
| `/payments` | Payment methods and attempts |
| `/invoices` | Tax invoices and history |
| `/support/tickets` | Authenticated ticket thread |
| `/partner` | Host portal |
| `/admin` | Content and catalogue administration |
| `/operator` | Network operations |
| `/technician` | Assigned incident workspace |

QR or session URLs must never be public search results. A QR must not start a charge or booking by itself.

### 4.3 Page ownership (roles, not named people)

Named owners are still required from the client. Until then, accountability is by role:

| Page class | Accountable role | Data dependency |
|---|---|---|
| Brand, about, home copy | Content manager + business owner | Legal entity name, proof assets |
| Station list and station pages | Station data owner (host or operator) | Approved station records |
| Pricing page | Finance / operator | Versioned tariffs |
| Support, safety, contact | Support lead | Real phone/email/hours |
| Legal pages | Legal / compliance | Policies, GST, grievance officer |
| Fleet / host / workplace | Partnerships / sales | Lead routing and SLA |
| Later account, pay, OCPP surfaces | Product + operations | Confirmed vendors and test charger |

A page must not be published if its required facts are unknown.

---

## 5. Core user journeys

Journeys below describe intended product behaviour. They are not evidence that stations, prices, or partners already exist.

### 5.1 EV driver

**MVP path**

```text
Search / referral / QR (catalogue only)
  → Home or /find-charger (city, pincode, landmark, or optional location with consent)
  → Filter by connector / power / access if those fields are populated
  → Station list (usable without a map)
  → Station page: compatibility, access, hours, tariff if published, photos, freshness
  → Get directions or copy address
  → If something is wrong: Report a problem / Contact support (station ID attached)
```

**MVP unhappy paths (must be designed before the finder is called complete)**

| Situation | Honest behaviour |
|---|---|
| Location permission denied | Continue with city / pincode / landmark. Do not block search. |
| No published stations in range | Say so; offer a wider area or contact path. Do not invent nearby sites. |
| Tariff not yet approved | Show “Price not published” and the enquiry/support path. Do not guess. |
| Status Unknown or Stale | Show the timestamp and a neutral state. Never show Available. |
| Connector occupied, faulted, or offline | Say so; disable start/book if those CTAs exist later; offer alternatives only if they are real published stations. |
| Map unavailable or slow network | Keep the full list and textual address/directions usable. |

**Later path (not in this phase)**

```text
Station page → Book or Start charging
  → OTP at commitment
  → Payment authorisation if required
  → Scan QR / select connector
  → Live session (only after charger/session evidence)
  → Invoice, feedback, saved favourite
```

Error states for later: payment pending, start rejected, internet loss, emergency support, refund.

### 5.2 Fleet manager

**MVP path**

```text
/solutions/fleets
  → Coverage and charging model only if those facts are confirmed
  → Short consultation form (organisation, city, vehicle count range, connector needs, contact)
  → Confirmation screen
  → Internal routing to CRM or inbox (owner and SLA still required)
```

Do not show SLA, uptime methodology, driver access controls, or fleet invoicing until those capabilities exist.

**Later path:** authenticated fleet portal, cost centres, reporting, contracted pricing.

### 5.3 Property / host partner

**MVP path**

```text
/host-a-charger
  → Eligibility and host responsibilities (only confirmed facts)
  → Short lead form: city, property type, parking bays, power/load if known, ownership authority, contact
  → Confirmation screen
  → Qualification by partnerships (documents requested only after qualification)
```

**Later path:** site assessment, contract, onboarding, host portal for assigned sites and contracted revenue/utilisation.

---

## 6. Content and data inventory

Station, tariff, availability, and ticket records are defined in `docs/station-data-schema.md`. Phase 0 does not populate them with live or sample-as-live data.

| Inventory item | Needed for MVP? | Current state | Owner required? |
|---|---|---|---|
| Legal entity name, registered address | Yes | Unconfirmed | Yes |
| GSTIN, support phone/email, grievance officer | Yes | Unconfirmed | Yes |
| Privacy, terms, grievance copy | Yes | Unconfirmed | Yes |
| Brand assets (logo, colours, real photos) | Yes | Unconfirmed | Yes |
| Approved station catalogue | Yes, if finder is public | Unconfirmed | Yes |
| Versioned tariffs per station/connector | Yes, if “know the price” is claimed on a station | Unconfirmed | Yes |
| Real station photographs with permission | Yes for each published station | Unconfirmed | Yes |
| Partner logos / case studies / reviews | No, unless proof and permission exist | Do not invent | Yes, if used |
| Maps, SMS, payment, CRM, hosting, domain | Vendor choices | Unconfirmed | Yes |
| OCPP / CSMS / test charger | Later (live charging) | Unconfirmed; must be known before any start-charge promise | Yes |

Until a station record is approved, the public finder should be labelled as coming soon or limited to unpublished preview on staging — not filled with demo availability presented as live.

---

## 7. Success metrics and event names

Do not treat the following as current performance. No baseline, target percentage, or volume is known. Instrument only after a valid consent/privacy path exists.

### 7.1 MVP outcome metrics

| Metric | Meaning | Event or source |
|---|---|---|
| Finder searches | Visitor attempted a location or text search | `location_search` |
| Filter use | Visitor applied connector, power, access, or similar filter | `filter_applied` |
| Station views | Visitor opened a station detail page | `station_viewed` |
| Directions | Visitor opened maps or copied the address | `directions_clicked` |
| Support opened | Visitor opened help/report from site or station page | `support_opened` |
| Support ticket created | Form submitted with station/session context where available | `ticket_created` |
| Host lead started / submitted | Host form begun / completed | `host_lead_started`, `host_lead_qualified` (qualified is a staff outcome, not a form click) |
| Fleet lead started / submitted | Fleet form begun / completed | `fleet_lead_started`; qualification uses `lead_qualified` with audience = fleet |
| Workplace lead started | Workplace form begun | `workplace_lead_started` |
| Zero-result searches | Searches that returned no published stations | Derived from `location_search` result count |
| Station-data freshness | Share of published stations with `last_verified_at` inside the (still unconfirmed) verification policy | Catalogue timestamps |
| Stale-as-available incidents | Times public UI/API showed Available for Unknown or Stale | Must remain **zero** |
| Lead follow-up | Qualified leads with an owner and response | CRM or inbox process (owner TBA) |

Engineering quality bars from the project blueprint (not Plug and Go business KPIs): LCP ≤ 2.5 s, INP < 200 ms, CLS < 0.1 on field-like mobile conditions. Measure after pages exist; do not report them as current.

### 7.2 Canonical event names

Use these names when analytics is implemented. Do not fire marketing pixels before consent.

**MVP (define now, implement when the site exists)**

```text
location_search
filter_applied
station_viewed
directions_clicked
lead_started
lead_qualified
support_opened
ticket_created
host_lead_started
host_lead_qualified
fleet_lead_started
workplace_lead_started
```

**Later (name reserved; do not implement in MVP)**

```text
signup_completed
booking_started
payment_started
payment_succeeded
charge_requested
charge_started
charge_completed
review_submitted
```

`lead_started` / `lead_qualified` should carry an `audience` property (`driver` | `fleet` | `host` | `workplace` | `other`) so one schema covers all forms.

### 7.3 Events that are not success

Page views, bounce rate, and social followers are not launch success measures. Rankings are not guaranteed. Do not publish “trusted by…”, session counts, or uptime without a dated operational source.

---

## 8. Must / Should / Later backlog (Phase 0 planning)

Every item needs a business reason. Acceptance is documentary in this phase (no UI).

### Must (block public launch if missing)

| Item | Business reason | Acceptance |
|---|---|---|
| Confirm MVP vs later boundary with the client | Stops selling booking/OCPP as a website | Client signs the boundary in this document |
| Name a station-data owner per published station | Prevents mystery fields and fake live states | Owner recorded on each station record |
| Station schema and status rules | One source of truth for facts, tariffs, events | `docs/station-data-schema.md` approved |
| Legal identity, support contact, privacy/terms/grievance | Trust and compliance baseline | Copy and contacts confirmed |
| First conversion = directions or enquire, not start charge | Hardware path is unconfirmed | No start-charge CTA in MVP sitemap |
| Honest empty/stale/unknown rules | Trust before persuasion | Written rule: never show Stale/Unknown as Available |

### Should (stronger MVP, not hardware)

| Item | Business reason | Acceptance |
|---|---|---|
| Real station photos with permission | Arrival recognition | Photo types and rights recorded |
| Published tariff versions where price is shown | “Know the price” | Breakdown + effective date + approver |
| Lead routing owner and response expectation | Forms that nobody reads waste demand | Named inbox/CRM owner |
| Language decision for launch | Avoid unreviewed machine translation | Languages listed in open questions |

### Later

Account, booking, payment, invoices, map-rich finder (if not in discovery MVP slice), city/route SEO, OCPP/CSMS, operator/host/fleet portals.

---

## 9. Assumptions

These are working assumptions, not confirmed facts. If any is wrong, the MVP sitemap or promise must change before build.

1. Plug and Go is, or intends to be, a charging-point operator (or contracted operator) of physical stations in India — not only a brochure site. If it is lead-generation only, station discovery must be withheld or clearly labelled until a catalogue exists.
2. The legal brand name, domain, GST registration, and support identity will be supplied by the client. None are assumed here.
3. MVP can launch without driver accounts, payments, or OCPP. Live “Available” from chargers is not required for a catalogue launch if status is Unknown/Stale and labelled as such — but then the product must not promise live availability.
4. The primary launch conversion is **Get directions**. Booking and remote start are later and may never apply to every site.
5. Station facts, tariffs, and availability events remain separate records (see schema). They will not be collapsed into one “station status” field.
6. Public pages will be server-rendered in a later engineering phase; this document does not choose a stack beyond the blueprint recommendation (Next.js + TypeScript) as a future default.
7. Maps, payment, SMS/OTP, CRM, and hosting vendors are undecided. No vendor is selected in Phase 0.
8. Hindi or other Indian languages are not assumed at launch. English-only is possible until the client confirms.
9. Ministry of Power / BEE EVCI 2024 informs the **kind** of information a station page should be able to hold (location, access, connector, fees, payment/auth, support). It is not a claim that Plug and Go is compliant, licensed, or live under any tender.
10. No competitor, host brand, OEM, DISCOM, or customer relationship is implied.
11. Tariff parameters in public policy (including time-limited service-charge or solar-hour provisions) will not be hard-coded as Plug and Go prices.
12. `/status` is omitted until operations can update it.

---

## 10. Questions that require business confirmation

The full client questionnaire is `docs/phase-0-open-questions.md`. These items **block** an honest public launch or a later “start charging” promise:

| ID | Question | Blocks |
|---|---|---|
| Q-01 | Target cities and launch date | Coverage copy, sitemap city pages |
| Q-02 | How many stations at launch, and which connector types | Finder, compatibility |
| Q-03 | Is station data real today, and who owns updates? | Catalogue vs “coming soon” |
| Q-04 | OCPP version, charger brand, CSMS access, test charger | Any start-charge or live-availability claim |
| Q-05 | Maps, payment, SMS/OTP, CRM, hosting, domain, support contact | Vendors and legal pages |
| Q-06 | Legal entity, GST, privacy/refund/grievance policies | MVP legal/trust pages |
| Q-07 | Real brand assets, station photos, proof, partner permissions | Imagery and proof |
| Q-08 | Languages required at launch | Content model and `hreflang` |
| Q-09 | First conversion action: directions, enquire, book, or start charging | CTAs on station pages |
| Q-10 | Verification cadence and stale threshold for availability | Status display rules |

Do not proceed to UI (Phase 1) as if these were answered. Phase 1 may start in parallel on visual language only if it uses labelled placeholder content and does not publish fake stations.

---

## 11. Phase 0 exit gate

Phase 0 is complete when all of the following are true:

1. The client can state what a visitor can do at launch and what is intentionally unavailable.
2. Every planned published station has an accountable data owner; unknown fields stay unknown.
3. Charger brand, OCPP version, CSMS/vendor access, and test-charger availability are recorded before any start-charging promise is sold.
4. This document, `docs/station-data-schema.md`, and `docs/phase-0-open-questions.md` are the working product contract for later phases.

**Still open:** see Section 10 and `docs/phase-0-open-questions.md`. Until the questionnaire is answered, Plug and Go must not publish coverage, pricing, availability, partner, or launch-date claims.
