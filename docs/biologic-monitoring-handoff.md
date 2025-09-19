# Biologic Monitoring Dashboard – Development Handoff

_Last updated: September 19, 2025_

## 1. Program Overview and Strategic Context

RamieFathy.github.io is a clinician-facing knowledge hub built with Astro (frontend) plus a collection of static web apps under `site/public/apps/`. The broader roadmap is to modernize RAMIE (Realtime Articulate Medical Intelligence Explorer), curate high-utility educational tools, and publish clinical decision support utilities that run entirely client-side for ease of deployment and compliance (no PHI handling).

The current sprint objective is to expand the portfolio with medical education and clinical support tools. The first deliverable in this cycle is the **Biologic Monitoring Dashboard**—a lightweight tool that surfaces baseline labs, follow-up cadence, and safety counseling pearls for systemic dermatology treatments. Once this app is production-ready, we plan to implement the **Cutaneous Oncology Staging Assistant** drawing on NCCN guidelines stored locally in `/Users/ramiefathy/Downloads/Dermatology/PDFs_for_KB/NCCN Guidelines/`.

## 2. Current Solution Architecture

### 2.1 File Structure

```
site/public/apps/biologic-monitoring-dashboard/
├── index.html          # Standalone app entry point
├── styles.css          # Custom styling (CSS only, no preprocessors)
├── data.js             # Curated dataset (biologics + systemic agents)
└── app.js              # Vanilla JS controller (search/filter/render)

site/src/data/apps.json # Updated to register the new app in Astro listing
site/public/apps/index.html # Static hub updated with marketing card for the dashboard

docs/
├── biologic-monitoring-dashboard.md # Source-verified monitoring tables
└── biologic-monitoring-handoff.md    # (this document)
```

### 2.2 Frontend stack

- **Astro site** serves the marketing pages; apps are standalone static bundles that rely only on the browser.
- The dashboard uses **vanilla JavaScript** with shallow state (search query, active categories, view mode).
- The dataset lives in `data.js` as an array of normalized objects. Each entry includes class name, agents array, clinical uses, baseline tasks, monitoring cadence, cautions, and reference links.
- Rendering supports two modes:
  - **Card view (`state.viewMode === 'cards'`)** for an at-a-glance checklist.
  - **Table view (`state.viewMode === 'table'`)** for side-by-side comparison.
- UI features: live search, category toggles (“Biologics” vs “Targeted & Conventional”), “Copy note” buttons for quick chart text, reset filters, and responsive layout.
- Styling is custom CSS (Inter font, glassmorphism aesthetic) tuned for desktop and mobile breakpoints.

### 2.3 Data provenance

- All monitoring guidance is stored in `docs/biologic-monitoring-dashboard.md` with the original table and references (FDA labels, AAD guidelines, ophthalmology statements, SPS monitoring docs, PubMed reviews).
- `data.js` mirrors this content; each reference chip links back to the authoritative source URL (drugs.com summaries for PIs, Regeneron PI PDF, FDA REMS page, etc.).

## 3. Completed Work

1. **Schema verification:** reconciled our initial draft with the corrected monitoring table supplied by the user (see `docs/biologic-monitoring-dashboard.md`). Weight gain and shingles warnings were removed from the nemolizumab row; TB screening requirements were elevated for IL-23 inhibitors; dupilumab helminth/ocular management reinforced; isotretinoin monitoring cadence modernized.
2. **Persistent documentation:** the verified tables are now tracked in `docs/biologic-monitoring-dashboard.md` for auditing and future updates.
3. **App implementation:** built the dashboard UI (`index.html`, `styles.css`, `app.js`, `data.js`) with search/filter/copy functionality and accessible markup.
4. **Site integration:**
   - `site/src/data/apps.json` includes a new “Biologic Monitoring Dashboard” entry with stack tags and accent colors.
   - `site/public/apps/index.html` now displays a launch card with iconography and marketing copy.
5. **Handoff documentation:** this file captures scope, approach, current status, and next actions.

## 4. Outstanding Work & Open Issues

