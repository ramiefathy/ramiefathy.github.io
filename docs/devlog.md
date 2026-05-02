# Devlog — ramiefathy.github.io

## [2026-05-02] Commit readiness pass — CI-green verification and final push prep

**What changed.** Re-ran the release gates for the staged MindMaps diagram expansion before commit/push. The only new code change in this pass removes remote Google Fonts from `site/public/mcq-eval/index.html` and switches that unlisted dashboard to local/system font stacks, because the full site test suite caught it as a frontend design-contract violation.

**Why.** The targeted MindMaps checks were green, but CI runs the full site Vitest suite, full Playwright suite, Astro build, and AI scribe backend checks. The full suite must be green before pushing to `master`.

**Verification.**
- `git fetch origin` — passed; local `HEAD` and `origin/master` both resolved to `e219fe3b87a656424c608d6538b97d9b4334180f`, so there were no upstream changes to merge.
- `git diff --check && git diff --cached --check` — passed.
- Manual Chromium inspection via Playwright against `npm run site:dev` — checked all 16 mindmap topic routes at desktop `1440x900` and mobile `390x844`; original failure cases `aga-causes-concept-map`, `hair-follicle-lifecycle`, and `cicatricial-decision-tree` were captured under ignored `test-results/manual-browser-inspection/`.
- Citation audit script over the 25 new diagram files — passed: 25 files, 0 shape failures, 25 unique PMIDs resolved through NCBI ESummary, 5 unique DOIs, 19 unique URLs.
- `npm --prefix site run test -- src/apps/mindmaps` — passed: 19 files, 143 tests.
- `npm --prefix site run test:e2e -- mindmap-diagrams.spec.ts` — passed: 16 Chromium tests.
- `npm run site:test` — failed first because `site/public/mcq-eval/index.html` loaded Google Fonts, then passed after the local-font fix: 33 files, 211 tests.
- `npm run site:test:e2e` — passed: 123 tests, 21 skipped.
- `npm run site:build` — passed; Vite still warns that lazy `layoutEngine.BUP3xv9U.js` is about 1.45 MB raw / 440 kB gzip.
- `python3 -m compileall services/ai-scribe` — passed locally. The shell has no `python` alias, so CI's exact command could not be run verbatim locally.
- Temporary venv backend check: `/tmp/ramiefathy-ai-scribe-ci/bin/python -m compileall services/ai-scribe && /tmp/ramiefathy-ai-scribe-ci/bin/python -m pytest services/ai-scribe/tests -q` — passed: 5 tests, 11 warnings.

**Residual risk.** Local backend verification used Python 3.14 in a temporary venv while CI uses Python 3.11, but the backend compile/test suite passed and no backend files changed. The full frontend CI surface passed locally after the MCQ font fix.

---

## [2026-04-30] Mindmap diagram QA completion — ELK layout, expanded diagrams, citation audit

**What changed.** Completed the handoff finalization pass for the MindMaps diagram expansion. The app now exposes 47 diagrams across 16 topics, with ELK-backed async layout for decision trees and concept maps, lifecycle arc arrows, strict diagram-level citation validation, URL citation rendering, expanded desktop/mobile route geometry checks, and corrected clinical citation metadata for the newly added diagnostic algorithms and several existing diagram/comparison sources.

**Why.** The prior implementation had already done the large TDD-first buildout, but the handoff still left release blockers: direct browser inspection, a final review gate, clinical evidence review, devlog closure, and a decision on the ignored `site/package-lock.json`. Direct inspection found real rendering issues that tests did not initially catch: the diagram view reserved empty drawer space, wide ELK SVGs were being scaled down to unreadable text, and decision-tree branch labels could stack on shared edge paths. Those were fixed with an optional drawer grid column, natural-width horizontal scrolling for ELK diagrams, wrapped target-anchored branch labels, and a Playwright rendered-font-size assertion.

