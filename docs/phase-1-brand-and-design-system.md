# Plug and Go — Phase 1: brand and design system

**Phase:** 1 — visual direction, tokens, and reference behaviour only  
**Product:** Plug and Go  
**Companion files:** `docs/design-tokens.json`, `docs/phase-1-component-specifications.md`, `docs/phase-1-reference-screens.md`  
**Product contract:** `docs/phase-0-product-and-data.md`, `docs/station-data-schema.md`  
**Out of scope:** website scaffolding, packages, production pages, maps SDK, authentication, payment, OCPP

This document is the visual contract for later engineering. It does not publish stations, prices, partners, or coverage. Where content is unconfirmed, the UI must use labelled placeholders or omit the block — never invent proof.

---

## 1. Brand statement

> **Find a compatible charger. Know the price. Charge with confidence.**

Plug and Go is charging infrastructure you can read in a hurry: like a clear road sign, not a campaign site. The interface should feel as if it belongs beside a real bay, a painted wayfinding arrow, and a support number you can actually call.

**Personality:** precise, calm, modern, human, trustworthy.  
**Primary context:** a driver who may be low on battery, in traffic, on a phone, or arriving somewhere for the first time.  
**Priority:** confidence and clarity over decoration.

If a screen cannot answer “Can I use this charger, what will it cost, and what do I do next?” in a few seconds, the design has failed — however polished it looks.

---

## 2. Experience principles

1. **Truth before persuasion.** Status, price, hours, and proof come from approved records. Missing data is shown as missing. Stale or unknown availability is never painted as Available.
2. **Wayfinding over storytelling.** The next physical action (search, filter, open station, get directions, get help) is always visible. Narrative copy supports that action; it does not replace it.
3. **List is equal to map.** A driver must complete discovery without dragging a map. The map is orientation, not a gate.
4. **One visual language.** Header, station card, status chip, tariff row, and support card are the same components everywhere. Pages are compositions, not restyles.
5. **Human at the point of failure.** Offline, stale, occupied, and form errors lead to a clear next step and a human support path — not a decorative empty illustration.
6. **Calm motion.** Motion confirms a state change. It never delays the first useful action and never autoplays media.

---

## 3. Visual direction — calm infrastructure with human guidance

### 3.1 Reference (direction, not copying)

Compose mood from:

- Indian urban charging bays at dusk and noon: tarmac, painted stall lines, canopy steel, cable hangers
- Highway and metro wayfinding: high-contrast type, numbered identifiers, arrows, explicit times
- Hardware materials: powder-coated cabinets, rubber stops, brushed metal, warm concrete
- Editorial restraint: generous margins, few colours on screen at once, photography as evidence

Do not compose from: neon grids, glassmorphism dashboards, 3D cars, aurora gradients, or generic SaaS “bento” marketing.

### 3.2 What should be memorable

The **finder + status system** is the brand signature:

- `AvailabilityChip` (word + icon + colour)
- `DataFreshness` (explicit timestamp)
- `ConnectorBadge` (type + kW in mono)
- `StationCard` (those three plus one honest price line and one primary action)

Photography of real entrances and bays is the only large visual layer. Surfaces stay warm paper; type stays ink. The accent teal is for *doing*, not for decorating backgrounds.

### 3.3 Layout character

Sections must not all be “headline + three equal cards.” Home uses a search-led hero, a fact strip, a horizontal station preview, a numbered how-it-works, a split audience pair, then a support band. Finder is a working tool. Station detail is a document with a sticky action. Fleet/host is a quieter commercial page with a form, not a second hero clone.

### 3.4 What is forbidden

- Neon cyberpunk palettes, random gradients, glass cards, 3D vehicle renders
- Fake metrics, fake logos, fake reviews, undated counters
- Autoplay video
- Colour-only status
- Drag-only map tasks
- Decorative motion that blocks search or directions

---

## 4. Colour system

