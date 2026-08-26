# Plug and Go — Phase 1 reference screens

**Phase:** 1 — layout and behaviour specifications, not production pages  
**Components:** `docs/phase-1-component-specifications.md`  
**Tokens:** `docs/design-tokens.json`  
**MVP CTAs:** Find a charger / Get directions / Get support. **Book** and **Start charging** are absent until a future backend confirms they are possible.

Placeholder rule: unconfirmed cities, counts, prices, logos, photos, and support hours are **omitted** or labelled unpublished. Do not fill reference designs with demo availability shown as live.

QA viewports: 360, 390, 768, 1024, 1280, 1440.

---

## Shared chrome

- **Header** on all public screens. Skip link → main.
- **Footer** after main. No fake app badges.
- Sticky **Find a charger** on home mobile after hero scrolls away: compact, 48px, does not cover the last content paragraph (padding-bottom on `main`).

---

## A. Homepage `/`

### Intent

A driver understands the promise and can start a location search without scrolling through decoration. Fleet and host visitors can self-select without entering a driver-only funnel.

### Primary CTA

**Find a charger** (hero). Submits location (+ optional connector) to `/find-charger`.

### Secondary CTA

**Get support** (header Help / safety band). Audience cards: **Plan fleet charging**, **Check site eligibility**.

### Mobile layout order (360–767)

1. Compact header  
2. **Hero** (not a video): promise in `font.size.display` / `h1`: “Find a compatible charger. Know the price. Charge with confidence.” One short supporting line about honest status and prices — no coverage claim.  
3. Location **search/autocomplete**.  
4. Optional connector select (CCS2, Type 2, etc. only as filter values, not as inventory claims). Collapsed `<details>` “Connector (optional)”.  
5. **Use my location** as a text button under the field, with purpose copy.  
6. Primary **Find a charger**.  
7. **Trust strip** — only verified facts. If none: omit the strip. Do not show “X stations · Y cities · 24/7”.  
8. **Nearby preview** — real `StationCard`s from catalogue **or** empty state “Station list not public yet” + Contact. Horizontal snap scroll of cards, not a fake map.  
9. **How it works** — numbered 1–3, vertical. MVP-honest steps: Find a compatible charger → Check access and price → Get directions (and help if something is wrong). Do **not** show Scan / Pay / Start as current steps. A muted line may say later: “Booking and in-app start will be added when stations support them.”  
10. **Compatibility / pricing clarity** — short explainer: connectors and kW; tariff rows explained (energy, fees, GST, effective date). No calculator with invented rates. Link to `/pricing`.  
11. **Audience split** — stacked: Drivers (Find), Fleets, Hosts. Different copy and CTAs; not three identical bento cards. Drivers: utility. Fleets: consultation. Hosts: site eligibility.  
12. **Proof** — only real photos or omit. Caption with location type if approved. No logo wall.  
13. **Safety / support** — `SupportEscalation` without a station ID, plus link to `/safety`.  
14. **Guides** — if Phase 6 pages do not exist, one line links to `/pricing` and `/support` only. Do not fabricate an insights grid.  
15. Optional FAQ accordion (real answers only).  
16. Footer  

### Desktop layout order (1024+)

- Hero becomes **two columns inside 1200px container**: left = type + search stack; right = one large **real** station photograph (entrance/bay) with factual alt. If no photo: right column is a static wayfinding diagram (painted bay lines, not a car render) or is dropped and hero is single column.  
- Trust strip as a 12-column fact row (variable columns = number of true facts).  
- Nearby: 2–3 `StationCard`s in a grid, not a carousel.  
- How it works: three numbered columns **with unequal content length allowed** — not identical icon cards.  
- Compatibility: left copy, right sample `PriceBreakdown` using **labelled example formatting** only in staging, or a schematic of row names without rupee amounts until tariffs exist. Production: real tariff from a published station or omit amounts.  
- Audience: 3 columns at 1280; 1×3 stack below 1024. Visual weight: driver card uses a station thumbnail; fleet/host use typography + form preview, not charger photos, to avoid driver-flow confusion.  
- Proof + support: full-bleed warm inset photo band **only** with rights; otherwise skip.  
- Footer four columns.

### Loading

- Hero search usable immediately (static).  
- Nearby: three `StationCard` skeletons.  
- Do not skeleton fake Available chips in green.

### Error

- Nearby error panel + Retry; rest of marketing still visible.  
- Search error: field-level message.

### Empty

