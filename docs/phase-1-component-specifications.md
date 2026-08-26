# Plug and Go — Phase 1 component specifications

**Phase:** 1 — specification only; no production components  
**Tokens:** `docs/design-tokens.json`  
**Visual law:** `docs/phase-1-brand-and-design-system.md`  
**Data law:** never show `stale` or `unknown` as Available. Missing prices: “Price not published.”

Interactive components document these states **where they apply:** default, hover, focus-visible, active, disabled, loading, error, empty, unavailable/offline, mobile.

Shared interaction rules:

- Hover: pointer-only; not required on touch.
- Focus-visible: 3px `color.focus.ring`, 2px offset. Civic blue, never status green.
- Active: pressed colour (`color.action.primaryActive` or ink equivalent).
- Disabled: `color.text.disabled`, no pointer events, `aria-disabled`.
- Loading: keep control size; spinner 20px; announce with `aria-busy`.
- Reduced motion: no transform fly-ins.

---

## 1. Header and mobile navigation

**Purpose:** Persistent wayfinding. Driver can reach Find a charger in one tap.

**Appearance**

- Height: `size.header.heightMobile` / `size.header.heightDesktop`.
- Surface: `color.surface.default`, bottom `border.width.default`.
- Left: wordmark “Plug and Go” (or approved logo later) → `/`.
- Desktop nav: Find a charger, Solutions (Fleets, Workplace, Host a charger), Help (Support, Safety, Contact). Learn omitted until guide pages exist.
- Right: primary button **Find a charger** (`size.button.heightSm` on desktop header if needed, still ≥44px).
- Mobile: wordmark + **Find a charger** text button or icon+text, plus menu button `aria-label="Open menu"`.

**Content rules**

- No login in MVP. Do not show account ghost CTAs.
- Do not claim city count in the header.

**Mobile behaviour**

- Menu opens a full-height drawer (`z.drawer`) with the same links, 44px rows, focus trapped, Esc and overlay click close.
- Sticky header; does not hide the primary CTA behind the drawer chrome.
- Persistent Find control stays visible on home scroll; use compact header, not a second fat banner that covers content.

**States**

| State | Behaviour |
|---|---|
| Default | Border-bottom, opaque surface. |
| Hover | Nav links underline 1px ink; button uses primary hover. |
| Focus-visible | Ring on logo, links, buttons, menu. |
| Active | Pressed button/link. |
| Disabled | N/A for nav links. |
| Loading | Avoid replacing whole header; route change can use small progress on `main` only. |
| Error | If menu fails to render, keep Find a charger link in the bar. |
| Empty | N/A. |
| Unavailable/offline | Header still works; finder pages handle data. |
| Mobile | Hamburger + drawer; Find a charger always in bar. |

**Accessibility:** `banner` landmark; `nav` labelled “Primary”. Menu button `aria-expanded`. First focusable: skip link “Skip to station search” or “Skip to main”.

---

## 2. Footer

**Purpose:** Legal identity, help, policies. Calm ink band.

**Appearance**

- Background `color.surface.inverse`, text `color.text.inverse`.
- Mobile: stacked columns. Desktop: 12-column — brand/legal, drivers, solutions, legal links.
- Support phone/email only if confirmed. GST/legal name only if confirmed. Else omit the line; do not invent.

**Content rules**

- Links: Support, Safety, Contact, Privacy, Terms, Grievance, Accessibility.
- Language selector only if a second reviewed language exists.
- No fake social proof, app-store badges, or partner logo rows.

**States**

| State | Behaviour |
|---|---|
| Default | Inverse band, 1px top border `color.ink.muted`. |
| Hover / focus-visible | Inverse links with underline; focus ring uses light offset on dark (`color.text.inverse` ring or 3px `#FAF7F2`). |
| Active | Opacity 0.85. |
| Disabled | N/A. |
| Loading | Footer is static. |
| Error / empty | If legal entity unknown, show only “Plug and Go” and policy placeholders marked unpublished — or hide GST block. |
| Unavailable/offline | Still readable. |
| Mobile | Stack; 16px gutters; large tap links. |

**Accessibility:** `contentinfo`. Contrast AA on inverse. Do not rely on teal links on ink without checking contrast — use `color.text.inverse` links with underline.

---

## 3. Buttons (primary, secondary, outline, destructive)

**Appearance**