Canonical values live in `docs/design-tokens.json`. Hex below is the Phase 1 source of truth for light theme (the public site ships light-first).

### 4.1 Brand and surface

| Token | Hex | Role |
|---|---|---|
| `color.ink.road` | `#16202C` | Deep ink / wet tarmac. Headings, primary text, header. |
| `color.ink.muted` | `#3D4854` | Secondary text, captions, chrome labels. |
| `color.surface.canvas` | `#F3EEE6` | Page background — warm limestone, not cold grey-white. |
| `color.surface.default` | `#FAF7F2` | Raised paper (cards, header, sheets). |
| `color.surface.inset` | `#EAE4DA` | Wells, skeletons, disabled fills. |
| `color.action.primary` | `#0B6F62` | Electric action teal. Find / directions / submit. |
| `color.action.primaryHover` | `#095A50` | |
| `color.action.primaryActive` | `#084940` | |
| `color.action.onPrimary` | `#FAF7F2` | Text/icon on primary buttons. |
| `color.action.subtle` | `#E4F3EF` | Selected chip / subtle teal wash. |

Teal is used sparingly: primary buttons, key links in context, focus-adjacent selection, and the wordmark underline if needed. It is not a full-bleed hero wash.

### 4.2 Status (always text + icon + colour)

| Token | Hex | Word (required) | Icon (required) |
|---|---|---|---|
| `color.status.available` | `#1F6B3A` | Available | Plug / check in circle |
| `color.status.limited` | `#9A5B00` | In use / Limited | Clock / bay occupied |
| `color.status.faulted` | `#B42318` | Faulted | Warning diamond |
| `color.status.offline` | `#4E5965` | Offline / Unknown / Stale | Minus in circle / dashed plug |

Tinted chip backgrounds (not for text colour):

| Token | Hex |
|---|---|
| `color.status.availableBg` | `#E5F3EA` |
| `color.status.limitedBg` | `#F8EDD9` |
| `color.status.faultedBg` | `#FBE7E5` |
| `color.status.offlineBg` | `#EEF0F2` |

**Status law:** never communicate availability by colour alone. The chip must include a text label and a distinct icon. The same information must remain understandable in greyscale and with status hues removed (icon + words). `unknown` and `stale` use `color.status.offline` treatment and the words **Unknown** or **Stale** — never **Available**.

Occupied and limited share the amber family (`color.status.limited`). Faulted is red. Offline, unknown, and stale share grey — distinguished by **label text**, not by a fourth hue that could be confused with available.

### 4.3 Text, border, focus, feedback

| Token | Hex | Role |
|---|---|---|
| `color.text.primary` | `#16202C` | Body and titles on light surfaces. |
| `color.text.secondary` | `#3D4854` | Supporting copy. |
| `color.text.tertiary` | `#5C6570` | Timestamps, legal, placeholders. |
| `color.text.inverse` | `#FAF7F2` | Text on ink or teal. |
| `color.text.disabled` | `#8A9299` | Disabled controls. |
| `color.border.default` | `#D4CDBF` | Card and field borders. |
| `color.border.strong` | `#B8AFA0` | Hover/emphasis borders. |
| `color.focus.ring` | `#0F5C8C` | Keyboard focus. Civic blue, **not** status green. |
| `color.success.fg` | `#1F6B3A` | Form success (distinct copy, not “Available”). |
| `color.success.bg` | `#E5F3EA` | |
| `color.warning.fg` | `#9A5B00` | Warnings, stale callouts. |
| `color.warning.bg` | `#F8EDD9` | |
| `color.error.fg` | `#B42318` | Validation and system errors. |
| `color.error.bg` | `#FBE7E5` | |
| `color.error.border` | `#E8A8A2` | |

Contrast target: WCAG 2.2 AA for text and essential UI. Primary button (`#FAF7F2` on `#0B6F62`) and body (`#16202C` on `#F3EEE6` / `#FAF7F2`) are specified to meet that bar. Do not lighten teal or grey until contrast is re-checked.

