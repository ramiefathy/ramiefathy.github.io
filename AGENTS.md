# Repository Guidelines

## Project Structure & Module Organization
- `site/` contains the Astro frontend; key subfolders are `site/src/pages` for routes, `site/src/components` for shared UI, `site/src/data` for structured JSON content, and `site/public/apps` for interactive tools.
- `services/ai-scribe/` hosts the Python 3.11 websocket backend; configuration lives alongside source files and loads from `services/ai-scribe/.env`.
- `legacy/` preserves historical reports and prototypes that ship as-is—do not refactor unless explicitly requested.
- `docs/` stores expanded documentation and launch notes, while `scripts/` is reserved for future automation helpers.

## Build, Test, and Development Commands
- `npm run site:dev` starts the Astro dev server at http://localhost:4321.
- `npm run site:build` compiles production assets into `site/dist/`; CI blocks merges on this step.
- `npm run site:preview` serves the built output to validate routing and assets.
- `npm run serve` hosts the static site root on port 8000 for quick spot checks.
- `python services/ai-scribe/app.py` launches the AI Dermatology Scribe backend; ensure `SESSION_SECRET` and Gemini keys are present in `.env`.

## Coding Style & Naming Conventions
- Use 2-space indentation for Astro/React files and 4-space indentation for Python modules.
- Component filenames follow PascalCase (e.g., `Header.jsx`); CSS modules and JSON data use kebab-case or snake_case to match existing patterns.
- Prefer descriptive prop and function names; keep inline scripts minimal and move shared logic into `site/src/components`.
- Python code follows PEP 8; import order should group stdlib, third-party, then local modules as seen in `app.py`.

## Testing Guidelines
- Run `npm run site:build` before committing to catch integration issues; add UI screenshots for visual changes.
- Execute `python -m compileall services/ai-scribe` to mirror the CI lint job and ensure modules compile.
- Interactive tools under `site/public/apps` require manual smoke tests in the browser; verify authentication flows honor `localStorage.dermascribe.sessionToken`.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `chore:`, `style:`) as used in recent history.
- Reference issues in the branch description or PR body, summarize user-facing changes, and attach before/after visuals for UI updates.
- Keep PRs scoped to one feature or fix; include a checklist noting build and backend checks.

## Security & Configuration Tips
- Store sensitive keys in `services/ai-scribe/.env` and never commit the file; document required values in PR notes.
- Ads placeholders in `site/src/pages/index.astro` must be updated with approved AdSense slot IDs before deployment.
- Review `.gitattributes` when adding binaries—PDFs should continue using Git LFS tracking.