**Major files touched.** The finalization pass primarily touched `site/src/apps/mindmaps/diagrams/layoutEngine.ts`, `DecisionTreeDiagram.tsx`, `ConceptMapDiagram.tsx`, `LifecycleDiagram.tsx`, `site/src/apps/mindmaps/schema.ts`, `SideDrawer.tsx`, `CompareView.tsx`, `DiagramsView.tsx`, `site/src/styles/mindmap.css`, `site/tests/mindmap-diagrams.spec.ts`, `site/src/apps/mindmaps/__tests__/dataLoader.test.ts`, and the mindmap JSON data under `site/src/data/mindmaps/**`.

**Clinical evidence audit outcome.** Reviewed the 25 new diagnostic/decision-tree diagram JSON files named in the handoff. Local citation-shape checks found zero missing diagram citations, quotes, or locators. NCBI ESummary resolved all 25 unique PMIDs used by those new diagrams; the titles matched the expected guideline, consensus, review, or classification sources, including current AAD acne and atopic dermatitis guidelines, ROSCO rosacea consensus, North American hidradenitis suppurativa guidelines, EAACI/GA²LEN/EuroGuiDerm/APAAACI urticaria guideline, ACDS 2020 core allergen series, CTCL staging/classification/treatment consensus sources, and BAD alopecia areata guidance. URL-like locator checks covered 49 PubMed/DOI/source URLs; `https://doi.org/10.1111/all.15090` returned a bot-facing 403 during `fetch`, but the PMID/DOI metadata resolved through NCBI and the locator was retained.

**Browser inspection.** Ran `npm run site:dev` and inspected the live mindmap app in Chromium at desktop `1440x900` and mobile `390x844`. The sweep covered all 16 topic routes: acne, alopecia, allergic-contact-dermatitis, atopic-dermatitis, autoimmune-bullous, ctcl, drug-eruptions, hidradenitis-suppurativa, nail-disease, oral-ulcers, pigmented-lesions, pruritus, psoriasis, rosacea, urticaria-angioedema, and vasculitis-purpura. I checked the original failure cases directly: `alopecia` / `aga-causes-concept-map`, `hair-follicle-lifecycle`, and `cicatricial-decision-tree`. After the fixes, the browser sweep found no document-level horizontal overflow, blank diagrams, node overlaps, visibly broken edge paths, unreadably scaled node text, or missing citation drawers; Compare and Atlas views also remained usable where present.

**Additional visual review.** Generated desktop and mobile contact-sheet screenshots for all 16 mindmap routes and inspected the rendered panels. The remaining issue was mobile page chrome: the intro section could use the global 1440px plate width as a flex-item minimum, which clipped intro text and pushed the mindmap controls below the first viewport. Added a mobile first-viewport Playwright regression, constrained the mindmap intro to the viewport (`width: 100%; min-width: 0`), made the mobile header single-column, and converted the "Other mind maps" list into a horizontal scroller so the app controls and diagram selector are visible immediately.

**Review gate.** A fresh reviewer subagent was attempted, but the subagent stream disconnected before returning findings. I completed a manual diff review instead. That review found and fixed an unimported `DecisionTreeStep` type in `layoutEngine.ts`, non-finite ELK coordinate fallbacks that only handled `null`/`undefined` but not `NaN`/`Infinity`, and an outdated CSS comment about the diagram grid. A focused regression test now covers non-finite ELK point sanitization.

**Lockfile decision.** At the start of this session, `git ls-files site/package-lock.json` returned no tracked file and `git check-ignore -v site/package-lock.json` showed `.gitignore:115:package-lock.json`, so the handoff's lockfile decision was still unresolved. Later in the session the worktree changed to include a staged `.gitignore` exception (`!site/package-lock.json`) and a staged `site/package-lock.json`; after this drift was reported, the user instructed the session to continue. I preserved that current state rather than silently reverting it. The lockfile contains `elkjs`, and `git check-ignore -v site/package-lock.json` now returns no ignore rule because the exception makes the nested lockfile addable/tracked.