---

## 5. Typography

**Maximum two families.**

| Role | Family | Use |
|---|---|---|
| UI and body | **IBM Plex Sans** | Navigation, headings, paragraphs, buttons, forms, chips labels. |
| Technical values | **IBM Plex Mono** | kW, ₹ amounts, `/kWh`, station IDs, EVSE labels, timestamps, coordinates if shown, connector counts. |

Do not add a third display font. Until a client wordmark is supplied (open question Q-G1), the logo lockup is “Plug and Go” in IBM Plex Sans Semibold.

**Weights in use:** Regular 400, Medium 500, Semibold 600. Do not use Thin or ExtraBold. Headings: Semibold. Body: Regular. Chrome labels: Medium.

**Features:** `font-feature-settings` for tabular lining figures on prices and times (`tnum` on Mono). Sentence case for UI. No all-caps except short status words if needed for a chip (prefer sentence case: “Available”).

### 5.1 Type scale — mobile (360–767px)

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `font.size.caption` | 12 / 16 | 500 | Legal, overlines |
| `font.size.small` | 14 / 20 | 400 | Secondary, chips |
| `font.size.body` | 16 / 24 | 400 | Minimum body |
| `font.size.bodyLg` | 18 / 28 | 400 | Lead paragraph |
| `font.size.h3` | 20 / 28 | 600 | Card titles, station name on card |
| `font.size.h2` | 24 / 32 | 600 | Section titles |
| `font.size.h1` | 32 / 40 | 600 | Page title |
| `font.size.display` | 36 / 44 | 600 | Home hero only |

### 5.2 Type scale — desktop (1024px+)

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `font.size.caption` | 12 / 16 | 500 | |
| `font.size.small` | 14 / 20 | 400 | |
| `font.size.body` | 16 / 26 | 400 | |
| `font.size.bodyLg` | 18 / 28 | 400 | |
| `font.size.h3` | 24 / 32 | 600 | |
| `font.size.h2` | 32 / 40 | 600 | |
| `font.size.h1` | 40 / 48 | 600 | |
| `font.size.display` | 48 / 56 | 600 | Hero only; do not inflate further |

Tablet (768–1023) interpolates: use mobile sizes for body, desktop `h2`/`h3` at 768+.

---

## 6. Spacing (8px system)

Base unit: **8px**. Half-step **4px** is allowed only for icon padding and chip internals.

| Token | px |
|---|---|
| `spacing.0` | 0 |
| `spacing.1` | 4 |
| `spacing.2` | 8 |
| `spacing.3` | 12 |
| `spacing.4` | 16 |
| `spacing.5` | 20 |
| `spacing.6` | 24 |
| `spacing.8` | 32 |
| `spacing.10` | 40 |
| `spacing.12` | 48 |
| `spacing.16` | 64 |
| `spacing.20` | 80 |
| `spacing.24` | 96 |

**Rhythm:** component padding `spacing.4` (16) or `spacing.6` (24). Section gaps mobile `spacing.12`–`spacing.16`; desktop `spacing.16`–`spacing.24`. Do not invent 13px or 18px gaps.

---

## 7. Breakpoints

| Token | Width | Intent |
|---|---|---|
| `breakpoint.xs` | 360px | Smallest phone QA |
| `breakpoint.sm` | 390px | Common phone |
| `breakpoint.md` | 768px | Tablet / list+map split begins |
| `breakpoint.lg` | 1024px | Laptop; two-column station |
| `breakpoint.xl` | 1280px | Default desktop grid |
| `breakpoint.xxl` | 1440px | Large desktop; max readable measure |

Design and QA at **360, 390, 768, 1024, 1280, and 1440**. Mobile-first CSS: default styles are 360; `min-width` queries step up.

---

## 8. Grid and containers

