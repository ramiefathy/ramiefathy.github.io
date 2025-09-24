# Mind Map Applications Evaluation & Enhancement Roadmap

## 1. Current Implementation Inventory

### 1.1 Shared Runtime & Loading Model
- Every mind map is delivered as a standalone HTML file that loads TailwindCSS and D3 v7 from public CDNs, then mounts a condition-specific stylesheet plus the shared `d3-renderer.js` and `app.js` scripts without any bundler or module system.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L1-L140】【F:apps/CTCLMindMaps/CTCLMindMaps_improved_stable.html†L1-L92】【F:apps/PruritusMindMaps/PruritusMindMaps.html†L1-L82】【F:apps/PsoriasisMindMaps/PsoriasisMindMaps.html†L1-L146】【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullousMindMaps.html†L13-L125】
- The shared controller `initializeMindMapApp` handles tab activation, dropdown toggles, zoom and expand/collapse buttons, cross-tab navigation, and persistence in `localStorage`, while rendering is delegated to `MindMapRenderer` in `d3-renderer.js` which builds a radial SVG visualization with zoom and tooltip handlers.【F:apps/shared/app.js†L1-L287】【F:apps/shared/d3-renderer.js†L3-L858】

### 1.2 Data Authoring & Configuration
- Each app stores clinical content in a monolithic JavaScript object keyed by tab name with nested `children` arrays, `tooltip` objects, and raw HTML strings for detailed content, then passes the structure to `initializeMindMapApp` via a thin app-specific `main.js` bootstrap.【F:apps/AlopeciaMindMaps/Alopecia/js/data.js†L1-L80】【F:apps/CTCLMindMaps/CTCL/js/main.js†L1-L14】【F:apps/PruritusMindMaps/js/main.js†L1-L14】【F:apps/PsoriasisMindMaps/Psoriasis/js/main.js†L1-L14】【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullous/js/main.js†L1-L14】
- Tooltips are injected verbatim into the DOM (`tooltip.html(...)`) without sanitization, mixing presentation and copy while exposing XSS risk should content ever become untrusted.【F:apps/shared/d3-renderer.js†L805-L809】

### 1.3 Interface Layout & Controls
- Shared UI conventions include a centered title block, global search input with clear button, tab bar (sometimes with dropdown submenus), and a fixed 4:3 visualization container with zoom and expand/collapse controls positioned in the top-right corner.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L24-L88】【F:apps/CTCLMindMaps/CTCLMindMaps_improved_stable.html†L19-L80】【F:apps/PruritusMindMaps/PruritusMindMaps.html†L19-L76】
- Tabs and dropdowns are rendered with `<div>` and `<a>` elements lacking semantic roles or keyboard bindings; keyboard affordances are inconsistent across applications despite documentation claims in legacy READMEs.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L37-L57】【F:apps/CTCLMindMaps/CTCLMindMaps_improved_stable.html†L31-L53】【F:apps/CTCLMindMaps/README.md†L30-L58】

### 1.4 Search, State & Persistence
- Global search traverses every node’s name and tooltip content, slices results to 15 entries, and navigates by expanding the relevant path; state (active tab, expansion map) is stored in `localStorage` without try/catch guards, so privacy-restricted browsers will throw and halt persistence.【F:apps/shared/app.js†L124-L199】
- Search results are rendered as transient anchors inside a custom container with no keyboard navigation, and search is disabled entirely for the Autoimmune Bullous app via configuration.【F:apps/shared/app.js†L180-L199】【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullous/js/main.js†L1-L14】

### 1.5 Styling & Theming
- Each application defines bespoke global CSS (either via `css/main.css` or inline `<style>` blocks) using hard-coded hex values, bespoke keyframes, and globally scoped selectors; there is no shared theming, dark mode, or `prefers-reduced-motion` handling.【F:apps/AlopeciaMindMaps/Alopecia/css/main.css†L1-L160】【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullousMindMaps.html†L23-L97】