**Verification.**
- `npm --prefix site run test -- src/apps/mindmaps/diagrams/__tests__/layoutEngine.test.ts` — passed: 1 file, 4 tests.
- Citation audit script over the 25 new diagram files — local shape failures: 0; unique PMIDs: 25; unique DOIs: 5; unique source URLs: 19.
- NCBI ESummary check for those 25 PMIDs — passed: 25 checked, 0 missing PubMed records.
- URL-like locator fetch check for PubMed/DOI/source links from those 25 diagrams — 49 checked; 1 `doi.org` 403 noted above.
- Visual contact-sheet review script — captured `.diagrams-view` panels for all 16 routes at desktop `1440x900` and mobile `390x844`; artifacts stayed under ignored `test-results/visual-review/`.
- `npm --prefix site run test:e2e -- mindmap-diagrams.spec.ts --grep "mobile first viewport"` — failed first with `.view-switcher` top at `866.75px` on a `812px` viewport, then passed after compacting/constraining the mindmap intro.
- `npm --prefix site run test -- src/apps/mindmaps` — passed: 19 files, 143 tests. The only stderr was the intentional invalid-JSON Atlas import test logging its sanitized parse failure.
- `npm --prefix site run test:e2e -- mindmap-diagrams.spec.ts` — passed: 16 Chromium tests, including desktop and mobile geometry checks across every topic diagram. The run emitted repeated `NO_COLOR` / `FORCE_COLOR` warnings from the Playwright web server.
- `npm run site:build` — passed and generated all 16 mindmap topic routes. Vite still warns that lazy `layoutEngine.BUP3xv9U.js` is about 1.45 MB raw / 440 kB gzip.
- Concurrent `npm run site:build` plus Playwright web-server startup reproduced the known `site/dist` race, so final build and e2e verification were rerun separately.
- `git diff --check` — passed after this devlog update.

**Residual risk.** ELK remains a large dependency, but it is isolated behind dynamic imports in `DecisionTreeDiagram.tsx` and `ConceptMapDiagram.tsx`, so the initial `MindMapApp` client chunk stays separate. The citation audit verified locator existence and corrected obvious mismatches, but it was not a formal systematic review of every clinical branch. These diagrams should remain educational references rather than patient-specific medical advice.

---

## [2026-04-19] Phase 8 — Mindmap diagrams redesign

**What changed.** Replaced the single radial-only mindmap view at `/apps/mindmaps/<topic>` with a three-mode view system (**Diagrams · Compare · Atlas**), backed by six typed diagram renderers and a feature-matrix Comparison view. Authored 22 diagrams + 5 comparisons across all five topics (alopecia, CTCL, psoriasis, pruritus, autoimmune bullous). Dropped notes/SRS/presentation/minimap/layout-toggle as side effect of the AtlasView slim-down.

**Why.** The pre-Phase-8 mindmap was a category-tree explorer when residents needed reasoning instruments — diagnostic algorithms, workup pathways, treatment ladders, taxonomies, lifecycles, mechanism graphs, and side-by-side differential comparisons. Atlas chrome (annotations, presentation mode, minimap, layout toggle) added state machines that didn't serve the new purpose.

**Key decisions.**
- **Three top-level views** (`Diagrams` default-when-authored else `Atlas` fallback, plus `Compare`). Atlas demoted to fallback orientation tool.
- **Six diagram types via discriminated union** in TypeScript: `decision-tree | workup-pathway | classification | swimlane | lifecycle | concept-map`. One JSON per diagram, globbed by Vite at build time. No CMS.
- **Comparison view as feature matrix** — rows = features, columns = entities, ★-flagged distinguishers tinted terracotta.
- **Shared SideDrawer** across all three views — click any element → drawer with title + sanitized markdown body + PMID/DOI citation links.
- **Hand-rolled validators** in `schema.ts` (alongside existing Zod) — duplicate-id detection, missing-ref detection per type, null guards.
- **AtlasView extracted as a verbatim copy of the previous MindMapApp body in Task 6, then trimmed in Task 14** — keeps refactor and feature-removal as separate moves so each can roll back independently. MindMapApp shell shrinks from 1542 lines to 38.
- **Tasks 6 + 14 collectively pruned ~143 lines of dead chrome** from AtlasView (annotations textarea + summary, presentation mode className/buttons, layout toggle state/callback/button, minimap state/ref/render/buttons) and the corresponding CSS rules.
- **Site-design contract scan extended to `src/apps/`** (Task 15) — caught and fixed inline glyphs (`✕`, `📋`, `☰`, literal `★` in code comment).
- **Hydration race fix in Playwright** (Task 14 fixup) — wait for `networkidle` + `view-switcher` visibility + `aria-selected` flip before asserting downstream elements; otherwise tab clicks land on un-hydrated SSR HTML.