| Context | Viewport | Columns | Gutter | Margin | Max content |
|---|---|---|---|---|---|
| Mobile | 360–767 | 4 | 16px | 16px | 100% |
| Tablet | 768–1023 | 8 | 24px | 24px | 100% |
| Laptop | 1024–1279 | 12 | 24px | 32px | 1120px |
| Large desktop | 1280+ | 12 | 24px | auto | **1200px** (`layout.container.max`) |

At 1440px the canvas may be wider; the **container stays 1200px** so line length and station columns do not stretch into a poster. Finder on large screens: list column ~420–480px, map fills remaining container — not the full viewport edge-to-edge in a way that hides the list.

Body measure for long copy (legal, guides): max ~66ch.

---

## 9. Radius, shadow, border, elevation

Infrastructure, not pills-on-pills.

| Token | Value | Use |
|---|---|---|
| `radius.none` | 0 | |
| `radius.sm` | 4px | Inputs inner, small controls |
| `radius.md` | 8px | Buttons, chips, fields |
| `radius.card` | 12px | Cards, sheets, dialogs |
| `radius.pill` | 999px | Status chips only |
| `shadow.none` | none | Default cards use **border**, not drop shadow |
| `shadow.sm` | `0 1px 2px rgba(22,32,44,0.06)` | Sticky header, raised search |
| `shadow.md` | `0 8px 24px rgba(22,32,44,0.10)` | Modal, bottom sheet |
| `shadow.focus` | `0 0 0 3px #0F5C8C` | Focus ring (also `outline`) |
| `border.width.default` | 1px | |
| `border.width.strong` | 2px | Selected card, active tab |

**Elevation:** rest = border on `color.surface.default`; sticky = `shadow.sm`; overlay = `shadow.md`. No blur-glass, no coloured glows.

---

## 10. Focus, icons, images, motion

### Focus

- Visible `focus-visible` on every control: 3px `color.focus.ring`, 2px offset, `border-radius` matching the control.
- Never `outline: none` without a replacement.
- Focus colour is civic blue so it cannot be mistaken for Available green.

### Icons

- 24px optical grid; 20px inside chips if needed.
- 1.75px stroke, round caps, round joins. Outline style, not skeuomorphic.
- Status icons are mandatory companions to status text.
- Do not use icon-only primary actions on mobile except well-labelled icon buttons with `aria-label` (e.g. close).

### Images

- Authentic station photography: entrance, bay, charger, signage, connector, amenities. Rights confirmed (`docs/station-data-schema.md` media rules).
- Reserved aspect ratio (prefer 4:3 for cards, 16:9 for hero if a real photo exists). No layout shift.
- `alt` is factual (“Entrance to the charging bays from the east gate”), not slogan.
- If no approved photo: warm inset placeholder + “Photo not published” — never a stock car.
- No autoplay video. No decorative loops in the hero.

### Motion

| Token | Value |
|---|---|
| `motion.fast` | 150ms |
| `motion.base` | 200ms |
| `motion.slow` | 300ms |
| `motion.easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` |

Use for: sheet open/close, chip selection, toast in, accordion height. Do not: page-load choreography, parallax, map bounce, skeleton shimmer faster than 1.2s cycle.

`prefers-reduced-motion: reduce` — duration 0 (or 1ms), no transform fly-ins; opacity only if needed for state.

---

## 11. Accessibility

Target: **WCAG 2.2 AA**.

| Rule | Spec |
|---|---|
| Body text | 16px minimum (`font.size.body`) |
| Touch target | 44×44px minimum (`size.touch.min`) |
| Keyboard | All actions reachable; skip link to main; logical heading order |
| Focus | Always visible (`color.focus.ring`) |
| Status | Text + icon + colour; do not rely on colour |
| Motion | Honour reduced motion |
| Structure | Landmarks: header, nav, main, footer; forms labelled |
| Contrast | AA for text and essential UI chrome |
| Map | Full list equivalent; no drag-only task |
| Errors | Text next to field, `aria-invalid`, `aria-describedby` |
| Zoom | Usable at 200% without clipping primary CTA |

---

