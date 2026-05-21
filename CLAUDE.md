# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Shared agent vault (read first when available)

The canonical, cross-agent project context lives at `~/vault/01_projects/ramiefathy.github.io.md`. It tracks current state, open PRs, and wikilinks to related projects. Read it before non-trivial work.

If the vault is not present (fresh checkout, remote agent, CI), proceed using only this file and log progress via repo commits — do not fabricate vault paths.

Per `~/vault/SOUL.md` §Multi-agent coordination, when you ship work:
1. Commit format: `agent(claude-code): <summary>`
2. Append `- YYYY-MM-DD <summary>. claude-code @ <commit-hash> in <repo>.` to the vault project file under `## Recent updates`, then commit and push the vault (don't wait for Obsidian Git's hourly sync)
3. For non-trivial sessions, capture learnings to `~/vault/00_inbox/<date>-claude-code-<slug>.md`

The sibling `AGENTS.md` is the Codex-flavored equivalent of this file.

## Commands

All site commands run from the repo root and `npm`-prefix into `site/`:

```bash
npm run site:dev               # Astro dev server on http://localhost:4321
npm run site:build             # Production build → site/dist/
npm run site:preview           # Preview the built output
npm run site:test              # Vitest unit + policy tests (site/src/**/*.test.ts)
npm run site:test:watch        # Vitest in watch mode
npm run site:test:e2e          # Playwright E2E (builds + serves preview first)
npm run site:test:e2e:update   # Update Playwright snapshots
```

Single-test invocations (run inside `site/`):

```bash
cd site
npx vitest run src/security/site-design-contract.test.ts   # one unit/policy test
npx playwright test tests/site-runtime.spec.ts             # one E2E spec
npx playwright test -g "renders the hero"                  # by test name
npm run test:e2e:smoke                                     # smoke suite (separate config, opt-in, needs local AI scribe)
```

AI Scribe Python service:

```bash
cd services/ai-scribe
pip install -r requirements.txt
python app.py                                              # ws://0.0.0.0:8765
python -m pytest tests -q                                  # backend tests
python -m compileall .                                     # syntax check (matches CI)
```

### Node version gotcha

Root `.nvmrc` pins **22.12.0** (used by all CI jobs and GitHub Pages deploy). `site/.nvmrc` pins **20**. CI is authoritative — `npm --prefix site install` and `npm run site:build` are expected to work on Node 22.12 even though `site/package.json` declares `engines.node >= 22.12.0`. The README's portable-Node bootstrap (`/tmp/node20`) is legacy and only needed when no system Node is present.

## Architecture

This repo serves three deployment surfaces from one codebase:

### 1. Astro static site (`site/`)

