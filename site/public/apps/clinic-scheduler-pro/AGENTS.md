# Repository Guidelines

## Project Structure & Module Organization
- `site/` contains the Astro frontend; routes live in `site/src/pages`, shared UI in `site/src/components`, copy in `site/src/data`, and browser tools (including this app) in `site/public/apps`.
- `services/ai-scribe/` holds the Python 3.11 websocket backend; runtime env vars load from `services/ai-scribe/.env` (do not commit).
- `legacy/` stores historical prototypes; change only if an issue requests it. `docs/` keeps expanded docs and release notes; `scripts/` is reserved for automation helpers.

## Build, Test, and Development Commands
- `npm run site:dev` — start Astro dev server at http://localhost:4321 for live editing.
- `npm run site:build` — production build to `site/dist/`; required by CI.
- `npm run site:preview` — serve the built output for routing/asset validation.
- `npm run serve` — host static root on port 8000 for quick checks.
- `python services/ai-scribe/app.py` — launch AI Dermatology Scribe backend (needs `SESSION_SECRET` and Gemini keys in `.env`).

## Coding Style & Naming Conventions
- Indentation: 2 spaces for Astro/React, 4 spaces for Python.
- Components use PascalCase (e.g., `Header.jsx`); JSON/CSS modules prefer kebab- or snake-case.
- Follow PEP 8 import order in Python: stdlib, third-party, local.

## Testing Guidelines
- Run `npm run site:build` before commits to catch integration regressions.
- Lint Python via `python -m compileall services/ai-scribe`.
- Smoke-test tools in `site/public/apps`; ensure `localStorage.dermascribe.sessionToken` flows are intact where applicable.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `chore:`, `style:`); reference issues when relevant.
- Keep PRs focused on one feature/fix; include summary of user-facing changes, build/test results, and before/after screenshots for UI updates.
- Document required `.env` keys in PR notes; never commit `services/ai-scribe/.env`.

## Security & Configuration Tips
- Keep all secrets in `services/ai-scribe/.env` and share via approved secure channels only.
- Update AdSense slot IDs in `site/src/pages/index.astro` before deploying.
- Use Git LFS for binaries (e.g., PDFs); check `.gitattributes` when adding assets.