- No catalogue: hide Nearby or show empty state. Hero still searches (may zero-result).  
- No trust facts: no strip.  
- No photos: no proof section.

### Accessibility

- One `h1` (the promise).  
- Search labelled. Location button does not trap if permission denied.  
- Audience headings `h2`.  
- 44px targets. Contrast on hero if photo overlay: do not put small white text on a busy photo; keep text on paper, photo in the second column.

### Must use real data

- Any station in Nearby.  
- Any number, city, partner, payment method, or support hour.  
- Any photograph.

---

## B. Find charger `/find-charger`

### Intent

Go from a place to a compatible published station, understand status honestly, open a station or directions. **List is first-class.** Map is optional orientation.

### Primary CTA

On a result row: **View station**. From a selected card: **Get directions** (no login).

### Secondary CTA

**Filters**. **Get support** / report wrong data.

### Map / list relationship

| Viewport | Behaviour |
|---|---|
| 360–767 | **List first.** Search + chips + sort + result list. Map is **not** required. If a map exists later: a **Map** control opens a **bottom sheet** (~40–50% height) with the same results as pins; closing the sheet returns to the full list. Panning is optional. Selecting a pin highlights the same card in a short sheet list — the user is never forced to drag to find stations. |
| 768–1023 | Split: list 50% / map 50% **or** list still full width with map sheet. Prefer list+map side by side only if both remain usable (list not narrower than ~320px). |
| 1024+ | Left list 420–480px scroll; map fills remaining **container** (not a hidden list). Clicking a card selects the marker; clicking a marker scrolls/focuses the card. Keyboard users can ignore the map. |

**No drag-only interaction.** Radius can be a chip (2 / 5 / 10 km) or “This area” that uses map bounds **and** updates the list. If the map SDK fails, the list and address search remain complete.

### Mobile layout order

1. Header  
2. Search field (query from home)  
3. Use my location + permission copy  
4. Filter chips scroller + Filters button  
5. Sort control (button opening sheet)  
6. Result count in words: “{n} published stations” — not “live chargers” unless CSMS is live  
7. Alert if **Availability not live** for the whole network  
8. List of `StationCard`  
9. Optional map sheet control (fixed, above safe area)  
10. Footer optional / shortened on this tool page  

### Desktop layout order

1. Header  
2. Tool bar: search, location, filters, sort  
3. Split list | map  
4. Status/freshness legend (Available, In use, Faulted, Offline, Unknown, Stale) with chips — education, not decoration  

### States

**Loading:** list skeletons; map placeholder inset (no fake pins). Announce “Loading stations”.

**Location permission denied:** banner: “Location is off. Search by city, pincode, or landmark.” Search remains enabled. Do not block the page. Do not retry the browser prompt in a loop.

**Zero results:** empty state with reason (filters vs area). Actions: Clear filters, increase radius, Contact. Do not invent nearby cities.

**Stale status:** each card uses Stale chip + `DataFreshness`. Optional list banner: “Some statuses are stale.” Never relabel as Available.

**Offline:** error/retry panel at list top; cached list only if product later supports it (MVP: fail honestly). Directions links may still open native maps for a card already on screen.

**Map unavailable / slow:** hide map, keep sort and list. Message: “Map is unavailable. The list has the same stations.”

**Error:** retry panel; support card.

### Accessibility

- `h1`: “Find a charger”.  
- List in a `region` “Station results”.  
- Filters dialog labelled.  
- Sort: native select or listbox.  
- Live region for result count (polite).  
- Markers not the only path.

### Must use real data

- Stations, distances (if geocoded), connectors, tariffs, statuses, timestamps.  
- Filter options derived from data, not a hard-coded full connector universe.

---

## C. Station detail `/stations/[state]/[city]/[station-slug]`

### Intent

The conversion document: can I use it, can I get there, what does it cost, who helps. **Five-second scan:** status, freshness, connector, price honesty, primary action.

### Primary CTA

**Get directions** (Google/Apple + copy address). Works **without login**.

### Secondary CTA

**Report a problem** / **Get support**. Copy station ID.

**Book** / **Start charging:** **do not show** until backend confirms eligibility for that connector. If shown later: disabled when status is in use, faulted, offline, unknown, or stale.

### Mobile layout order (above the fold first)