### 1.6 Condition-Specific Variations
- **Alopecia:** Adds a cache-busting loader for shared scripts, a treatment dropdown with multiple sub-tabs, and detailed data covering approach, classification, diagnostic tools, modality, multiple treatment branches, and counseling.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L45-L140】【F:apps/AlopeciaMindMaps/Alopecia/js/data.js†L3-L80】
- **CTCL:** Exposes two dropdown groups (subtypes and treatment) and reuses the shared runtime with blue theming; the directory includes extensive optimization scripts, screenshots, and clinical verification notes documenting prior tuning efforts.【F:apps/CTCLMindMaps/CTCLMindMaps_improved_stable.html†L31-L91】【F:apps/CTCLMindMaps/README.md†L1-L64】
- **Pruritus:** Uses a two-row tab layout instead of dropdowns and maintains parity with shared scripts; repository notes call out UI/UX and performance gaps such as renderer recreation, missing breadcrumbs, and search event leaks.【F:apps/PruritusMindMaps/PruritusMindMaps.html†L31-L75】【F:apps/PruritusMindMaps/UI_UX_CRITICAL_REVIEW.md†L1-L120】
- **Psoriasis:** Mirrors the shared shell but ships as a monolithic HTML bundle that also embeds custom D3 layout logic, complicating reuse; tabs span pathophysiology, subtypes, comorbidities, PsA, and multiple treatment breakdowns.【F:apps/PsoriasisMindMaps/PsoriasisMindMaps.html†L1-L146】
- **Autoimmune Bullous:** Distributed as a conversational export combining prose, inline styling, bespoke D3 code, and data definitions in a single file; a separate directory contains the stabilized version that relies on the shared runtime but keeps search disabled.【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullousMindMaps.html†L13-L197】【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullous/js/main.js†L1-L14】

### 1.7 Existing QA & Tooling Assets
- Automated smoke coverage exists via `apps/test_all_mindmaps.js`, which launches each HTML file with Playwright, cycles tabs, triggers expand-all, and captures screenshots; numerous condition-specific scripts target layout overlap, dropdown regression, and UI fixes, but none are wired into CI or a package-managed toolchain.【F:apps/test_all_mindmaps.js†L1-L114】【F:apps/CTCLMindMaps/README.md†L15-L28】【F:apps/PruritusMindMaps/UI_UX_CRITICAL_REVIEW.md†L35-L120】

## 2. Limitations & Pain Points
1. **No modern build system:** Direct CDN usage and global scripts prevent code splitting, offline use, dependency pinning, or shared component reuse across the Astro site.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L8-L140】
2. **Global namespace & duplication:** Each HTML file replicates similar markup and initialization; Autoimmune Bullous and Psoriasis embed custom D3 logic, fragmenting the runtime and making enhancements harder to share.【F:apps/PsoriasisMindMaps/PsoriasisMindMaps.html†L96-L208】【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullousMindMaps.html†L155-L208】
3. **Unsafe tooltip rendering:** Unsanitized HTML injection exposes security risk and complicates localization or content review workflows.【F:apps/shared/d3-renderer.js†L805-L809】
4. **Accessibility gaps:** Tabs lack ARIA roles, dropdowns rely on hover, and search results are non-semantic anchors, limiting screen-reader and keyboard usability despite documentation claims of full accessibility.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L37-L57】【F:apps/CTCLMindMaps/README.md†L39-L58】
5. **Performance issues on large trees:** Renderer recomputes layouts on every tab switch without caching; Pruritus review notes highlight expensive rerenders, memory leaks, and lack of virtualization for dense datasets.【F:apps/shared/app.js†L66-L120】【F:apps/PruritusMindMaps/UI_UX_CRITICAL_REVIEW.md†L35-L120】
6. **Persistence fragility:** `localStorage` is used directly without fallbacks, so private browsing or quota issues can break expansion state saving.【F:apps/shared/app.js†L124-L140】
7. **Testing not automated:** Playwright scripts and layout utilities exist but are manual; there is no linting, unit testing, or CI integration alongside the Astro project.【F:apps/test_all_mindmaps.js†L1-L114】
8. **Content editing friction:** Large JavaScript data files with embedded HTML are hard to maintain, deduplicate, or translate; no schema validation prevents malformed entries from breaking rendering.【F:apps/AlopeciaMindMaps/Alopecia/js/data.js†L3-L58】

## 3. Frontend Modernization Program (No Backend Required)

### 3.1 Tooling, Architecture & Documentation
1. **Adopt Astro/Vite pipeline:** Relocate each HTML entry into `site/src/pages/apps/mindmaps/<condition>.astro`, import shared components, and manage Tailwind/D3 via npm to enable bundling, hashed assets, and offline-friendly builds. Migrate `apps/shared` logic into ES modules under `site/src/apps/mindmaps/` with explicit exports and TypeScript typings for configs and data nodes.【F:apps/shared/app.js†L1-L297】【F:apps/shared/d3-renderer.js†L3-L858】
2. **Establish package tooling:** Add ESLint, Prettier, and TypeScript configs that cover the shared renderer/controller, plus Vitest for unit tests. Wire `npm run site:build`, lint, tests, and Playwright smoke suite into CI to guarantee regression protection.【F:apps/test_all_mindmaps.js†L1-L114】
3. **Centralize templating:** Replace per-condition HTML duplication with shared Astro layouts/components for headers, search blocks, tab bars, and control clusters. Use configuration-driven metadata (title, palette, default tab) to instantiate condition pages.
4. **Document architecture:** Produce contributor docs describing the module layout, build commands, data schema, and testing matrix so future editors can onboard quickly. Surface existing review artefacts (e.g., CTCL verification, Pruritus UX review) within the documentation site.【F:apps/CTCLMindMaps/README.md†L1-L64】【F:apps/PruritusMindMaps/UI_UX_CRITICAL_REVIEW.md†L1-L120】