**Files touched (primary).**
- `site/src/apps/mindmaps/types.ts` — Diagram + Comparison discriminated unions, MindMapManifest gains optional `diagrams[]` + `comparisons[]`
- `site/src/apps/mindmaps/schema.ts` — `validateDiagram` + `validateComparison` with duplicate-id + missing-ref + null-guard checks
- `site/src/apps/mindmaps/dataLoader.ts` — Vite-glob loaders, post-Zod merge so unknown keys aren't stripped
- `site/src/apps/mindmaps/MindMapApp.tsx` (1542 → 38 lines) — thin shell hosting `<ViewSwitcher>` + 3 conditional views
- `site/src/apps/mindmaps/views/{ViewSwitcher,SideDrawer,DiagramsView,CompareView,AtlasView}.tsx` — 4 new + 1 (AtlasView) extracted
- `site/src/apps/mindmaps/diagrams/{DiagramSwitch,DecisionTreeDiagram,WorkupPathwayDiagram,ClassificationDiagram,SwimlaneDiagram,LifecycleDiagram,ConceptMapDiagram}.tsx`
- `site/src/apps/mindmaps/comparisons/ComparisonTable.tsx`
- `site/src/data/mindmaps/{alopecia,ctcl,psoriasis,pruritus,autoimmune-bullous}/diagrams/*.json` (22 files, 4–6 per topic)
- `site/src/data/mindmaps/<topic>/comparisons/*.json` (5 files, 1 per topic)
- `site/src/styles/mindmap.css` — view-switcher, side-drawer, diagrams-view, compare-view, diagram-canvas + per-renderer style blocks; deleted unused presentation-mode/minimap/textarea rules
- `site/src/security/site-design-contract.test.ts` — APPS_ROOT added to SITE_FILES walk
- `site/tests/mindmap-diagrams.spec.ts` — 7 Playwright integration tests (default Diagrams active, library count, decision-tree render, SideDrawer-on-click, Compare matrix, Atlas radial, library navigation)
- `site/tests/atlas-plates.spec.ts` — extended with view-switcher visibility test, hydration-race-resistant mobile-aware test
- 18 vitest test files (1 schema + 1 ViewSwitcher + 1 SideDrawer + 6 diagram renderers + 1 ComparisonTable, plus extension to existing site-design contract)

**Performance / outcome.**
- **Vitest:** 73 (Phase 7 baseline) → 103 passing (+30 new across 26 files).
- **Playwright (Phase 8 verification surface):** 18 (atlas-plates + hydration-clean baseline) → 26 passing (+8: view-switcher visibility test + 7-test mindmap-diagrams spec).
- **Astro production build:** clean, 14 pages.
- **TypeScript:** 0 non-vendor errors.
- **MindMapApp.tsx surface:** 1542 lines → 38-line shell + 1399-line AtlasView.tsx (no net code growth in mindmap subsystem; behavior change is the new diagram + compare libraries).
- **Content authored:** 22 diagrams + 5 comparisons; every authored diagram cites at least one PMID (most cite 2). All 5 topics now default to Diagrams view at first load.

**Open items / Phase 9 candidates.**
- **AtlasView further demotion or deletion** if usage analytics show <5% engagement on the Atlas tab.
- **Cross-app deep links** from concept-map nodes to PASI / SCORTEN / ABCDE calculators (Skinscores integration).
- **Per-node SM-2 spaced-repetition** revisited as a separate `/apps/dermflash` app (deliberately decoupled from the reasoning-instrument mindmap).
- **AI "ask the map"** — natural-language query returning a ranked subgraph (Section C from the original ideation report).
- **ARCHITECTURE.md** does not yet exist for this repo; consider creating one to capture the new `site/src/apps/mindmaps/{views,diagrams,comparisons}/` directory structure and the discriminated-union content model.
- **Codex's `scale²` auto-fit bug** in MindMapApp (now AtlasView line ~1032) is preserved as carry-over from Phase 7; obviated for the Diagrams view (which doesn't share that auto-fit code path) but still affects the Atlas tab.

