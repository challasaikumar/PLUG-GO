# Plug and Go — Phase 2 implementation notes

**Phase:** 2 — engineering foundation and reusable design system  
**Not in this phase:** full public homepage, finder/map, station product pages, login, payments, CMS, APIs, OCPP

## Framework and folder structure

- **Next.js 16** App Router, **React 19**, **TypeScript**, **`src/` directory**
- **Tailwind CSS v4** for layout utilities; **CSS custom properties** for all brand tokens
- **IBM Plex Sans** and **IBM Plex Mono** via `next/font/google` (self-hosted at build time)

```text
src/
  app/                  routes, globals.css, robots.ts, sitemap.ts
    design-system/      noindex specimen
  components/
    layout/             SkipLink, Header, Footer, SiteShell
    ui/                 design-system components
  fixtures/             demoStations.ts (demo only)
  lib/                  env, analytics placeholder, status rules
```

Existing `docs/`, `design.md`, `Provenance.md`, and `outputs/` were left in place.

## Token implementation

`docs/design-tokens.json` is the design source of truth. Values are copied into `:root` in `src/app/globals.css` as CSS variables (`--color-action-primary`, `--space-4`, `--radius-card`, `--motion-fast`, `--z-modal`, and so on). Components must use those variables, not one-off hex or pixel values.

`prefers-reduced-motion: reduce` disables decorative animation (including skeleton pulse and spinner spin).

## Components created

Button, TextInput, SearchField, FilterChip, AvailabilityChip, ConnectorBadge, DataFreshness, Alert, EmptyState, Skeleton, ErrorRetryPanel, Accordion, Modal (modal + bottom sheet), ToastProvider, SupportEscalationCard, ArrivalInstructionsCard, StationCard.

Status chips always render **icon + label + colour**. `stale` and `unknown` use the offline grey tone and the words Stale / Unknown.

## Environment variables

See `.env.example`.

| Variable | When |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical, Open Graph, sitemap, robots (now) |
| Maps, payment, SMS, CRM, OCPP, analytics keys | Later phases — do not put secrets in `NEXT_PUBLIC_*` |

`src/lib/env.ts` reads the site URL and warns in production if it is missing.

## Analytics

`src/lib/analytics.ts` exports Phase 0 event names and a no-op `track()`. No vendor SDK is installed.

## Accessibility

- Skip link to `#main-content`
- Header `banner`, footer `contentinfo`, labelled `nav`
- Mobile menu and modal: Esc, overlay click, `aria-expanded` / `aria-modal`
- Visible `:focus-visible` ring in civic blue (`--color-focus-ring`), not status green
- 16px body, 44px minimum control size, 48px buttons
- Combobox pattern on search
- Status not colour-only

## Performance

- No map, chat, autoplay video, payment, or OCPP libraries
- Fonts via `next/font` (swap, subset latin)
- Images: `next/image` ready; no remote image domains configured yet (no live photos)
- Design-system and reserved routes are `noindex`; sitemap lists only `/`

## Commands used to verify

```text
npm run test
npm run lint
npm run typecheck
npm run build
```

Viewport checks (360, 390, 768, 1024, 1280, 1440) were run against the production server with `scripts/phase-2-visual-qa.py`: no horizontal scroll, header/footer/main present, mobile menu opens/closes, status labels present, `/design-system` not in public navigation.

## Deferred to Phase 3+

- Public brand homepage composition (hero search, trust strip, nearby preview, audience split)
- Finder list/map, live catalogue, station detail templates
- Real photography, legal copy, support contacts
- Consent banner firing analytics
- Auth, booking, payment, CSMS/OCPP, operator portals
