# Repository Guidelines

## Project Structure & Module Organization
- `site/` contains the Astro frontend. Key routes live in `site/src/pages`, shared UI in `site/src/components`, structured copy in `site/src/data`, and browser tools in `site/public/apps`.
- `services/ai-scribe/` houses the Python 3.11 websocket backend. Runtime configuration loads from `services/ai-scribe/.env` and should not be committed.
- `legacy/` preserves historical prototypes; ship as-is unless an issue explicitly asks for changes.
- `docs/` stores expanded documentation and release notes, while `scripts/` is reserved for upcoming automation helpers.

### External / Subdomain Apps (Important)
- **Skinoculars** is intentionally hosted as a **standalone repo + subdomain**:
  - Canonical URL: `https://skinoculars.ramiefathy.com/`
  - Source/deploy repo: `ramiefathy/Skinoculars` (GitHub Pages + custom domain)
  - The main site should **keep** the Skinoculars listing in `site/src/data/apps.json` pointing to the canonical URL.
- **Clinisched** is intentionally hosted as a **standalone repo + subdomain**:
  - Canonical URL: `https://clinisched.ramiefathy.com/`
  - Source/deploy repo: `ramiefathy/clinisched` (GitHub Pages + custom domain)
  - The main site should **keep** the Clinisched listing in `site/src/data/apps.json` pointing to the canonical URL.
- The legacy in-site path `/apps/Skinoculars/...` is no longer shipped from this repo; it is handled via **Cloudflare redirect rules**. Do not re-add `site/public/apps/Skinoculars/` here unless there is a deliberate architecture reversal.

## Build, Test, and Development Commands
- `npm run site:dev` — start the Astro dev server at http://localhost:4321.
- `npm run site:build` — compile static assets into `site/dist/`; CI requires this to pass.
- `npm run site:preview` — serve the built output for routing and asset validation.
- `npm run serve` — host the static root on port 8000 for quick spot checks.
- `python services/ai-scribe/app.py` — launch the AI Dermatology Scribe backend; ensure `SESSION_SECRET` and Gemini keys are present in `.env`.

## Coding Style & Naming Conventions
- Use 2-space indentation for Astro/React files and 4-space indentation for Python.
- Component files follow PascalCase (e.g., `Header.jsx`). JSON and CSS modules prefer kebab-case or snake_case.
- Keep JSX concise; shared logic belongs in `site/src/components`. Python modules should follow PEP 8 ordering: stdlib, third-party, then local imports.

## Testing Guidelines
- Run `npm run site:build` before commits to catch integration regressions.
- Execute `python -m compileall services/ai-scribe` to mirror the CI lint job.
- Smoke test interactive tools in `site/public/apps`, verifying `localStorage.dermascribe.sessionToken` flows where applicable.
- Canonical test surface inventory: `docs/site-test-inventory.md` (tests parse this file). **Update it** whenever you add/remove/rename Astro routes, shipped legacy HTML apps, or change canonical external-app URLs.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `chore:`, `style:`). Reference issues when applicable.
- PRs should cover a single feature or fix, summarize user-facing changes, and include build/test results plus before/after screenshots for UI.
- Document required `.env` keys or secrets in PR notes; never commit `services/ai-scribe/.env`.

## Security & Configuration Tips
- Keep secrets in `services/ai-scribe/.env` and share via approved secure channels only.
- Update ad placeholders in `site/src/pages/index.astro` with valid AdSense slot IDs before deploying.
- Use Git LFS for binaries such as PDFs; check `.gitattributes` when adding new assets.