---

## [2026-04-19] Phase 7 — Atlas hardening + review fixes

**What changed.** Five-part follow-up sweep over the Atlas migration (Phases 0–6 shipped earlier) addressing the punch list from three independent post-ship reviews (Codex adversarial, screenshot re-audit team, mind-map ideation team). Phase 7A hygiene quick wins; 7B legacy-mindmap mobile breakpoint; 7C React hydration root-cause investigation; 7D mind-map Section A — all 8 incremental D3 renderer fixes; 7E final verification + screenshot pass.

**Why.** Three reviews surfaced overlapping issues:

1. **Codex** flagged a stale root `index.html` deployment artifact, an About-page CV CTA that pointed to a non-PDF file, and the legacy CTCL mindmap overflowing on mobile.
2. **Screenshot re-audit team** flagged React hydration warnings on every `client:load` island, a 🌞 / 🌜 emoji contract violation in `MindMapApp.tsx`, and a dashboard SSR/client color mismatch.
3. **Mind-map ideation team** recommended sunsetting the Astro/React `MindMapApp.tsx` and porting the legacy D3 renderer in. Pending that bigger rebuild, they identified 8 incremental Section A fixes that would address "tiny scale + overlapping labels + sparse layout" in the existing renderer.

**Key decisions.**
- **Removed the broken Download CV CTA** (option to relabel was rejected; option to generate a placeholder PDF was deferred).
- **Shipped all 8 Section A mindmap fixes** (vs. just the highest-leverage subset).
- **Investigated React hydration in scope** — found no duplicate React install. The "Invalid hook call" warnings were dev-server HMR transients with stale Vite optimized-deps; production build hydrates clean (4/4 hydration tests pass).
- **Kept** the `framer` and `shaders` rollup `manualChunks` after grep showed they're still actively imported (Hero, Dashboard, ScholarFeedEnhanced).

**Files touched (primary):**
- `index.html` (deleted — stale deploy artifact)
- `site/src/data/profile.json` — removed Download CV from `callToActions`
- `site/src/pages/about.astro` — removed Download CV button; added `aria-hidden` to portrait
- `site/src/apps/mindmaps/MindMapApp.tsx` — A1 fit-to-viewport + A2 ellipse + wrapped labels + A3 Atlas colors + A4 toolbar grouping (View/Export popovers) + A5 default Details intro + A6 mobile linear `<details>` outline + A7 search aria-live + A7 capped pulse animation + emoji removal everywhere (🌞🌜📽️📁📂🗺️🖼️📄💾📥❓🔗✓✕)
- `site/src/styles/mindmap.css` — `--mm-*` Atlas tokens, `.actions-popover` styling, `.details-intro` styling, `.mindmap-outline*` styling, `.mindmap-canvas` skeleton, dark-mode token overrides
- `site/public/apps/MindMaps/shared/mindmap-base.css` — mobile media query: tabs scroll horizontally instead of clipping, toolbar wraps to 2 rows, search row stacks, map ≥ 60vh
- `site/tests/atlas-plates.spec.ts` — 4 new mobile-viewport tests covering legacy CTCL/Alopecia + Astro mindmap
- `site/tests/hydration-clean.spec.ts` — new file, 4 tests asserting zero React hydration warnings on representative pages
- `site/tests/phase7-screenshots.spec.ts` — new file, opt-in screenshot pass via `PHASE7_SCREENSHOTS=1`