- Height `size.button.height` (48px), padding-x `size.button.paddingX`, radius `radius.md`, label IBM Plex Sans Medium 16px.
- Primary: fill `color.action.primary`, text `color.action.onPrimary`.
- Secondary: fill `color.action.secondary`, text `color.action.onSecondary`.
- Outline: transparent, border 2px `color.action.outlineBorder`, text ink.
- Destructive: fill `color.action.destructive` — report unsafe fault, delete later; not for Get directions.

**Content:** Sentence case. One primary per view cluster. Icon optional, 20px, 8px gap.

**Mobile:** Full-width in forms and station sticky bar. Inline in cards if two actions: primary full width, outline full width below (`spacing.2` gap). Min 44px.

**States (all variants)**

| State | Behaviour |
|---|---|
| Default | As above. |
| Hover | Darken fill or strengthen outline (`primaryHover` / ink hover). |
| Focus-visible | Focus ring; do not remove outline. |
| Active | `primaryActive` / darker ink / darker red. |
| Disabled | `primaryDisabled` or 40% opacity; no hover. |
| Loading | Spinner replaces icon or sits left of unchanged label; button disabled; keep width. |
| Error | Buttons do not show field errors; they may be disabled until valid. |
| Empty | N/A. |
| Unavailable/offline | Primary **Start charging** / **Book** is **not rendered** until backend allows. If rendered later and connector unavailable: disabled + text “Not available”. |
| Mobile | 48px height; no hover requirement. |

**Accessibility:** Real `<button>` or `<a>` styled as button. Loading: `aria-busy="true"`. Disabled: not focusable **or** focusable with reason (prefer not focusable). Destructive needs confirm in a dialog for irreversible acts.

---

## 4. Text links

**Appearance:** `color.text.link`, underline on hover and always underline in body copy. 16px minimum.

**States:** default; hover (`linkHover`); focus-visible ring; active darker; disabled grey; loading N/A (use button if action pending); error N/A; empty N/A; unavailable: visually same, `aria-disabled` if the route is later-scope (prefer hide). Mobile: 44px hit by padding.

**Content:** Do not use “Click here”. Use “Get directions”, “Read access rules”.

---

## 5. Search / autocomplete field

**Purpose:** City, pincode, landmark, or address. Optional “Use my location”.

**Appearance**

- Height 48px, radius `radius.md`, border `color.border.default`, surface `color.surface.default`.
- Leading search icon 20px `color.text.tertiary`.
- Placeholder: “City, pincode, or landmark”.
- Autocomplete list: `z.dropdown`, `shadow.md`, max-height 280px, 48px rows.

**Content rules**

- Do not prefetch fake cities. Suggestions from geocoder or published city list only.
- Location permission: explain *why* before the browser prompt: “Used to sort nearby stations. You can type a city instead.”

**Mobile:** Field full width in hero and finder. Suggestions are a list, not a map-only picker.

**States**

| State | Behaviour |
|---|---|
| Default | Empty field, placeholder. |
| Hover | Border `color.border.strong`. |
| Focus-visible | Ring + border `color.focus.ring`. |
| Active | Caret; list open if query ≥ 1 character or on focus if published cities exist. |
| Disabled | Inset fill, no input. |
| Loading | Small spinner in field; `aria-busy`. List shows 3 skeleton rows. |
| Error | Border `color.error.fg`; message “We could not search. Try a city name.” + Retry. |
| Empty | “No matching places. Try a pincode or city.” Does not invent stations. |
| Unavailable/offline | Message “Search needs a connection. Type a city if you already know it.” Keep submit for known query. |
| Mobile | Virtual keyboard; list below field; 44px+ rows. |

**Accessibility:** `<label>` visible (“Location”). Combobox pattern: `role="combobox"`, `aria-expanded`, `aria-controls`, active descendant. Permission denied is **not** an error on the field — see finder screen.

---

## 6. Filter chips and filter drawer

**Purpose:** Connector, power band, access type, amenities — only facets that exist in data.

**Chips**

- Height `size.chip.height`, radius `radius.md` (filters) not pill (pills reserved for status).
- Unselected: outline border, ink text. Selected: `color.action.subtle` fill + teal text.
- Trailing × on selected to clear.

**Drawer (mobile)**

- Bottom sheet or side drawer, title “Filters”, Apply / Clear all.
- Sort lives here on mobile: Nearest, Available first, Fastest kW, Price (price sort **disabled** if any visible station has unpublished tariff).

