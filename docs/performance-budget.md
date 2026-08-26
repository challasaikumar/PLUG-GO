# Plug and Go performance budget (Phase 11)

Targets for public pages on a mid-range Android (4G, 390px):

- LCP ≤ 2.5s
- INP < 200ms
- CLS < 0.1

Profiling commands (do not run against production chargers or live payments):

```bash
# Production build, then local start
npm run build
npm run start

# Chrome DevTools → Lighthouse (mobile) on:
# /  /find-charger  /how-to-charge  /about
# Confirm marketing pages do not load Mapbox/Google Maps.

# Optional if Lighthouse CLI is installed locally:
# npx lighthouse http://127.0.0.1:3000 --preset=desktop --only-categories=performance
```

Checks encoded as tests in `src/lib/release/performance.test.ts`:

- Homepage, about, how-to-charge, pricing, legal pages must not import map SDKs.
- Finder map providers are dynamically imported.
- No autoplay video in `src/app`.
- Images used from Next should declare dimensions where added.