| Area | Issue / Gap | Impact | Suggested Path Forward |
| --- | --- | --- | --- |
| Build tooling | `npm run site:build` fails with esbuild mismatch: host tries to run `0.25.9` while `node_modules` bundles `0.21.5`. Network is sandboxed so `npm install esbuild@0.25.9` timed out. | Cannot confirm Astro build locally; CI will fail until resolved. | Outside the sandbox, reinstall matching esbuild (e.g., `npm --prefix site install esbuild@0.25.9` or remove `ESBUILD_BINARY_PATH` overrides). Alternatively, delete stale esbuild binary from `/tmp/esbuild-0259` and ensure Astro uses bundled version. Re-run `npm run site:build` afterwards. |
| Untracked files | `site/public/apps/scheduler-enhancement-recommendations.md` and `site/public/apps/scheduler-implementation-plan.md` appear as `??` in `git status`. | Noise in PR; unclear ownership. | Confirm with Ramie whether to keep, move to `docs/`, or remove. If unrelated, delete before PR. |
| QA | No automated tests or accessibility audit yet. | Potential UX issues unnoticed. | Manual QA checklist: (1) verify filtering on Chrome/Firefox/Safari + responsive view; (2) confirm keyboard navigation of buttons and links; (3) run Lighthouse/axe audit if time. |
| Analytics / telemetry | Not implemented. | None (optional). | If desired later, can add lightweight localStorage usage metrics or manual logging. |
| Cutaneous Oncology Staging Assistant | Not started. Need to parse NCCN PDFs for melanoma, cSCC, MCC, and project a UI flow. | Next major deliverable. | After PR merge, build JSON schemas for AJCC staging tables, design React/vanilla wizard, cross-validate outputs. |

## 5. Suggested Next Steps

1. **Resolve esbuild mismatch** outside the sandbox then rerun `npm run site:build`. Attach build logs to the PR.
2. **Clean repository**: decide on the two scheduler markdown files. Either move them into documentation or delete so the PR only contains the new dashboard assets.
3. **Manual QA**: smoke-test dashboard on multiple browsers, checking search, category toggles, view switcher, copy buttons, and mobile layout. Capture screenshots for PR.
4. **Prepare PR**:
   - Summary: “feat: add biologic monitoring dashboard app”.
   - Include context about the curated schema and data sources.
   - Document that build failed in sandbox due to esbuild version mismatch; note remediation steps for reviewers.
5. **Plan Cutaneous Oncology Staging Assistant** once dashboard ships:
   - Extract AJCC staging tables (already located in NCCN PDFs) into JSON.
   - Define UI flow (input tumor data → compute stage → display recommended next steps with citations).
   - Consider linking to RAMIE for quick insertion of stage summary.

## 6. Knowledge Transfer Notes

- The dashboard intentionally avoids frameworks to keep bundle size tiny and eliminate build dependencies. If future iterations require state management or more complex UI, consider migrating to Astro + client component.
- Copy-to-clipboard uses the async Clipboard API (`navigator.clipboard.writeText`). Works on modern browsers over `https://`; fallback messaging is in place.
- Category toggles auto-reset to both categories if the user disables all chips to avoid empty result states.
- View mode is stored in `state.viewMode`, toggling text on the view button and a `data-view` attribute on `<body>` for CSS adjustments.
- Data-driven design: adding a new regimen is as simple as appending to `monitoringEntries`. Ensure baseline/monitoring/caution fields are short paragraphs (plain text).
- Accessibility: sections use headings (`h3`) and structured markup for screen readers; reference chips have `role="listitem"` to clarify groupings.
- Documentation: keep `docs/biologic-monitoring-dashboard.md` updated if any regimen changes to maintain single source of truth for citations.

## 7. Risk Register

| Risk | Mitigation |
| --- | --- |
| Drug labels update frequently | Schedule quarterly refresh; rely on label URLs that include version numbers where possible. |
| Build tooling drift | After every dependency bump, verify esbuild binary alignment. Consider pinning `esbuild` version explicitly in `site/package.json`. |
| Copy functionality blocked (clipboard permission issues) | Buttons provide feedback for failure; consider adding a modal fallback if enterprise browsers disable clipboard API. |
| Mobile layout regressions with additional entries | CSS uses CSS Grid and `clamp()` to adapt; test when entries exceed current counts. Add sentinel `@media` adjustments if text overflows. |

## 8. Contact & Resource Pointers

- NCCN PDFs: `/Users/ramiefathy/Downloads/Dermatology/PDFs_for_KB/NCCN Guidelines/`
- RAMIE roadmap docs: `docs/ramie-implementation-status.md`, `docs/dermatology-scribe-enhancement-plan.md`
- Dermatopathology Navigator docs: `site/public/apps/dermatopathology-modern/PROJECT-STATUS.md`
- Monitoring schema references: `docs/biologic-monitoring-dashboard.md`

With this context, the next AI coding agent should be able to pick up the PR work (finish build/test/submit) and then transition to the staging assistant implementation with minimal ramp-up.