1. Header  
2. Optional photo (entrance)  
3. `h1` station name  
4. **`AvailabilityChip` + `DataFreshness` immediately** (above the fold at 360px — photo may crop shorter if needed so status is visible without scroll)  
5. Sticky bottom bar: Get directions (primary), Support (icon+text)  
6. Address + `ArrivalInstructions`  
7. Connector / kW / compatibility / installed vs available counts (**available count only if statuses are fresh `available`**)  
8. `PriceBreakdown`  
9. Access, hours, restrictions, parking  
10. Amenities + accessibility notes (omit unknown groups)  
11. Safety notes + `SupportEscalation` (with `station_id`)  
12. Report a problem (form later in sheet)  
13. Nearby alternatives: real `StationCard`s only  
14. Station FAQs if maintained  
15. Footer  

Do not put a fake “Start charging” in the sticky bar for MVP.

### Desktop layout order (1024+)

- **Main (8 cols):** photo, name, status+freshness, arrival, connectors, tariff, access, amenities, safety, FAQ.  
- **Rail (4 cols, sticky below header):** Get directions, copy address, support card, price summary, connector stack. Rail does not hide status — status stays in main **and** is repeated in compact form in the rail.  
- Alternatives full width below.

### Loading

- Title skeleton; status skeleton **grey**; do not flash Available.  
- Sticky CTA: directions disabled until address loaded, then enabled.

### Error

- If station ID invalid: 404-style empty “This station is not published.” + Find a charger.  
- If station loads but tariff fails: Price not published + retry on that block only.

### Empty / unpublished fields

- No photo: placeholder.  
- No arrival notes: address + directions only.  
- No amenities: hide section.  
- No alternatives: hide, or “No other published stations nearby.”

### Stale / unknown / faulted / offline

- Chip + explanation sentence.  
- Directions remain.  
- Start/Book hidden or disabled (later).  
- Faulted: warning alert “Do not use this connector” + support.

### Accessibility

- `h1` unique name.  
- Status `role="status"`.  
- Directions links named with destination.  
- Sticky bar does not cover focusable content (padding-bottom).  
- Images alt factual.  
- Report form in dialog with labels.

### Must use real data

- All station facts, EVSE/connectors, tariff version, photos, support contacts, alternatives.  
- Structured data later must match visible text.

---

## D. Fleet / host landing section

Applies to `/solutions/fleets` and `/host-a-charger` (workplace follows the same pattern with different copy). This is **not** a clone of the home hero.

### Intent

A commercial visitor understands whether to talk to Plug and Go, without being pushed into Find a charger as the only goal.

### Primary CTA

- Fleets: **Plan fleet charging** (focuses the form).  
- Hosts: **Check site eligibility** (focuses the form).

### Secondary CTA

**Contact** or **Find a charger** as a quiet text link for visitors who arrived on the wrong page (“Looking for a charger for your car?”).

### Mobile layout order

1. Header  
2. **Business hero:** audience-specific `h1` (e.g. fleet operations vs property hosting). No location finder in the hero.  
3. Short positioning: what you will get from a conversation (assessment, not a fake SLA).  
4. **Proof** only if dated and permissioned; else skip.  
5. **Process** as a vertical numbered list (Enquire → Qualification → Site assessment → Contract) — stop at what is actually offered.  
6. **Form** (short): organisation/property, city, role, phone/email, optional vehicle count **range** or bay count, optional connector needs. No document upload.  
7. What happens next (no invented response SLA unless confirmed).  
8. Optional FAQ for that audience  
9. Quiet driver escape link  
10. Footer  

### Desktop layout order

- **Left (7 cols):** narrative, process, proof.  
- **Right (5 cols):** sticky form card.  
- Do not use station status chips as decoration on B2B pages.  
- Do not show a map of “coverage” without published stations.

### Loading / error / empty

- Page is mostly static CMS. Form: loading on submit; error/retry; success banner + empty form or “We have your request.”  
- Empty proof: omit.  
- Offline submit: error panel.

### Accessibility

- One `h1`. Form labels. Error summary on submit.  
- Driver escape is a link, not a competing primary button.

### Must use real data

- Any coverage map, utilisation %, revenue share, customer logos, case studies.  
- Form success must actually route to the confirmed inbox/CRM.

### Avoid driver-flow confusion

- No hero search.  
- No Available chips.  
- Primary button label is commercial, teal still used for submit.  
- Visual: more typography, less bay photography; one property/workplace photo only if rights exist.

---

## Cross-screen QA

Review each reference at 360, 390, 768, 1024, 1280, 1440; keyboard only; 200% zoom; reduced motion; greyscale (status still readable); slow network (skeletons, then honest errors).

**Five-second station test:** availability (words), last updated, connector + kW, price or “not published”, Get directions, help.

**Phase 1 does not implement these screens in code.**
