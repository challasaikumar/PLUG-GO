# Plug and Go — Phase 3 public website

**Phase:** 3 — public brand, trust, support, and B2B enquiry site  
**Not in this phase:** live finder/map, station catalogue, login, booking, payment, CMS, OCPP, charger control

## Routes implemented

| Route | Role | Indexable |
|---|---|---|
| `/` | Brand home: promise, how it works, compatibility/price, audiences, safety, learning | Yes |
| `/find-charger` | Honest coming-soon for discovery (Phase 5 replaces this file) | Yes |
| `/about` | Mission, principles, identity slots | Yes |
| `/contact` | Reasoned enquiry form | Yes |
| `/support` | Help paths + support enquiry | Yes |
| `/safety` | Charging guidance and fault report | Yes |
| `/pricing` | Tariff schematic without rupee rates | Yes |
| `/solutions/fleets` | Fleet lead | Yes |
| `/solutions/workplace` | Workplace lead | Yes |
| `/host-a-charger` | Host lead | Yes |
| `/legal/privacy` | Draft privacy template | Yes |
| `/legal/terms` | Draft terms template | Yes |
| `/legal/refunds` | Draft refunds (no online payments yet) | Yes |
| `/legal/grievance` | Draft grievance slots | Yes |
| `/legal/accessibility` | Draft accessibility statement | Yes |
| `/design-system` | Internal specimen | **noindex** |
| `/api/enquiry` | Form POST adapter | Disallowed in robots |

Content lives in `src/content/siteConfig.ts` and `src/content/copy.ts`. Legal pages show a **draft** banner and configuration slots (entity, address, emails, effective date, version).

## Client content, assets, and configuration still required

Fill `src/content/siteConfig.ts` (or replace nulls) when confirmed:

- Legal entity name, registered address, GSTIN
- Support email, phone, and true hours (do not claim 24/7 unless true)
- Grievance officer name/email/phone
- Policy effective date; counsel-approved privacy/terms/refunds/grievance text
- Logo / wordmark
- Licensed station photography (none in the repo today)
- Languages beyond English
- Enquiry webhook destination (see below)

Do not invent station counts, cities, partners, ratings, or tariffs until Phase 4 data exists.

## Form integration

Server-only (never `NEXT_PUBLIC_`):

```text
ENQUIRY_WEBHOOK_URL=
ENQUIRY_WEBHOOK_TOKEN=
```

Documented in `.env.example`. `src/app/api/enquiry/route.ts` POSTs JSON `{ source, receivedAt, enquiry }` with optional Bearer token.

If `ENQUIRY_WEBHOOK_URL` is missing, submit returns **503** and the UI says nothing was sent. Honeypot field `website` is rejected. Shared validation: `src/lib/enquiry.ts`.

## SEO

- `src/lib/metadata.ts` → title, description, canonical, Open Graph, robots per page
- `src/app/sitemap.ts` lists `publicRoutes` from site config
- `src/app/robots.ts` allows `/`, disallows `/design-system` and `/api/`
- One `h1` per page; promise is the home `h1`

## Accessibility checks

- Skip link, header/footer landmarks, labelled nav
- Mobile menu: overlay starts below the header so Open/Close remains clickable; sheet Close, overlay dismiss, and Escape all close the menu and restore focus; `aria-expanded` / `aria-modal`
- Desktop nav from 1024px so 360–768 does not overflow
- Forms: labels, `aria-invalid`, error text tied with `aria-describedby`, consent checkbox, 44px targets
- Accordion questions are buttons with `aria-expanded`; keyboard Enter verified in QA
- Focus ring unchanged (civic blue)
- Reduced motion still honoured from Phase 2
- Viewport QA at 360, 390, 768, 1024, 1280, 1440 (`scripts/phase-2-visual-qa.py`) covering public routes, one `h1`, no horizontal overflow, sitemap/robots, menu close, form validation

## Deferred to Phase 4+

- Approved station catalogue and versioned tariffs (real ₹ rates)
- Finder list/map on `/find-charger`
- Live availability events
- Accounts, booking, payment, invoices
- CMS, OCPP/CSMS, operator portals
- Consent-gated analytics vendors
- Human-reviewed translations