**States**

| State | Chip / drawer |
|---|---|
| Default | Unselected. |
| Hover | Border strong. |
| Focus-visible | Ring. |
| Active | Pressed. |
| Disabled | Facet with zero published stations: hidden, not disabled-and-confusing. |
| Loading | Chips in skeleton. |
| Error | Drawer: “Filters could not load.” Retry. |
| Empty | No facets → hide the filter bar. |
| Unavailable/offline | Applied filters remain; refreshing list shows offline panel. |
| Mobile | Horizontal chip scroller + “Filters” button opening drawer. No drag-only map filters. |

**Accessibility:** Chips are toggle buttons `aria-pressed`. Drawer: `role="dialog"`, focus trap, Esc.

---

## 7. Station card (`StationCard`)

**Signature component.** Used on home preview, finder list, alternatives.

**Content (all from catalogue; omit if unknown)**

1. Optional 4:3 photo or “Photo not published”
2. Name (`h3`)
3. Distance if known (Mono, km) — else city/locality
4. `AvailabilityChip` + `DataFreshness` on one row
5. `ConnectorBadge`(s) — do not wrap more than two; “+N more”
6. Price line: energy ₹/kWh **or** “Price not published”
7. Access one-liner (hours or “Restricted access”)
8. Primary: **View station** (list) or **Get directions** (if already on a detail-lite). Finder list primary = View station.

**Appearance:** `radius.card`, 1px border, padding `spacing.4`. No shadow at rest. Selected in list: `border.width.strong` ink.

**Mobile:** Full width. Photo 16:9 crop max 160px tall. Actions stacked.

**States**

| State | Behaviour |
|---|---|
| Default | Border default. |
| Hover | Border strong; not a lift-off glass effect. |
| Focus-visible | Whole card focusable if it’s a single link; or focus on inner buttons. Prefer one wrapping `<a>` plus separate directions as a nested control with stopPropagation rules documented in Phase 2. |
| Active | Inset fill `color.surface.inset` briefly. |
| Disabled | N/A; unpublished stations are not listed. |
| Loading | `Loading skeleton` matching card geometry. |
| Error | Replace card with inline error if a single card failed; prefer list-level error. |
| Empty | Not a card; parent empty state. |
| Unavailable/offline | Card still shows; status chip is Offline/Unknown/Stale — **not** Available. Directions still work. |
| Mobile | 44px+ action; no hover. |

**Accessibility:** Name is the accessible name. Status text is in the accessibility tree (not colour only). Distance and kW in Mono but still read as text.

---

## 8. Availability / status chip (`AvailabilityChip`)

**Required:** icon + label. Colour from status tokens.

| Public status | Label | Colour tokens |
|---|---|---|
| `available` | Available | available / availableBg |
| `in_use` | In use | limited / limitedBg |
| `faulted` | Faulted | faulted / faultedBg |
| `offline` | Offline | offline / offlineBg |
| `unknown` | Unknown | offline / offlineBg |
| `stale` | Stale | offline / offlineBg |

Height 32px, `radius.pill`, 12px Medium label, 16px icon.

**States:** default; hover N/A (non-interactive by default); if used as filter, then hover/focus/active as chips; disabled N/A; loading: grey pill “Status…”; error: show Unknown; empty: do not render a green empty chip; unavailable/offline: grey labels as table; mobile: wrap, never truncate the word **Stale** or **Unknown** to an icon.

**Accessibility:** `role="status"` when live. Include freshness in the accessible description when adjacent `DataFreshness` exists (`aria-describedby`).

---

## 9. Connector badge (`ConnectorBadge`)

- Outline cardette: type label (Sans Medium) + `max kW` in **IBM Plex Mono**.
- Types shown as recorded (`CCS2`, `Type 2`, etc.). No guessed equivalents.
- Optional count: `2 installed` in small text.

**States:** default; hover N/A unless filter; focus if interactive; disabled when planned not installed (`Planned` label, muted); loading skeleton 72×32; error hide; empty hide; unavailable: badge remains, status lives on chip not on badge; mobile: wrap row.

---

## 10. Tariff / price breakdown (`PriceBreakdown`)

**Rows (show only lines that apply):** Energy ₹/kWh; Service fee; Parking; Idle (plus grace minutes); Reservation (later); GST; Discount; **Estimated total** only if enough inputs exist.

