# Plug and Go — accessibility and performance audit

**Owner:** Accessibility QA + frontend performance  
**Evidence required:** Keyboard notes, viewport checks, Lighthouse (staging), `src/lib/release/performance.test.ts`  
**Pass/fail status:** **PARTIAL.** Design tokens and CSS meet several WCAG 2.2 AA engineering bars. Visual QA screenshots for the eight required surfaces were **not** captured in this repository (no in-project browser runner). Live Lighthouse on a deployed host was **not** run.  
**Unresolved issue:** Screenshot evidence; screen-reader pass on OTP and payment handoff with a real device; LCP/INP/CLS field data  
**Approval needed:** Accessibility sign-off from the client QA owner before Stage D  
**Rollback or remediation:** Fix overflow/focus before enabling public finder; do not ship drag-only map interactions (list remains the complete catalogue)

## WCAG 2.2 AA release checklist

| Criterion | Evidence | Status |
| --- | --- | --- |
| Keyboard-only public / account / payment / modal / filter / portal | Modal focus trap; header menu Tab trap added in Phase 11 | pass (code) / fail (device evidence) |
| Visible focus + logical order | `--color-focus-ring`, skip link `#main-content` | pass (code) |
| Semantic headings / landmarks | `header` / `main` / `footer` / `h1` per page | pass (code) |
| Labelled fields + understandable errors | `field-label`, Alert copy | pass (code) |
| 44px minimum targets | `--size-touch: 44px` | pass (code) |
| Contrast + status not colour-only | Status chips use icon + text (Phase 5) | pass (code) |
| No drag-only maps | Finder list is complete when map is off | pass (code) |
| Reduced motion | `prefers-reduced-motion: reduce` | pass (code) |
| SR-friendly loading / alerts / live status | Spinner labels; Alert titles | pass (code) / fail (SR device) |
| Accessible OTP and payment handoff | Login unavailable copy; payment pending until webhook | pass (code) / fail (device) |

## Viewports to test

360, 390, 768, 1024, 1280, 1440. CSS: overflow-x clip, wrapping CTAs, scrollable tables, drawer `max-height: min(90dvh, 85vh)`.

## Required visual QA surfaces (pending screenshots)

Homepage, finder, station page, login/account, booking/payment state, live charging pilot session, technician portal, operator portal.

Store future captures under `docs/qa-screenshots/` with viewport in the filename. Until they exist, this row stays **fail**.

## Performance budget

| Metric | Target | Status |
| --- | --- | --- |
| LCP | ≤ 2.5s | fail (not measured on a host) |
| INP | < 200ms | fail (not measured) |
| CLS | < 0.1 | fail (not measured) |

Guards that **did** run:

- No map SDK on marketing pages  
- Map providers `dynamic(..., { ssr: false })`  
- No autoplay hero video  
- Analytics `track()` is a no-op until consent + vendor  
- Public station pages are server-rendered  
- Finder APIs paginated (max page size 50)  
- SSE live updates behind flags; PWA does not treat live paths as fresh  
- Stale data is labelled, not hidden  
- CSMS health + graceful shutdown  

Profiling commands: `docs/performance-budget.md`.