**Performance / outcome.**
- Vitest contract suite: 51/51 passing (was 51/51 entering Phase 7, no regressions).
- Playwright atlas-plates suite: 18/18 passing (was 14/14, +4 new mobile tests).
- Playwright hydration-clean suite: 4/4 passing (new this phase).
- Playwright phase7-screenshots: 20/20 captured at desktop 1440×900 + mobile 375×812 across 10 routes; outputs at `site/test-results/phase7/2026-04-19T08-17-56/`.
- `npm run build` clean — 14 pages built in ~9.4s.
- Mind-map UX transformation visually confirmed: nodes now render as wrapped-text ellipses sized to their labels, fitted into the viewport with breathing room, with terracotta highlight on the active node, in Atlas warm palette throughout. Toolbar collapsed from 10 buttons to 4 visible + 2 popovers. Default Details pane shows a topic intro instead of "Select a node…". Mobile gets a native nested `<details>` outline view below the canvas.

**Open items / Phase 8 candidates.**
- Sunset the Astro/React `MindMapApp.tsx` (Section B from the ideation report). The current 1,315-line component still has known regressions vs. the legacy D3 renderer that no amount of incremental polish will fix; the right path is to port the legacy renderer's core into a typed Astro shell.
- Mind-map Section C ambitions (AI "ask the map", per-node SM-2 spaced repetition, cross-app deep links, ACGME milestone view, publication-grade poster export, multi-modal photo→node).
- Generate a real Atlas-styled CV PDF (currently the CTA is removed; restoring it requires a real artifact).
- Lighthouse / performance budgets pass.
- Investigate the WoundCare RMarkdown raw-output rendering (Phase 5 sweep restyled tokens but did not restructure content).
- Surface the screenshot re-audit team's LOW findings (blog secondary text contrast — already verified Atlas-correct, but worth a formal a11y sweep including non-color WCAG criteria).

---

## [2026-04-19] Phase 8 fleet-review remediation (R1–R7)

**What changed.** Addressed all 33 HIGH-confidence findings and 2 MEDIUM from the Phase 8 fleet review (5 angles × 2 models + cross-model verification). Skipped 3 REFUTED findings. TDD-first across all tasks. Vitest grew 112 → 187 (+75 tests), Playwright gained F27/F28 coverage, CI now gates PRs on Playwright.

**Why.** Phase 8 shipped with type-system theatre in the schema validators (F1/F4/F5/F30 — validators declared input as already-validated `Diagram`/`Comparison`, and `requireArray` returned `[]` for missing required arrays, so JSON with missing `lanes`/`stages`/`items` validated as OK then crashed renderers at runtime). Additional clusters: stale persisted state (F2), timer leaks (F18/F19), `navigator.clipboard` unguarded (F23), HTML interpolation bypass (F16), missing exhaustiveness checks (F12), and thin test surface for dataLoader / DiagramSwitch / DiagramsView / CompareView / MindMapApp.