Footer: `Effective from {date}` in Mono. Disclaimer: “Estimate — final amount may differ.”

If no approved tariff: single honest row **Price not published** + link Enquire / Support. Do **not** show ₹0 or a fake “from” price.

**States:** default; hover N/A; focus on “How this is calculated” if accordion; disabled N/A; loading skeleton rows; error “Price could not be loaded”; empty = not published; unavailable/offline same as empty if tariff fetch fails — do not keep an old rate without `effective_from` and freshness; mobile: stacked rows, amounts right-aligned Mono.

**Accessibility:** Table or definition list. Numbers `tnum`. Do not use colour alone for discount (prefix “−”).

---

## 11. Data freshness (`DataFreshness`)

- Copy: `Last updated {relative}` and optionally `{HH:mm IST}`.
- Mono 14px, `color.text.tertiary`.
- If stale: warning colour + prefix **Stale**.
- If unknown: **Availability not live**.

**States:** default; hover if tooltip with `last_verified_at`; focus-visible on tooltip trigger; disabled N/A; loading “Checking…”; error “Update time unknown”; empty hide rather than fake “just now”; unavailable/offline: show last known timestamp or Unknown; mobile: one line, wrap allowed.

Never display “Live” unless CSMS freshness is confirmed later.

---

## 12. Map marker

**Purpose:** Orientation on a future map. Not required for MVP list-first, but specified so markers never contradict cards.

- 32px circle, 2px paper stroke, inner status colour **plus** a letter/icon (A = available, etc.) — still not colour-only.
- Selected: 40px, ink ring.
- Cluster: ink circle + count in Mono.

**States:** default; hover pointer scale 1.05 (`motion.fast`, skipped if reduced motion); focus-visible for keyboard map later; active selected; disabled N/A; loading grey marker; error hide map, keep list; empty no markers; unavailable/offline grey marker with U/S letter; mobile: tap opens card in sheet — **panning the map is optional**, list remains complete. **No drag-only** selection.

**Accessibility:** Markers are supplementary. List items are the accessible navigation. If markers are in tab order, each has `aria-label` “{Name}, {status}, {kW}”.

---

## 13. Empty state

**Appearance:** Inset surface, 24px padding, heading `h3`, body, one primary + optional outline. No 3D illustration. Optional simple line icon (24px).

**Copy patterns**

- Zero stations: “No published stations match this search.” Actions: Clear filters / Widen search / Contact us.
- No photo: “Photo not published.”
- Finder coming soon (no catalogue): “Station list is not public yet.” CTA: Get notified / Contact.

**States:** this *is* the empty state. Hover/focus on its CTAs. Loading should not look empty (use skeleton). Error is a different component. Offline: use error/retry or a dedicated offline empty: “You’re offline. Saved search isn’t available yet.”

**Mobile:** CTAs full width.

---

## 14. Loading skeleton

- `color.surface.inset` bars, `radius.sm`, no random widths that jump layout.
- Pulse opacity 0.6–1 over 1.2s; **disabled** when `prefers-reduced-motion`.
- Match StationCard / form / hero search geometry.

**States:** loading-only. If error, swap to Error panel. Never skeleton a status chip as green.

---

## 15. Error / retry panel

- Icon + title + body + **Retry** primary + Support outline.
- Border `color.error.border`, bg `color.error.bg` for system errors; use canvas+border for page-level so it’s not aggressive on full pages.

**Copy:** “We could not load stations.” Not “Oops.”

**States:** default; hover/focus/active on Retry; disabled Retry while `aria-busy`; loading on retry; error is itself; empty N/A; offline variant title “No connection”; mobile stacked buttons.

**Accessibility:** `role="alert"` for sudden errors. Focus Retry on appearance if it interrupted a task.

---

## 16. Alert / banner

**Variants:** info (ink border), success, warning (stale policy), error.

Padding `spacing.4`, radius `radius.md`, icon + text + optional dismiss.

**Content:** Consent, stale catalogue, “Availability not live”, form success. No fake uptime banners.

**States:** default; hover on dismiss; focus-visible; active; disabled dismiss N/A; loading N/A; error variant; empty N/A; unavailable: warning banner; mobile: full container width, not a tiny toast.

**Accessibility:** `role="status"` or `alert` if urgent. Dismiss labelled “Dismiss”.

---

## 17. Accordion / FAQ