## 12. Writing style

- Direct, short, reassuring, honest. Sentence case. One idea per sentence where the driver is under stress.
- Local formats: **₹** with grouping, **₹/kWh**, **kW**, **km**, 24-hour or explicit am/pm with timezone/local date. Timestamps: `Last updated 18 min ago` **and** the clock time when space allows (`Today, 16:42 IST`).
- Status copy examples (format only): `Available`, `In use`, `Faulted`, `Offline`, `Unknown`, `Stale — last updated 18 min ago`.
- Missing tariff: **Price not published**. Missing catalogue: **No stations published for this search**.
- Do not write “100% uptime”, “fastest”, “trusted by thousands”, or 24/7 support unless operations confirm it.
- CTA verbs: Find a charger, Get directions, Copy address, Get support, Report a problem, Plan fleet charging, Check site eligibility.
- Book / Start charging labels appear only when a future backend confirms the action is possible.

---

## 13. z-index

| Token | Value | Layer |
|---|---|---|
| `z.base` | 0 | Page |
| `z.sticky` | 100 | Header, sticky station CTA |
| `z.dropdown` | 300 | Autocomplete |
| `z.drawer` | 400 | Filter drawer, mobile nav |
| `z.overlay` | 500 | Backdrop |
| `z.modal` | 600 | Modal, bottom sheet |
| `z.toast` | 700 | Toasts |
| `z.focus` | 800 | Focus tools if needed |

---

## 14. Component sizing (tokens)

| Token | Value |
|---|---|
| `size.touch.min` | 44px |
| `size.button.height` | 48px |
| `size.button.heightSm` | 44px |
| `size.input.height` | 48px |
| `size.chip.height` | 32px |
| `size.header.height.mobile` | 56px |
| `size.header.height.desktop` | 64px |
| `size.icon.sm` | 16px |
| `size.icon.md` | 20px |
| `size.icon.lg` | 24px |
| `size.marker` | 32px |

---

## 15. Mapping to implementation (Phase 2, not now)

When engineering starts, tokens in `docs/design-tokens.json` become CSS custom properties or Tailwind theme keys. Do not introduce one-off hex, px, or ms values in components. Phase 1 does not install a toolchain.

---

## 16. Phase 1 exit checklist

A new page can be specified entirely from this system. Check all before Phase 2 scaffolding:

- [ ] Brand statement and six experience principles are accepted.
- [ ] Palette (ink, warm paper, teal action, four status families, focus blue) is accepted; no extra accent colours added ad hoc.
- [ ] Status is specified as **text + icon + colour**; greyscale review of station card still communicates state.
- [ ] IBM Plex Sans + IBM Plex Mono only; type scale documented for mobile and desktop.
- [ ] 8px spacing, six breakpoints, container/grid rules documented.
- [ ] Radius, shadow, border, z-index, motion, and reduced-motion rules documented.
- [ ] Accessibility floor (16px body, 44px targets, focus, contrast AA) documented.
- [ ] Voice and local formats (₹/kWh, kW, km, timestamps) documented.
- [ ] `docs/design-tokens.json` covers colour, type, space, breakpoints, radii, shadows, borders, z-index, motion, component sizing, status.
- [ ] Every listed component has states including loading, error, empty, disabled, focus-visible, and unavailable/offline where relevant (`docs/phase-1-component-specifications.md`).
- [ ] Home, Find charger, Station detail, and Fleet/host reference screens specify mobile/desktop order, CTAs, and honest empty states (`docs/phase-1-reference-screens.md`).
- [ ] No production app, map SDK, auth, payment, or OCPP work has started in this phase.
- [ ] Client still must approve logo, photography, real proof, and languages before visual QA uses anything other than labelled placeholders (see open questions).

**Exit gate (from the build roadmap):** you can assemble a new page from approved components and tokens; the system works in greyscale and on a small phone; a driver can identify availability, price, connector, primary action, and help on the station reference screen in five seconds.
