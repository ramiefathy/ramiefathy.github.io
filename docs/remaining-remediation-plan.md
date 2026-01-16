# Remaining Remediation Plan (handoff)

Context snapshot (Nov 29, 2025):
- Repo root: ramiefathy.github.io (Astro + React, standalone apps, ai-scribe backend, Firebase functions).
- Recent changes already merged locally:
  - Skip links/focus outlines; single `<main>` per page.
  - Service worker registered; security headers in `site/public/_headers`.
  - AI Scribe: JWT support, per-client rate limiting (60/min), structured logging helper; tokens no longer stored in localStorage.
  - Bundle manualChunks added; apps/publications lists windowed via IntersectionObserver; modal reduced-motion support; dermatology-scribe dark-mode contrast patch.
  - Tests run: `npm run site:build`, `npm --prefix site run test` (Vitest mindmap tests), `python -m compileall services/ai-scribe`.

Open items to complete (ordered by dependency/impact):

1) Motion/tilt accessibility
   - Files: `site/src/pages/apps/index.astro` (tilt script), `site/src/components/Hero.jsx`, `site/src/components/StatsCounter.jsx`, `site/src/components/Timeline.jsx`, `site/src/components/AppsShowcase.jsx`.
   - Actions:
     - Wrap tilt initialization in a prefers-reduced-motion guard; disable tilt classes when true.
     - Hero: if reduced motion, skip typing and set static subtitle; also `aria-live="polite"` for subtitle.
     - StatsCounter: skip RAF animation when reduced motion; set final number and announce via `aria-live`.
     - Timeline/App cards: shorten/disable Framer motion when reduced motion.
   - Success: With reduced-motion enabled, no tilt/typing/counter animation; axe-core passes.

2) Additional aria-live and status messaging
   - Extend to other dynamic spots: scroll-fade status optional, loading indicators.
   - Ensure AppDemoModal loading/error already has aria-live (done); check AppsShowcase demo loading spinner if any.

3) Standalone apps dark-mode/contrast
   - Targets: `site/public/apps/dermatopathology-modern/*`, `clinic-scheduler-pro` (assets/css), `biologic-monitoring-dashboard/styles.css`, `PDF Merger/Splitter/TextExtractor` HTML/CSS.
   - Actions: add dark token set (bg, surface, border, text, focus). Apply to forms/tables/cards. Verify WCAG AA.

4) MindMap bundle size reduction
   - File: `site/src/apps/mindmaps/MindMapApp.tsx`.
   - Actions: dynamic import `html-to-image` and `jspdf` only when exporting; optionally dynamic import d3 layout parts; consider moving export helpers to a lazily loaded module.
   - Goal: reduce MindMapApp chunk below ~400 kB gzip; clear remaining Vite chunk warning.

5) Backend auth docs & tests
   - Add PyJWT to runtime already done; document JWT flow:
     - Legacy clients send SESSION_SECRET → server issues short-lived JWT in connection_ack.
     - Clients should reconnect with Bearer <token> or ?token=.
   - Add pytest WebSocket integration tests (consider `websockets` client) covering: valid JWT, legacy token issuance, invalid token rejection, rate-limit with RetryAfter.
   - Update `services/ai-scribe/README.md`.

6) Monitoring/metrics
   - Emit structured logs to platform sink (Render/CloudWatch). Add fields: action, session_id, client, latency, rate_limit status.
   - Add uptime/error alerting for ai-scribe and site (Better Uptime/Pingdom/Sentry).
   - Persist rate-limit metrics: either ship to logs (current) plus optional Redis counter; add alert when blocked > threshold/min.

7) CI & staging
   - CI: add Playwright smoke (home, about, apps, research) and coverage for Vitest. Update `.github/workflows/ci.yml`.
   - Staging: Cloudflare Pages preview + Render/Firebase staging env; ensure tests run on PRs against staging endpoints.

8) Content/SEO
   - JSON-LD (Person/Article) and OG images for home/about/apps/blog.
   - Blog to MD/MDX with RSS/Atom at `/blog/rss.xml`.
   - About: headshots/media gallery; fill “Personal Philosophy”.

9) Data freshness
   - GitHub Action or script to refresh publications (Scholar/ORCID/PubMed) and open PR updating `site/src/data/publications.js`.
   - Mind maps: add `version`/`updatedAt` to each manifest; optional changelog page; show version badge in UI.

10) Rate-limit persistence/alerts (backend)
   - If Redis available, store counters per client_key; return Retry-After; add alerting on block spikes.

Build/test commands to use
- Frontend: `npm run site:build`, `npm --prefix site run test` (Vitest), optionally `npm --prefix site run test:e2e` when Playwright added.
- Backend: `python -m compileall services/ai-scribe`; planned pytest suite (to be added) for ai-scribe; Functions not touched in this pass.

Notes
- Manual chunks currently set in `site/astro.config.mjs`; adjust if moving d3/html-to-image/jspdf to dynamic imports.
- Service worker at `site/public/sw.js` is basic cache-first; review CSP in `site/public/_headers` if adding new CDNs.
- AI Scribe rate limit defaults 60/min; adjust in `RateLimiter` ctor if needed.