The primary site at [ramiefathy.com](https://ramiefathy.com). Static output (`output: 'static'`) with React integration for interactive islands. Built artifact is `site/dist/`.

- `site/src/pages/**/*.astro` — routes (`/`, `/about`, `/apps`, `/research`, `/blog`, `/contact`, `/legacy`, `/strategy`, etc.). Includes dynamic route `pages/apps/mindmaps/[topic].astro` driven by `site/src/data/mindmaps/`.
- `site/src/components/*.jsx` — React islands (Header, Hero, dashboards, ScholarFeedEnhanced). Hydrated client-side via Astro directives.
- `site/src/data/*.json` — structured content (`apps.json`, `profile.json`, `publications.js`, `timeline.json`, etc.) is the source of truth for what renders on the site. Editing these JSON files is the normal way to update content.
- `site/src/layouts/MainLayout.astro` — shared head, fonts, footer.
- `site/src/lib/featureFlags.js` — flag system with localStorage overrides (`localStorage.setItem('ff_<flag>', 'true')`). Off-by-default for new features; defaults shipped in code.
- `site/public/_headers` — Cloudflare-style HTTP headers (HSTS, CSP, X-Robots-Tag for unlisted pages). The `/apps/dermatology-scribe/*` route gets a relaxed CSP and microphone permission.
- `astro.config.mjs` — pre-bundles heavy deps (`framer-motion`, `d3`, `html-to-image`, `jspdf`) into `optimizeDeps.include` because parallel Playwright workers used to hit Vite "Outdated Optimize Dep" 504s. Don't remove without re-testing E2E stability.

### 2. Legacy HTML apps (`site/public/apps/`)

Pre-Astro standalone HTML apps shipped as static assets. Each app is a self-contained directory (e.g., `dermatology-scribe/`, `biologic-monitoring-dashboard/`, `dermatopathology-modern/`, `MindMaps/`). New tools should be Astro routes; only modify these when fixing existing apps.

**Skinoculars is external** — sourced from `ramiefathy/Skinoculars` and deployed at `https://skinoculars.ramiefathy.com/`. The site only carries a catalog entry in `apps.json`; legacy in-site `/apps/Skinoculars/*` paths are redirected to the subdomain via Cloudflare. Don't add Skinoculars code here.

### 3. AI Scribe websocket backend (`services/ai-scribe/`)

Python `websockets` server powering live transcription and Gemini-driven note generation for `/apps/dermatology-scribe/`.

- `app.py` — connection lifecycle, rate limiter, JWT auth
- `gemini_service.py` — Gemini API client
- `session_manager.py` — per-connection state
- `prompts.py` — system prompts (template constants)
- Auth model: browsers send the JWT via the WebSocket subprotocol header (`Sec-WebSocket-Protocol: ramie-auth.<base64url(token)>`) because browsers can't set custom headers on WS. Server replies in `connection_ack` with a short-lived JWT (15 min) signed with `JWT_SIGNING_SECRET`. Legacy `SESSION_SECRET` is still accepted; invalid/missing tokens close with code `4008`.
- Config via `services/ai-scribe/.env` (see `.env.example`).

### Other surfaces

- `functions-backend/` — Firebase Cloud Functions (separate `package.json` and `node_modules`); not in the main site build pipeline.
- `legacy/` — archived HTML reports; preserved as-is.
- `TOS/`, `privacy/`, `apps/`, `about/`, `blog/`, `research/` at the repo root — pre-Astro stubs kept for legacy URL compatibility.

## Critical invariants (CI-enforced)

- **Simulation guard** (`.github/workflows/ci.yml`): build fails if `site/dist/apps/dermatology-scribe/index.html` contains `Simulated response` or `AI Generation Functions (Placeholders)`. The deployed scribe must use the real backend.
- **Canonical site inventory** (`docs/site-test-inventory.md`): a fenced JSON block listing all Astro routes, legacy HTML apps, unlisted pages, and external app surfaces. Vitest policy tests in `site/src/security/site-test-inventory.test.ts` parse and validate this. **When you add/remove/rename a page or app, update this file** — the policy tests will fail otherwise.
- **No vendor paths in inventory** — `site/public/apps/vendor/**` is excluded from coverage.
- **Remote-dep allowlist** (`site/src/security/remote-deps-allowlist.json`): currently empty; CDN-loaded scripts in legacy apps go through CSP allowlisting in `_headers`, not this file.
- **Two deployment paths**: `pages.yml` deploys `site/dist/` to GitHub Pages on every push to `master`. Cloudflare separately serves `ramiefathy.com` with redirect rules (e.g., Skinoculars subdomain). Don't assume a change visible on github.io is live on ramiefathy.com immediately.

## Test architecture

- **Unit / policy** (Vitest, `site/vitest.config.ts`): runs in Node env, includes `src/**/*.test.{ts,tsx}` and `tests/pdf-studio/**`. Coverage outputs to `site/coverage/mindmaps/`. Policy tests live in `site/src/security/` and gate things like inline-style hydration, frontend-design contract, and the test inventory.
- **E2E** (Playwright, `site/playwright.config.ts`): runs against a **built preview server**, not dev. Spawns `npm run build && npm run preview --host 127.0.0.1 --port 4321`. Excludes `*.smoke.spec.ts`. Per-test timeout 90s, assertion timeout 10s, retries 2 on CI.
- **Smoke** (separate `site/playwright.smoke.config.ts`): opt-in, longer timeouts, may depend on the local AI Scribe service via `scripts/start-ai-scribe-smoke.js`.

When adding tests, the Vitest run is fast and gates most regressions; reserve Playwright for genuinely end-to-end flows that need a real browser (hydration, navigation, downloads). Pin new E2E specs in `docs/site-test-inventory.md` if they cover a new app.