### 3.2 UX, Accessibility & Feature Enhancements
1. **Semantic navigation:** Rebuild tab lists with `<button role="tab">` elements grouped in `<div role="tablist">`, manage focus/keyboard navigation (ArrowLeft/Right/Down), and expose dropdowns as button-triggered menus with `aria-expanded`/`aria-controls`. Provide skip links and `<main>` landmarks for screen readers.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L37-L57】【F:apps/CTCLMindMaps/CTCLMindMaps_improved_stable.html†L31-L53】
2. **Mind map keyboard support:** Extend `MindMapRenderer` to assign focusable nodes, allow arrow-key traversal, and trigger expand/collapse via Enter/Space. Announce selection context through ARIA live regions and maintain focus on highlighted nodes during search navigation.【F:apps/shared/d3-renderer.js†L820-L855】
3. **Search overhaul:** Replace substring search with Fuse.js (or similar) indexing node names, tooltip Markdown, synonyms, and metadata; surface grouped results with breadcrumb context, keyboard navigation, and pagination instead of hard-coded 15-item slices.【F:apps/shared/app.js†L144-L199】
4. **Breadcrumbs & minimap:** Display the active node’s ancestry above the canvas and add an optional minimap overlay that indicates the current viewport to aid orientation in dense CTCL or Psoriasis trees.
5. **Multiple layout modes:** Offer radial, vertical tree, and force-directed layout options with animated transitions; expose a configuration toggle so users can pick the clearest layout for a given dataset.【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullousMindMaps.html†L166-L208】
6. **Annotations & bookmarking:** Allow users to attach personal notes to nodes, store them locally (with export/import JSON), and display badges when annotations exist. Provide quick filters for bookmarked nodes to support study workflows.
7. **Print & export tools:** Add controls to export the current view as PNG/PDF (respecting theme and zoom), plus a presentation mode that hides UI chrome for teaching sessions.
8. **Theming & accessibility preferences:** Migrate palettes to CSS custom properties driven by Tailwind tokens, offer dark/high-contrast themes, and honor `prefers-reduced-motion` by disabling pulse animations. Include font-scaling controls for readability.【F:apps/AlopeciaMindMaps/Alopecia/css/main.css†L1-L160】
9. **Internationalization:** Externalize UI strings and convert tooltip content to Markdown that can be localized. Provide a language switcher that loads locale-specific datasets and updates search index accordingly.
10. **Contextual help:** Offer inline onboarding (keyboard shortcuts, navigation tips) triggered by a help button or `?` key so new users can learn controls quickly.【F:apps/CTCLMindMaps/README.md†L39-L58】

### 3.3 Data & Content Management
1. **Structured content files:** Break monolithic `data.js` files into per-tab JSON or YAML with Markdown tooltip bodies. Validate content against a JSON Schema/Zod definition covering IDs, names, tooltip fields, metadata, and child ordering before bundling.【F:apps/AlopeciaMindMaps/Alopecia/js/data.js†L3-L58】
2. **Metadata enrichment:** Add fields such as `tags`, `evidenceLevel`, `sources`, `lastReviewed`, and `relatedNodes` to support filtering, color coding, and cross-map linking.
3. **Shared taxonomy:** Maintain a canonical glossary of disease names, treatments, and abbreviations to prevent inconsistencies (e.g., aligning CTCL subtype naming with Psoriasis comorbidity references). Use the taxonomy for search synonym expansion.
4. **Editorial workflow:** Provide CLI scripts or a lightweight form-based editor that can scaffold new tabs/nodes, lint Markdown, and preview changes locally, lowering the barrier for subject matter experts.

