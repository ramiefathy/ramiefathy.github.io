# Repository Guidelines

## Project Structure & Module Organization
- `site/` houses the Astro marketing site (routes in `site/src/pages`, shared UI in `site/src/components`, structured data in `site/src/data`).
- `apps/clinic-scheduler-pro/` contains the standalone scheduler: editable React sources live in `src/`, compiled bundles in `assets/`, and `verify-deps.html` is the CDN smoke test.
- `functions-backend/` is the Firebase Functions workspace with `index.js`, Firestore rules/indexes, and Mocha specs in `test/`; `services/ai-scribe/` provides the Python websocket backend that reads `.env`.

## Build, Test, and Development Commands
- `npm run site:dev` / `npm run site:build` (repo root) develop or compile the Astro site; `npm run site:preview` checks the built output.
- `npm run clinic:scheduler:build` transpiles the scheduler bundles; `python -m http.server 8000` serves a quick static preview.
- `npm install --prefix functions-backend` then `npm test --prefix functions-backend` run unit tests, while `node functions-backend/verify-functions.js` confirms email-free handling.
- `npm run deploy --prefix functions-backend` deploys Cloud Functions after rules and indexes succeed; monitor with `firebase functions:log --follow`.
- `python -m compileall services/ai-scribe` mirrors the CI lint step before touching the Python service.

## Coding Style & Naming Conventions
- Use 2-space indentation for Astro/React and 4-space for Python; React components use PascalCase, JSON or static assets stay kebab- or snake-case.
- Prefer descriptive hooks/props, extract shared UI into components, and keep Python imports ordered stdlib → third-party → local.

## Testing Guidelines
- Always run `npm run site:build` before commits and capture screenshots for UI changes.
- Execute `npm test --prefix functions-backend` plus `node functions-backend/verify-functions.js` after editing Cloud Functions.
- Compile `services/ai-scribe` with `python -m compileall` and smoke-test the websocket; reload `apps/clinic-scheduler-pro/verify-deps.html` when adjusting the dependency loader.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) and keep PRs scoped to a single feature or fix.
- Reference related issues, summarise user-facing impact, and list completed checks (Astro build, functions tests, Python compile) in the PR body.
- Add before/after screenshots for UI updates and note any new secrets, Firebase configs, or manual steps.

## Security & Configuration Tips
- Store Firebase credentials, Gemini keys, and `SESSION_SECRET` in `.env` or `firebase functions:config:set`; never commit secrets.
- Redeploy `functions-backend/firestore.rules` and `functions-backend/firestore.indexes.json` alongside feature launches, and watch logs with `firebase functions:log --only autoSchedule`.
- Update AdSense slot IDs in `site/src/pages/index.astro` before release and keep `.gitattributes` aligned so PDFs stay on Git LFS.