**Key decisions.**
- **R1 — Narrowed `Result<T>` at the trust boundary.** Validators now take `input: unknown` and return `{ ok: true; value: T } | { ok: false; errors: string[] }`. `requireArray` extracted to module scope and distinguishes "missing required" (error) from "optional absent" (empty). Applied to `validateDiagram`, `validateComparison`, and the three legacy validators (`validateMindMapManifest`, `validateMindMapDataset`, `validateMindMapNode`). Non-throwing contract; callers throw at the call site when they need fast-fail on build.
- **R2 — `manifestSchema` now declares `diagrams`/`comparisons`.** Zod was silently stripping them in strip mode; added `z.array(z.unknown()).optional()` so they survive the parse.
- **R3 — dataLoader hardened + covered.** Dropped `import.meta.glob<{default: Diagram}>` generics in favor of `<{default: unknown}>` (verified by validators). Removed redundant `as` casts. Exported `extractTopicFromPath`. Added 8 tests covering per-topic diagram/comparison counts, cache hits, and path-extraction errors.
- **R4 — AtlasView state + lifecycle cluster (6 findings).** Stale persisted/hash `activeTab` now guarded at 4 entry points with fallback to `defaultTab`. `importState` wrapped in try/catch with sanitized `alert`. Inner gesture-hint + zoom-hide + auto-fit timers migrated from `window.__zoomHideTimer`/inline to `useRef`, cleared on unmount. `navigator.clipboard` existence + `writeText` typeof guards before use. `applySearch('')` guarded by `didMountSearchRef` so hash-nav highlights survive initial mount.
- **R5 — Renderer fixes (8 findings).** Exhaustiveness `never` check in DiagramSwitch default arm. Typed ConceptMap `SimulationLinkDatum`. `escapeHtml` helper for DiagramSwitch swimlane text fallback. Empty-state divs in SwimlaneDiagram + DecisionTreeDiagram. Word-wrap init fix (no blank first tspan). Schema reachability check (orphan steps error). `MAX_DEPTH = 10` for Classification + WorkupPathway recursive render.
- **R6 — Coverage gaps (8 findings).** New tests: DiagramSwitch (12 tests including F6 routing, F16 escape, F12 default, F24 payload), DiagramsView (5 tests with F37 reset), CompareView (7 tests with F37), MindMapApp (4 tests for default-view logic). All 6 renderer tests gained `onSelect` payload assertions. ComparisonTable gained missing-entity em-dash test. Playwright gained F27 Atlas sanity + F28 per-renderer mobile overflow.
- **R7 — CI + stale spec.** `mindmap.spec.ts` updated with hydration-wait + Atlas-tab click. `.github/workflows/ci.yml` gained parallel `e2e-playwright` job (chromium-only, `reuseExistingServer: false`) so Playwright gates PRs.
- **R6-followup — view-switcher mobile overflow.** F28 tests surfaced a pre-existing Phase 8 CSS bug — `.view-switcher` tabs extended to 413px at 375px viewport. Added `@media (max-width: 420px)` rules tightening tab padding (`14px 24px` → `12px 8px`), gap (`12px` → `6px`), and letter-spacing (`0.16em` → `0.08em`). Overflow now ~240px at 375.
- **Skipped (REFUTED by Codex verifier) — F20 D3 zoom listener accumulation (`.zoom` namespace reuses handlers), F32 auto-fit `tx`/`ty` math (algebraically equivalent), F35 ConceptMap `<defs>` accumulation (`innerHTML = ''` clears children).**

**Files touched (primary).**
- `site/src/apps/mindmaps/schema.ts` — `Result<T>` narrowing; module-level `requireArray`; non-empty `lanes` rule; BFS orphan reachability check
- `site/src/apps/mindmaps/dataLoader.ts` — `{default: unknown}` globs; `as` casts removed; `extractTopicFromPath` exported
- `site/src/apps/mindmaps/views/AtlasView.tsx` — 6 state/lifecycle fixes + new refs
- `site/src/apps/mindmaps/views/{DiagramsView,CompareView}.tsx` — F37 reset effect
- `site/src/apps/mindmaps/diagrams/{DiagramSwitch,DecisionTreeDiagram,SwimlaneDiagram,ConceptMapDiagram,ClassificationDiagram,WorkupPathwayDiagram}.tsx` — 8 renderer fixes
- `site/src/styles/mindmap.css` — view-switcher mobile media query
- `site/tests/{mindmap,mindmap-diagrams}.spec.ts` — hydration-wait; F27/F28 additions
- `.github/workflows/ci.yml` — parallel Playwright job
- `site/src/apps/mindmaps/__tests__/` + `views/__tests__/` + `diagrams/__tests__/` + `comparisons/__tests__/` — 75 new unit tests

**Performance/outcome.**
- Vitest: 112 → 187 passing (0 failures, 32 test files)
- tsc non-vendor errors: 0 (unchanged)
- Astro build: 14 pages, clean (~10 s)
- Playwright: `mindmap-diagrams.spec.ts` + `atlas-plates.spec.ts` + `hydration-clean.spec.ts` + `mindmap.spec.ts` all green; 107 total pass in the full suite. (13 pre-existing failures in `site-redesign.spec.ts` / `site-runtime.spec.ts` / `skinoculars.spec.ts` / `dermoscopy-llm-dashboard.spec.ts` / `pdf-studio.spec.ts` reference Phase 7-deleted components — out of R1–R7 scope, to triage before commit.)

**Open items.**
- 13 pre-existing Phase 7 Playwright failures for deleted components (AppsGallery, Timeline, StatsCounter, PublicationMetrics, ActivityFeed) need triage before the bundled commit.
- Final Codex adversarial review pending.

---