- Button row 48px min, chevron, `h3` question.
- Answer body 16px. One item open optional; allow multiple on station FAQs.

**States:** default collapsed; hover background inset; focus-visible; active; disabled if empty section hidden; loading skeleton; error “FAQs could not load”; empty hide whole block; offline show cached if any else hide; mobile full width.

**Accessibility:** `aria-expanded`, `aria-controls`. Questions in heading order.

---

## 18. Modal and bottom sheet

**Modal (desktop):** overlay `z.overlay` 40% ink, panel `z.modal` `shadow.md` `radius.card` max 480px. Close, Esc, focus trap.

**Bottom sheet (mobile):** same content for filters, location explain, report problem. Handle not the only close — also Close button 44px.

**States:** default open; hover on close; focus-visible first field or close; active; disabled submit until valid; loading submit; error inline in body; empty N/A; unavailable: still open for report; mobile sheet vs centred modal ≥768px.

**Accessibility:** `role="dialog"`, `aria-modal="true"`, labelled by title. Restore focus to opener.

---

## 19. Form field, validation error, success

**Field:** label 14px Medium above; input 48px; help text 14px tertiary.

**Validation error:** 14px `color.error.fg` below; `aria-invalid="true"`; `aria-describedby` error id. Icon optional, text required.

**Success (form):** banner + “We’ll use this number/email to reply.” No fake ticket SLA.

**Lead fields (host/fleet):** city, property or org type, contact; documents **not** in first step.

**States:** default; hover border; focus-visible; active; disabled; loading submit on button; error as above; empty required shows after submit; unavailable/offline: “Save failed — check connection”; mobile 16px font to avoid iOS zoom (body already 16).

**Accessibility:** Never placeholder-as-label. Group radios for connector needs.

---

## 20. Support escalation card (`SupportEscalation`)

**Purpose:** Human path on station, finder zero-result, and errors.

**Content:** Title “Need help at this station?”; station ID in Mono; phone/email **if confirmed**; **Report a problem** (opens form with `station_id`); hours only if true.

**Appearance:** Border, optional ink left 4px (`color.action.primary` as guidance, not “available”). Not a green “all good” card.

**States:** default; hover on actions; focus-visible; active; disabled phone link if no number — hide it; loading skeleton; error “Support contacts not published” + web form only; empty: form-only card; unavailable/offline: form still, explain delay; mobile stacked.

**Accessibility:** Station ID copy button labelled “Copy station ID”.

---

## 21. Arrival instructions card (`ArrivalInstructions`)

**Content:** Landmark, gate, bay, access restrictions, parking notes. Photo of entrance if rights exist.

**Appearance:** Numbered steps (1–3) in ink circles — wayfinding, not emoji. Map thumbnail optional later; **Copy address** + **Get directions** always if coordinates/address exist.

**States:** default; hover on CTAs; focus-visible; active; disabled directions if no address (hide); loading; error “Arrival notes not published” + address if any; empty: address only; unavailable: still show how to get there; mobile: photo above steps.

**Accessibility:** Steps as `<ol>`. Directions links: “Open in Google Maps”, “Open in Apple Maps” with `rel` appropriate; fallback copy address.

---

## 22. Toast / notification

- `z.toast`, bottom of viewport (mobile) / bottom-right (desktop), `shadow.md`, 16px text, auto-dismiss 6s for success, persist for error until dismiss.
- Max one informational + one error.

**States:** default enter `motion.base`; hover pause timer; focus-visible on dismiss; active; disabled N/A; loading N/A (use button spinner); error toast; empty N/A; offline toast “You’re offline”; mobile 16px inset from edges, not covering sticky CTA (offset above `spacing.16` + button).

**Accessibility:** `role="status"` success; `role="alert"` error. Do not steal focus except for errors that block.

---

## 23. Consent banner (supporting, not decorative)

Not a marketing modal. Bottom bar: short purpose, Accept / Reject non-essential / Policy link. Tokens: surface default, border, 48px buttons. No tracking until accepted. See Phase 0 events.

---

## Component QA checklist (Phase 1)

- [ ] Station card + status chip readable in greyscale.
- [ ] Every interactive control has focus-visible.
- [ ] Stale/Unknown chips never use `color.status.available`.
- [ ] Primary actions are 48px / ≥44px.
- [ ] Technical values specified as IBM Plex Mono.
- [ ] No glassmorphism, neon, or 3D vehicles in any spec.