### 3.4 Performance & Technical Optimizations
1. **Renderer modularization:** Refactor `MindMapRenderer` to expose layout strategies, spacing constants, and animation durations via options. Remove debug logs and console noise for production builds.【F:apps/shared/d3-renderer.js†L21-L157】
2. **Layout caching & virtualization:** Cache computed node positions per tab and viewport size (e.g., in memory keyed by dataset hash) to avoid full recomputation on each switch, and lazily render child nodes for very large datasets to cut DOM weight.【F:apps/shared/app.js†L66-L120】【F:apps/PruritusMindMaps/UI_UX_CRITICAL_REVIEW.md†L35-L120】
3. **Standardize on D3 layouts:** Replace bespoke radial math with D3’s `cluster`/`tree` layouts configured for polar coordinates, retaining fixed-sector behavior as an optional plugin but defaulting to well-tested layout engines.【F:apps/AutoimmuneBullousMindMaps/AutoimmuneBullousMindMaps.html†L167-L200】
4. **Touch & gesture support:** Add pointer event handlers for pinch-zoom, double-tap focus, and inertial panning to improve tablet usability.
5. **Offline readiness:** Bundle dependencies via Vite and add a service worker (Workbox) to cache scripts, data JSON, and assets for offline teaching sessions. Provide fallback fonts when Google Fonts are unavailable.【F:apps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html†L8-L140】
6. **Robust persistence layer:** Wrap `localStorage` access in try/catch with in-memory fallback; expose export/import of expansion and note state for sharing between machines.【F:apps/shared/app.js†L124-L140】

### 3.5 Quality Assurance & Observability
1. **Automated testing matrix:** Create unit tests for search indexing, tooltip sanitization, layout utilities, and persistence serialization; evolve existing Playwright scripts into a full regression suite covering keyboard navigation, dropdowns, theming, and export flows.【F:apps/test_all_mindmaps.js†L1-L114】
2. **Visual regression guardrails:** Capture canonical screenshots per condition (default view, expanded branches, search highlight) and integrate image diffing in CI.
3. **Static analysis:** Run ESLint, Stylelint (if needed), and accessibility scanners (axe-core) during CI to catch regressions early.
4. **Telemetry abstraction:** Introduce a no-op analytics adapter inside the shared controller so click/search events can later be piped to logging without refactoring. Expose a developer console overlay for debugging node data and performance metrics.
5. **Knowledge base:** Consolidate existing review documents (CTCL verification, Pruritus UX audit) into a single documentation hub with change logs and regression tracking to ensure institutional knowledge persists.【F:apps/CTCLMindMaps/README.md†L1-L64】【F:apps/PruritusMindMaps/UI_UX_CRITICAL_REVIEW.md†L1-L120】

## 4. Backend-Enabled Expansion Opportunities
While the near-term roadmap remains frontend-only, preparing for a backend unlocks significant future value:
1. **Content service & versioning:** Store mind map data, notes, and metadata in a database with revision history, serving sanitized JSON via REST/GraphQL so clinician editors can update content without redeploying static assets. Pair with role-based workflows and approval queues.
2. **User accounts & personalization:** Persist expansion state, saved nodes, annotations, and theme preferences across devices. Support shared workspaces for residency programs or clinics.
3. **Collaborative authoring:** Enable multi-user editing, threaded comments on nodes, and suggestion review using WebSockets or CRDTs for real-time collaboration.
4. **Advanced search & recommendations:** Offload indexing to Elasticsearch/Postgres full-text to power cross-map search, synonyms, and “related nodes” recommendations based on shared tags or usage data.
5. **Analytics & adaptive learning:** Capture anonymized interaction telemetry to generate dashboards, identify high-value content, and feed adaptive learning modules (quizzes, spaced repetition) keyed to node IDs.
6. **External integrations:** Fetch practice guideline updates or PubMed abstracts automatically, trigger diff visualizations for clinicians, and optionally integrate AI services that summarize nodes or suggest differential diagnoses under editorial control.

## 5. Implementation Phasing
1. **Phase 0 – Audit & Foundation:** Inventory datasets, align naming across conditions, define JSON/Zod schema, and migrate shared renderer/controller into ES modules with TypeScript types.
2. **Phase 1 – Build & Theming:** Integrate Astro/Vite pipeline, replace CDN dependencies, centralize layouts/components, implement theming variables, and stand up lint/test automation.
3. **Phase 2 – Accessibility & UX Core:** Rebuild semantic navigation, add keyboard/touch support, implement Fuse-based search with breadcrumbs, and introduce tooltip sanitization plus Markdown content pipeline.
4. **Phase 3 – Advanced Features:** Ship annotations, export tools, alternative layouts, minimap, and layout caching/virtualization. Launch documentation site for authors and testers.
5. **Phase 4 – Observability & Prep for Backend:** Add telemetry adapter, service worker caching, comprehensive Playwright/visual regression coverage, and finalize API interfaces/persistence abstractions ready to swap to backend services when prioritized.

By following this roadmap—grounded in the current codebase and augmented with targeted enhancements from architectural refactors to learner-focused UX features—the dermatology mind map suite can graduate from static demos to professional-grade, extensible educational applications while staying backend-agnostic yet backend-ready.
