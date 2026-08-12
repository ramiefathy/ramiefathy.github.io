# App Redesign Specs (round 2.1 — errata pass)

Concrete redesign specs derived from the Playwright walkthrough of the 6 in-repo apps, refined after a structured Codex critique (round 1 → round 2), then again after a Codex review-of-review (round 2 → 2.1 errata). A Gemini consultation was attempted but went off-spec and was rolled back; its feedback is not incorporated.

Each spec is structured: **Problem · Solution · Files · Copy · Layout · Behavior · Acceptance**.

Refinement provenance is implicit; the change log at the bottom names the items added or revised in round 2.

Not in scope: the Astro Dermoscopy LLM Dashboard (it sets the bar; LOW polish-only gaps deferred to follow-up).

---

## Cross-cutting · Shared shell

### Spec A — Per-app kicker (replaces "Legacy")

**Problem.** `site/public/apps/shared/legacy-shell.js:91` hardcodes a "Legacy" kicker on the toolbar of every shared-shell app. The catalog markets the same apps as `Active` / `Featured`. The frame the visitor sees flips between portfolio-grade and "deprecated, careful."

**Solution.**
1. Move app `category` into `site/src/data/apps.json` as the single source of truth — used by the catalog's filter chips, the catalog sort order, and now the shared-shell kicker. No duplicated taxonomy in DOM attributes.
2. The shell reads the kicker label from `document.body.dataset.shellKicker`. Each shared-shell HTML app sets this attribute in its `<body>` tag, with the value mirrored from the app's `category` in `apps.json` (single source of truth). Drift is caught by a Vitest policy test in `site/src/security/` that loads both `apps.json` and the HTML, parses the body attribute, and asserts they agree per app.
3. Whitelist the allowed kicker values (`Clinical`, `Reference`, `Learning`, `Productivity`, `Research`) to prevent accidental `Demo` / `Test` / `Legacy` from leaking into production chrome. Absence (no attribute) hides the kicker entirely.

**Files.**
- `site/src/data/apps.json` — add `"category"` field per in-repo app (values: clinical | reference | learning | productivity | research)
- `site/src/pages/apps/index.astro` — derive filter chips from `apps.json` categories (already partially does this); ensure single source of truth
- `site/public/apps/shared/legacy-shell.js:91` — render kicker `<span>` only if `data-shell-kicker` matches the whitelist
- HTML app entrypoints — set `data-shell-kicker="<Category>"` directly on `<body>`, with category mirroring `apps.json`. The drift-prevention is the Vitest policy test (see Files); no build-time templating needed for static HTML.
- New test: `site/src/security/app-kicker-consistency.test.ts` — parses each shared-shell HTML's `<body data-shell-kicker>` and asserts it matches the categorized value in `apps.json`.

Category assignments for in-repo apps, **using the catalog slug from `apps.json`**:

| Slug (apps.json) | HTML file | Category | Kicker |
|---|---|---|---|
| `dermatology-scribe` | `site/public/apps/dermatology-scribe/index.html` | clinical | `Clinical` |
| `dermatopathology-navigator` | `site/public/apps/dermatopathology-modern/index-fixed.html` | learning | `Learning` |
| `mindmaps` | (Astro route — no legacy shell) | learning | — |
| `dermoscopy-llm-dashboard` | (Astro route — uses Atlas plate-stamp) | research | — |
| `biologic-monitoring` | `site/public/apps/biologic-monitoring-dashboard/index.html` | reference | `Reference` |
| `pdf-tools` | `site/public/apps/pdf-studio.html` | productivity | `Productivity` |

Note that file paths and catalog slugs sometimes diverge by history (e.g. `pdf-tools` slug, `pdf-studio.html` file). The slug from `apps.json` is the canonical identifier for category/sort/search; file paths are implementation detail.

**Copy.** Single-word labels matching the catalog's filter chip vocabulary. Title case in the chip.

**Layout.** Same toolbar slot as today. When absent, the `.legacy-shell__title` element collapses to just the tool name with no empty pixel space.

**Behavior.**
- Whitelist check at render time — unknown values render no kicker rather than passing through.
- No `data-shell-kicker="None"` pattern — absence (no attribute) is the off state.

**Acceptance.** Zero occurrences of "Legacy" as a kicker in the rendered DOM across the 4 shared-shell apps. Catalog filter chip values, sort order, and shell kickers all read from the same field in `apps.json`.

---

### Spec B — Save state + dataset currency (split chips)

**Problem.** `legacy-shell.js:107` initializes the timestamp chip with `Updated ${formatTime()}` on every paint — a fresh RAMIE session shows "Updated 9:53 PM" before the user does anything. Reference tools have separate concerns: dataset currency (e.g., "Sep 23, 2025") vs save state (filter changes, favorites). Conflating them into one chip drops information and lies on first paint.

The Biologic Monitoring page also has a date bug: the hero hardcodes "September 23, 2025" while `app.js:758` renders the date from `data.js`. The two values can diverge — they were inconsistent at the time of the walkthrough.

**Solution.**

1. **Split the chip into two slots**: `[Save state]` and `[Dataset currency, optional]`.
2. **Save-state lifecycle**: `Ready` (initial, no timestamp) → `Unsaved` (dirty, still no timestamp) → `Saved` + timestamp (after confirmed save). Timestamp updates only on confirmed save events, not on dirty transitions. `Saving…` is reserved for apps that have an *actual* async save operation in flight (e.g., RAMIE session writes); apps with purely local state changes (Biologic filter changes, PDF Studio controls) move between `Ready` and `Unsaved` only.
3. **API split**: replace the current `statusApi.setSaved(boolean)` with three explicit methods:
   - `statusApi.markDirty()` → sets chip to `Unsaved`
   - `statusApi.markSaving()` → sets chip to `Saving…` (use only for true async writes)
   - `statusApi.markSaved()` → sets chip to `Saved · <time>`
4. **Dataset-currency chip is opt-in via API, not data attribute.** The app's own JS (which already imports its data module) calls `LegacyShell.setDatasetCurrency(text)` after loading; the shell renders the chip. This avoids a brittle cross-module dynamic-import contract and works whether the data module exports `dataVersion`, `DATA_VERSION`, or no version at all — the app decides what to pass.

**Files.**
- `site/public/apps/shared/legacy-shell.js:75–110,198` — restructure status API (`markDirty` / `markSaving` / `markSaved` / `setDatasetCurrency`), drop the on-boot `setSaved(true)`, render the second chip slot when `setDatasetCurrency` is called
- `site/public/apps/biologic-monitoring-dashboard/app.js` — after data loads, call ``LegacyShell.setDatasetCurrency(`Data as of ${formatVersionDate(dataVersion)}`)``. Existing `dataVersion` export (`data.js:932`, value `'2025-09-23'`) is already in use; no rename needed.
- `site/public/apps/biologic-monitoring-dashboard/index.html:26` — remove the hardcoded "September 23, 2025" hero text (the chip now carries currency)
- Other shared-shell apps — no `setDatasetCurrency` call, just the save-state chip

**Copy.**
- Save-state values: `Ready` (initial, no timestamp) · `Unsaved` (after `markDirty`, no timestamp) · `Saving…` (after `markSaving`, async only) · `Saved · <time>` (after `markSaved`)
- Dataset-currency: `Data as of <date>` — passed by the app via `setDatasetCurrency()`, not duplicated in HTML or hardcoded

**Layout.** Two chips in the existing status group: save-state on the left, dataset-currency to the right when present. Each chip is otherwise styled like today's chips.

**Behavior.**
- `Ready` on first paint, no timestamp
- First `markDirty()` → `Unsaved`, still no timestamp
- `markSaving()` (async-save apps only) → `Saving…`
- First `markSaved()` → `Saved · <time>`; subsequent saves update the timestamp
- The dataset-currency chip renders independently and never changes during a session (it reflects the loaded data module's version)

**Acceptance.** Open any shared-shell app fresh: no wall-clock time shown before user activity. Open Biologic Monitoring: hero shows no date in prose; the `Data as of` chip reads from `data.js`; the value matches `data.js` exactly (no contradiction with hero prose).

---

## Per-app specs

### Spec 1 — Catalog (`/apps`): outcomes, search, featured-first

**Problem.** Cards describe stack ("React 18 / Firebase / Real-time Sync") instead of outcomes. Default sort is by registration order (`III.01`, `III.02`, …), not by what's best for the reader. Catalog search currently indexes name + stack only — adding outcome lines without indexing them would make search worse, not better. Auto-generated preview images can read as fake polish rather than real content.

**Solution.**

1. **Outcome line per app** — one sentence answering "what does this do for me." Stack tags retained but visually de-emphasized.
2. **Sort key**: `featured` boolean DESC → category in display order (clinical → research → reference → learning → productivity) → `sortRank` (new field, falls back to source order) → name. Tie-breakers are explicit so future additions slot in predictably.
3. **Search indexes** name + outcome + description + category + stack. Currently it only indexes name + stack (`site/src/pages/apps/index.astro:126`).
4. **Preview images only when real screenshot exists.** Don't generate decorative SVG previews for symmetry — visitors notice. Cards without a real preview show only the editorial card (badge, name, outcome, stack); no fake header strip.

**Files.**
- `site/src/data/apps.json` — add `"outcome"` (string) and `"sortRank"` (number, optional) fields per app; align `category` per Spec A
- `site/src/pages/apps/index.astro` — sort logic; expanded search index; header subhead copy
- `site/src/components/AppsShowcase.jsx` (or equivalent card template) — surface `outcome`, demote `stack`, gate preview image on real screenshot existing

**Copy (outcome lines, revised).**

| Slug | Outcome line |
|---|---|
| `dermatology-scribe` | Draft a dermatology note from transcript text or a connected scribe backend. |
| `dermatopathology-navigator` | Study dermpath patterns with search, flashcards, and references. |
| `mindmaps` | Explore dermatology topics as interactive concept maps. |
| `dermoscopy-llm-dashboard` | See how 17 multimodal LLMs perform on dermoscopy. |
| `biologic-monitoring` | Look up baseline labs and follow-up for biologics. |
| `pdf-tools` | Edit, extract, and clean PDFs without uploading them. |
| `skinoculars` | Explore dermatologic anatomy in interactive 3D. |
| `clinisched` | Plan residency schedules with AI rule checking. |
| `skinscores` | Run common dermatology scoring tools with citations. |
| `ksa-sovereign-credit-analytics` | Saudi sovereign credit monitoring (private — behind auth). |

Subhead update:

```text
Apps & projects · 2026.
Local-first by default.
Clinical, reference, learning, and workflow tools.
```

(Drops the meta-copy "— featured first, then by category —"; replaces with a value statement.)

**Layout.** Card structure top-to-bottom (when a real preview exists): preview image (16:9, ~280×158) → status badge row (`III.01 · Active`) → bold app name → **outcome line** (~14–16px) → stack tags as muted small caps (~11px). When no preview: status badge row is the top element, no fake image.

**Behavior.** Filter chips work as today. Sort is featured-first by default. Search across all indexed fields.

**Legacy apps removed from catalog.** `DermAI Reference Generator` and `AI Dermatology Scribe (Legacy HTML)` are `status: legacy` in `apps.json`. The catalog filters them out entirely; they remain accessible only via `/legacy/`. Filter chip counts exclude them. Search does not match them. Their `apps.json` entries stay so the data is still authoritative, but the `/apps/` page treats `status: legacy` as a hidden flag.

**Acceptance.** A visitor on `/apps` can read 10 outcomes in under 30 seconds. Featured apps appear in the top row at desktop widths. Search for "labs" or "schedules" or "dermpath" finds the right card.

---

### Spec 2 — RAMIE: text-mode-first, gate audio only, conditional privacy

**Problem.** The Quick Start modal says "Configure backend connection settings before starting a mode." The Connection Settings panel is a sidebar that requires hunting. A first-time visitor clicks "Begin transcription" and hits an unconnected client. But the existing app has a fully working **text mode** that doesn't require a backend — gating *all* Quick Actions on connection setup hides a useful path. Audio-privacy reassurance is absent above the fold, and any reassurance has to remain true after the user connects a backend.

**Solution.**

1. **Three Quick Actions, not two** — `Start text note` (no backend needed) · `Start audio visit` (gated on connection) · `Resume session`. The collapse-to-two from round 1 was wrong — it would have hidden the offline-friendly text path.
2. **Setup card surfaces inline when backend not configured** — visible card above Quick Actions; user can fill URL + token there or click `Start text note` to bypass.
3. **Privacy copy is conditional**:
   - Pre-connection: `Nothing leaves this browser until a backend is connected.`
   - Post-connection: `Audio and transcripts are sent to the configured backend for processing.`
4. **Backend validation** at save time and at connect time covers: invalid `ws://`/`wss://` URL, missing token, expired JWT (server replies `4008`), connection refused, microphone permission denied, HTTPS page attempting insecure `ws://` (which browsers block silently).

**Files.**
- `site/public/apps/dermatology-scribe/index.html` — restructure landing region, three Quick Actions, conditional privacy line element
- `site/public/apps/dermatology-scribe/app.js:2683` — Quick Action gating (only audio actions block on missing config)
- `site/public/apps/dermatology-scribe/style-modern.css` — setup card and gated-action tooltip styles
- `services/ai-scribe/app.py` — no changes; existing JWT/subprotocol auth is unchanged

**Copy.**
- Setup card heading: `Connect RAMIE backend`
- Setup card body: `Set your WebSocket URL and access token to enable audio visits. Settings stay on this device.`
- Fields: `WebSocket URL` (placeholder `ws://localhost:8765`), `Access token` (password input), `Remember token on this device` (checkbox; off = session storage per existing README behavior)
- Setup CTA: `Save & connect` (primary)
- Setup secondary: `Continue in text mode` (links to text mode)
- Privacy line (below Quick Actions):
  - Pre-connection: `Nothing leaves this browser until a backend is connected.`
  - Post-connection: `Audio and transcripts are sent to your connected backend (<host>) for processing.`
- Quick Action labels: `Start text note` · `Start audio visit` · `Resume session`
- Tooltip on disabled `Start audio visit`: `Connect a backend to start an audio visit.`
- Validation error copies:
  - `URL must start with ws:// or wss://`
  - `Access token is required`
  - `Token expired — re-authenticate to reconnect.`
  - `Microphone access blocked — check browser permissions.`
  - `Insecure WebSocket URL on HTTPS page — use wss:// instead.`

**Layout.** Top-to-bottom: RAMIE wordmark + tagline → research/demo disclaimer line (kept visible, see below) → setup card (only when not configured) → command input → Quick Actions (3) → conditional privacy line → footer.

Research/demo disclaimer — currently in the footer only. Move a short version above the fold: `Research and demonstration tool — not for actual medical use.` Clinical accuracy/trust matters more than visual minimalism here.

**Behavior.**
- First load, no saved config: setup card visible; `Start audio visit` disabled with tooltip; `Start text note` and `Resume session` work
- After Save & connect: setup card collapses to `Backend ✓ · <host> · Edit` chip in header; `Start audio visit` enabled; privacy line swaps to post-connection variant
- Connection drop mid-session: chip shows `Backend ⚠ · Reconnecting…`; on permanent failure → `Backend ✗ · Edit` and audio actions disable
- Returning visit with saved token: setup card hidden, header chip shows

**Acceptance.** A first-time visitor with no backend can start a text-mode note in one click. Audio visit is gated and the gating is obvious. Privacy copy is true at every state.

---

### Spec 3 — Dermpath Navigator: search-first + precompile (decouple migration)

The round-1 spec coupled UX changes with a full Astro-island migration. Codex flagged this as scope-too-large — the build problems (in-browser Babel + Tailwind) are urgent and fixable without a platform move. Decoupling lets the urgent work ship first.

**Problem (UX).** A 90+-option `<select>` is the primary nav. View modes (Grid / Flashcards / Network) have no orienting cue. "Progress Overview 0%" is empty-state-as-decoration before any user activity. Curated thumbnails risk teaching by vague reaction patterns rather than authored content.

**Problem (build).** `vendor/tailwindcss.browser.js` + `vendor/babel.min.js` recompile JSX/CSS in the browser on every load (`site/public/apps/dermatopathology-modern/index-fixed.html:12,16`). Console warnings; slow first paint. Contradicts the "Modern UI" claim.

**Solution part A (UX).**

1. **Search-first.** Header carries a `Search findings` button labeled with both `⌘K` and `Ctrl+K` (do not assume macOS). Opens a fuzzy search modal across all 90+ findings (Fuse.js is already in `site/package.json`).
2. **Curated landing derived from data**, not enumerated in the spec. Pull the 8–12 most-authored or owner-prioritized findings from the existing data module; render thumbnail cards. If thumbnail assets are missing, render text-only pattern cards with the defining clue inline — no decorative slop.
3. **Browse-all drawer preserves textbook source groupings** (Ko / Rapini / Alikhan / Lipoff / Jackson / Mnemonics / additional ref sheets). The dropdown demoted, the taxonomy that helps experienced learners kept intact.
4. **Hide Progress Overview when count = 0.** Replace with a static `Tip` card that disappears once the user has activity. Defer the `Generate Study Plan` button replacement to the owner — that's a feature decision, not a layout one.
5. **View mode toggle gets persistent active state** — pill style, thicker border on active.

**Solution part B (build).**

1. **Precompile now** (urgent, ship before any UX work): Tailwind CLI pass produces a static stylesheet; replace `vendor/babel.min.js` with build-time JSX compilation; drop the two vendor scripts. App stays at its current URL.
2. **Astro island migration later** (optional): move source to `site/src/apps/dermatopathology-navigator/` as a deliberate, separate project. Preserves localStorage by reading/writing the same keys at the new route, with a redirect from `/apps/dermatopathology-modern/index-fixed.html`.

**Files.**

Precompile (Part B step 1):
- `site/public/apps/dermatopathology-modern/build.mjs` — new build script (Tailwind CLI + esbuild/swc for JSX)
- `site/public/apps/dermatopathology-modern/index-fixed.html:12,16` — drop `vendor/babel.min.js` and `vendor/tailwindcss.browser.js`, add compiled CSS link
- `package.json` (root) — script: `site:build-dermpath`

UX (Part A):
- App JS — replace top-level `<select>` with `Search findings` button + curated thumbnail grid + drawer
- New: thumbnail assets under `site/public/apps/dermatopathology-modern/thumbs/` (only when authored)

**Copy.**
- Header search affordance label: `Search findings` (with `⌘K / Ctrl+K` in helper text)
- Empty landing heading: `Start with a pattern`
- Empty landing subcopy: `Pick a common starting point, search by name, or browse all 90+ findings by textbook source.`
- Browse-all link: `Browse all findings (90+)`
- Drawer section headers: textbook source names as today
- Empty progress tip: `Save findings as you study — your progress will appear here.`

**Layout.**
- Header row: title (left) · `Search findings ⌘K / Ctrl+K` (right) · existing icon buttons
- View mode toggle row: Grid / Flashcards / Network (active state visible)
- Main canvas: thumbnail grid OR selected finding view, depending on state
- Right rail: Clinical Correlations (kept), Tip card (replaces empty Progress Overview)

**Behavior.**
- `⌘K` or `Ctrl+K` opens fuzzy search overlaying canvas; typing narrows; Enter loads
- Thumbnails keyboard-navigable (tab/arrow)
- Selected finding persists across view-mode switches
- No console warnings after precompile

**Acceptance.**
- Lighthouse: no in-browser-transformation warnings; FCP < 1.5s on cable
- Search: top 5 results relevant after 2–4 characters typed; any finding reachable without scrolling
- Landing shows no progress chrome to a fresh user
- Drawer preserves textbook source groupings

---

### Spec 4 — Biologic Monitoring: card-face data with severity-aware cautions

**Problem.** Every card is collapsed by default; clinicians need baseline labs / follow-up cadence / cautions visible without a click. "Safety pearl" is informal for a clinical reference and ranks routine counseling at the same visual weight as boxed-warning-grade cautions. Search subcopy uses internal vocabulary. The existing per-regimen `Export checklist` is more useful for clinic workflow than a full-page PDF would be.

**Solution.**

1. **Surface three primary fields on the card face**: Baseline labs · Follow-up cadence · Key caution. Move full counseling, dose adjustments, contraindications, and references behind expand-on-click.
2. **Severity-aware visual styling for cautions.** Three tiers:
   - **Boxed warning** (red border, alert icon, e.g., JAK inhibitors MACE/thromboembolism, teratogenicity)
   - **Important caution** (amber border, e.g., infection risk, lab thresholds)
   - **Routine counseling** (no border, regular text)

   This requires migrating the existing data shape. Today `data.js` has free-text `cautions` strings (e.g., line 93: `"Boxed warnings for serious infections and malignancy..."`) and `baselineTasks` use a `critical` boolean (third arg of the `task(id, label, critical?)` helper). The migration:

   - Replace `cautions: <string>` with `cautions: Array<{ severity: 'high' | 'medium' | 'low', text: string, refs?: string[] }>`. One free-text string per regimen → 1–4 structured caution objects.
   - Keep `baselineTasks` with `critical: boolean` (already serves the priority signal — `critical: true` ranks higher on the card face); no rename needed.
   - The `monitoringSchedule` helper already carries severity (`'critical' | 'high' | 'standard'`) — no change.
   - Migration is per-regimen authored work, not automated. The data module already has 23 entries; ~1–2 hours of editorial work to split each `cautions` string into severity-tagged objects.

3. **Define summarization rules** for card face:
   - **Baseline labs**: show up to 5 items from `baselineTasks` with `critical: true` first, then non-critical, capped at 5. The full list lives in expanded view.
   - **Follow-up cadence**: render the `monitoringSchedule` entries with severity `'critical'`, joined as a single line. Full schedule in expanded view.
   - **Key caution**: show the highest-severity `cautions[]` object (boxed-warning > important > counseling). Other cautions in expanded view, sorted by severity.

   Never silently truncate clinically important items — the card face is a *summary*, the expanded view is the full record.
4. **Improve the existing `Export checklist`** with citations, source data version, and current filter state. Defer full-page PDF until owner says it's needed.
5. **Data currency shown near clinical fields** — small `as of <date>` label inside each card's expanded section, not just in the hero.
6. **Mobile default to table view** — 23 expanded cards × ~280px = unscrollable vertical strip on phones.

**Files.**
- `site/public/apps/biologic-monitoring-dashboard/index.html` — card template restructure
- `site/public/apps/biologic-monitoring-dashboard/styles.css` — card face layout + severity tier styles
- `site/public/apps/biologic-monitoring-dashboard/app.js:497,747,758` — card rendering, summarization rules, severity tier read-through
- `site/public/apps/biologic-monitoring-dashboard/data.js` — restructure `cautions` from string to severity-tagged array per the migration above (per-regimen editorial work, 23 entries). `baselineTasks` `critical` boolean stays; `monitoringSchedule` `severity` field stays.

**Copy.**
- Search subcopy (replace): `Search by drug, diagnosis, lab, caution, or cadence.`
- Card face section labels: `Baseline labs` · `Follow-up cadence` · `Key caution`
- Detail toggle: `Full counseling & references ▾`
- Per-card data currency label: `as of <date>` (small, under the expanded section)
- Severity-tier visual labels:
  - High: `Boxed warning` (alert icon, accent color)
  - Medium: `Important caution`
  - Low: `Counseling`

**Layout.**
- Card width: ~360px desktop; full-width mobile; mobile default = table view
- Card face top-to-bottom:
  - Drug name (h3, ~20px) + class chip (small, top-right)
  - Indication line (italic, small)
  - `Baseline labs` — bulleted list, up to 5 items by priority
  - `Follow-up cadence` — single line, e.g., `Wk 0, 4, 12, then q3–6mo`
  - `Key caution` — rendered with severity-tier styling
  - `Full counseling & references ▾`
- Expanded: dose adjustments · contraindications · all cautions (sorted by severity) · references · `as of <date>`

**Behavior.**
- Cards render with face fields visible; no click needed for the three primary fields
- Severity tier read from data, applied as CSS class
- `Export checklist` (existing) preserves filter state and includes data version + citations
- Mobile loads table view by default; user can switch

**Acceptance.** A clinician on desktop opens the page, types "dupixent", reads baseline + cadence + caution without clicking. A boxed-warning drug visually stands out from a low-risk one. Mobile users land in table view.

---

### Spec 5 — PDF Studio: visible Load-or-drop + light-overlay + safety guards

**Problem.** No big drop zone visible on entry (the user has to find a small "Load PDF" panel). Privacy claim ("local-first") isn't surfaced in the workspace. Dragenter-only overlay doesn't help first-time visitors who don't think to drag. 9 tools at equal visual weight. Right rail has 3 empty boxes before any file loads.

**Solution.**

1. **Visible Load-or-drop affordance in the empty workspace** — large card with `Choose a PDF` button + helper text `or drag and drop a file anywhere on this page`. Visible at entry, not gated on drag.
2. **Full-page light overlay** activates on dragenter (not the heavy dark modal proposed in round 1). Restrained tone matches the Atlas aesthetic. Dashed target shape inside the overlay.
3. **Privacy line under workspace h1** — `Files are processed locally in your browser in this version.` (Not "never leave" — too absolute; OCR or future integrations could change this.)
4. **Tool-aware file validation.** Each tool declares its accepted file types and multiplicity; the overlay validates against the *currently selected* tool, not a global PDF rule. The matrix is:

   | Tool | Accepts | Multiplicity |
   |---|---|---|
   | Pages Studio | PDF | single |
   | Extract & Split | PDF | single |
   | Text Extract | PDF | single |
   | OCR (Beta) | PDF, image | single |
   | Image Packet | image (jpg/png/heic) | multi |
   | Packet Assembler | PDF | multi |
   | Mark & Number | PDF | single |
   | Metadata | PDF | single |
   | Reduce Size | PDF | single |

   Encrypted PDFs surface a clear "password-protected" message in any tool that accepts PDFs. Files > 100MB are rejected with the threshold message (configurable). Multi-file drops on single-file tools show "Drop one file at a time."
5. **Group 9 tools into 4 sections** with one-line group descriptions to clarify ambiguous tools (Image Packet vs. images-to-PDF; OCR's output type).
6. **Consolidate empty right-rail** into a single "Load a PDF to begin" card until file loads.
7. **Preserve existing `?tool=` query params** so existing links don't break.

**Files.**
- `site/public/apps/pdf-studio.html:19` — workspace subtitle, visible drop affordance card, grouped tool nav structure
- `site/public/apps/shared/pdf-studio.css` — light overlay styles, grouped nav styles
- `site/public/apps/shared/pdf-studio/main.js` — visible affordance, document-level drag listeners with validation, consolidated empty state, query-param preservation

**Copy.**
- Workspace subtitle: `Files are processed locally in your browser in this version.`
- Empty canvas heading: `Open a PDF to begin`
- Empty canvas CTA: `Choose a PDF`
- Empty canvas helper: `or drag and drop a file anywhere on this page`
- Drop overlay heading varies by active tool:
  - PDF-only tools: `Drop a PDF here`
  - Image Packet: `Drop images here`
  - OCR (Beta): `Drop a PDF or image here`
  - Packet Assembler: `Drop one or more PDFs here`
- Drop overlay subcopy (validation states, all tool-aware):
  - Default: `Files are processed in your browser. No upload, no server.`
  - Wrong type (e.g., `.docx` on Pages Studio): `This tool accepts {accepted types}. Try another file.`
  - Encrypted PDF: `That PDF is password-protected. Unlock it before loading.`
  - Oversize: `Files larger than 100 MB are not supported in the browser.`
  - Multi-file on single-file tool: `Drop one file at a time for this tool.`
  - Wrong tool for file (e.g., image on Pages Studio): `Switch to OCR or Image Packet to use images.`
- Empty Inspector: `Load a PDF to inspect pages, preflight checks, and output.`

**Layout.**

Tool nav grouped (with one-line group descriptions):

- **Edit pages** *(reorder, rotate, mark, number)*: Pages Studio · Mark & Number
- **Extract content** *(get pages, text, or images out)*: Extract & Split · Text Extract · OCR (Beta)
- **Assemble** *(combine PDFs or images into one)*: Image Packet · Packet Assembler
- **Clean up** *(scrub or shrink existing PDFs)*: Metadata · Reduce Size

Drop overlay: 100vw × 100vh fixed, **light** semi-transparent background (Atlas tone), centered dashed-bordered card with overlay copy. Active only during dragenter/dragover; dismisses on dragleave or drop.

Right rail until PDF loads: single "Load a PDF to begin" card. After load: Inspector / Preflight / Output as today.

**Behavior.**
- Drop overlay activates on dragenter, validates type/size/count *against the active tool*, shows appropriate copy
- Drop loads file into currently-selected tool (default: Pages Studio)
- Visible `Choose a PDF` (or `Choose images`, depending on tool) button always works, regardless of drag state
- Mobile: visible button is the primary affordance; drag indicators hidden
- `?tool=organizer` and other existing query params still resolve to the same tools (no URL breakage from grouped-nav refactor)

**Acceptance.** First-time visitor sees both the privacy line and an obvious "Choose a PDF" affordance within 2 seconds. Drag affordance lights up at the moment of drag. Existing bookmarked URLs still land on the right tool.

---

### Spec 6 — Mind Maps: topic picker, concise tabs, smart within-topic nav

**Problem.** "Other mind maps: <16 inline links>" is a wall of text — the most-used affordance is the worst-presented. A 16-chip horizontal strip is still weak on desktop. Tabs (Diagrams / Compare / Atlas) are non-obvious; the "Atlas" tab name collides with the site's overall "Atlas Vol. IV" branding. Lede paragraph is instructional. Within-topic left rail with 11 diagrams duplicates the tabs.

**Solution.**

1. **Topic picker that adapts to viewport**: a compact picker-with-search on desktop (button → modal/dropdown with all 16 topics grouped or alphabetized), a horizontal chip row on mobile.
2. **Concise tab labels** with help-text on hover (not stacked italic subcopy that bloats the layout). Rename `Atlas` → `Plates` to avoid collision with the site's overall Atlas branding.
3. **`Compare` tab disabled when content count < 2** — the count is already known in `ViewSwitcher.tsx:17`.
4. **Within-topic diagram nav** uses mini-tabs only when ≤6 diagrams; otherwise keep a searchable diagram index (compact vertical list with a search input) — Alopecia has 11 diagrams, so it gets the index, not mini-tabs.
5. **Trim the lede** to one sentence; drop the right-column repeat.

**Files.**
- `site/src/pages/apps/mindmaps/[topic].astro` — layout, topic picker mount
- `site/src/apps/mindmaps/MindMapApp.tsx` — within-topic nav restructure
- `site/src/apps/mindmaps/views/ViewSwitcher.tsx:17` — disable `Compare` when content count < 2; rename `Atlas` → `Plates`
- `site/src/apps/mindmaps/views/DiagramsView.tsx:35` — within-topic nav rendering (mini-tabs vs searchable index)
- New: `site/src/components/TopicPicker.astro` (or .jsx) — desktop dropdown + mobile chip row

**Copy.**
- Trimmed lede: `Explore diagnostic pathways, classifications, and treatment strategies for study and teaching.`
- Right-column description removed
- Tab labels: `Diagrams` · `Comparisons` (was Compare) · `Plates` (was Atlas)
- Tab tooltips (hover only):
  - `Diagrams`: `Visual concept maps for this topic`
  - `Comparisons`: `Side-by-side topic comparisons` (when ≥2 exist)
  - `Plates`: `Image-driven catalog`
- Topic picker label: `Switch topic`
- Searchable diagram index header: `Diagrams in this topic`

**Layout.**
- Row 1: topic picker (right-aligned, single button → dropdown on desktop; full-width chip row on mobile only)
- Row 2: kicker · h1 · trimmed lede (single sentence)
- Row 3: tab labels (no subcopy)
- Row 4: mini-tab strip (within-topic, only when ≤6 diagrams) OR searchable diagram index sidebar (when >6)
- Row 5: canvas

**Behavior.**
- Desktop topic picker opens a dropdown with the 16 topics; arrow keys navigate; Enter loads
- Mobile chip row scroll-snaps; current topic visually distinct
- `Comparisons` tab disabled (greyed, no click) when content count < 2
- Within-topic searchable index: type filters the diagram list inline
- Renaming `Atlas` → `Plates` is also reflected in any analytics/labels that track tab use

**Acceptance.** A user on `/apps/mindmaps/alopecia` jumps to `/apps/mindmaps/ctcl` in two clicks (open picker, click ctcl). Tab labels don't collide with the site's "Atlas Vol. IV" branding. Alopecia (11 diagrams) shows the searchable index; topics with ≤6 diagrams show mini-tabs.

---

## Out-of-scope (deferred polish)

- **Dermoscopy LLM Dashboard:** verb-ify tab labels, soften editorial→dashboard transition, equalize "Select models / Clear" visual weight. All LOW; defer.
- **Catalog:** numeric ID rework, sticky filter behavior. LOW; defer.

---

## Rollout sequencing

| Order | Spec | Why |
|---|---|---|
| 1 | A — Kicker (read from apps.json) | One source-of-truth change → 4 apps better. Highest leverage. |
| 2 | B — Save state + dataset currency split | Same shared file as A; bundle them. Also fixes the existing Biologic date inconsistency. |
| 3 | **3a — Dermpath PRECOMPILE** | **Promoted: urgent build-correctness fix.** Removes in-browser Babel/Tailwind that warn in production. Independent of any UX work — can ship before the rest. |
| 4 | 1 — Catalog outcomes + sort + search | Sets visitor expectations for everything they click into. |
| 5 | 5 — PDF Studio | Privacy line + visible drop affordance is highest UX delta per hour. |
| 6 | 4 — Biologic card face + severity tiers | Converts browse into lookup; preserves clinical accuracy. Largest data-migration step. |
| 7 | 2 — RAMIE setup + text-mode-first | Removes the biggest first-time-user trap; keeps the offline path. |
| 8 | 6 — Mind Maps topic picker + tab rename | Independent; can run in parallel with anything above. |
| 9a | 3b — Dermpath UX (search-first + drawer) | After 3a precompile; UX redesign on a precompiled foundation. |
| 9b | 3c — Dermpath Astro migration (optional) | Long-term cleanup; not required for the UX or the build fix. Defer to owner. |

---

## Round 2 change log

Refinements applied after Codex critique and self-review. Listed for traceability:

- **A**: Category moved to `apps.json` as single source of truth (was: duplicated in DOM attributes). Whitelist allowed values. `Tool` corrected to `Productivity` (matched catalog).
- **B**: Major rewrite. Split status into two chips (save-state + dataset-currency). New API split (`markDirty`/`markSaved`). Dataset-currency read from data module at runtime, not hardcoded HTML. Initial state `Ready` (not `Just opened`). Fixes existing Biologic date inconsistency.
- **1**: Search expanded to index outcome/category/description (was: name + stack only). Sort tie-breakers defined. RAMIE outcome clarifies dual-mode text/audio. SkinScores outcome revised. KSA outcome cleaner punctuation. Preview images gated on real screenshot (no decorative SVGs). Legacy catalog entries flagged as open question.
- **2**: Three Quick Actions, not two (round 1 collapse was wrong). Audio-only gating; text mode always available. Conditional privacy copy (true before AND after connection). Backend validation edge cases enumerated. Research/demo disclaimer surfaced above the fold. `Connect RAMIE backend` instead of generic phrasing.
- **3**: Decoupled precompile (urgent) from Astro migration (optional later). `⌘K / Ctrl+K` instead of macOS-only. Curated landing derived from data, with fallback to text-only pattern cards (no decorative slop). Browse-all drawer preserves textbook source groupings. Acceptance criterion realistic ("top 5 relevant after 2–4 characters" vs round 1's "≤ 2 keystrokes").
- **4**: "Safety pearl" → "Key caution". Severity-aware visual styling (three tiers). Summarization rules instead of arbitrary truncation. Existing per-regimen `Export checklist` enhanced first; full-page PDF deferred. Data currency near clinical fields. Mobile defaults to table view.
- **5**: Visible Load-or-drop card in empty canvas (round 1's drag-only overlay missed first-time visitors). Light overlay (not dark dramatic modal — wrong tone for Atlas). Privacy copy softened ("processed locally in your browser in this version" — not "never leave"). File validation states (type / size / encryption / multi-file). Tool group descriptions added. Existing `?tool=` query params preserved.
- **6**: Desktop gets a compact picker-with-search; mobile keeps a chip row. Concise tab labels with hover tooltips (round 1's italic subcopy bloated the layout). `Atlas` renamed to `Plates` (collision with site's "Atlas Vol. IV" branding). `Compare` → `Comparisons`, disabled when count < 2. Within-topic nav: searchable index for >6 diagrams, mini-tabs for ≤6.

## Round 2.1 errata (post-review-of-review)

Codex's second pass identified six must-fix items that survived the round-1 → 2 revision. All applied:

- **Spec A — slug drift fixed**: table uses `apps.json` slugs (`dermatopathology-navigator`, `pdf-tools`, `biologic-monitoring`) consistently; HTML file paths called out separately. `research` added to the allowed category whitelist (Dermoscopy LLM Dashboard).
- **Spec A — drift-prevention mechanism**: replaced the hand-wavy "build-time helper" with a concrete Vitest policy test that asserts `apps.json` category ↔ `<body data-shell-kicker>` agreement per app.
- **Spec B — dataset-currency contract**: dropped the brittle `data-shell-asof-from="data.js:DATA_VERSION"` mechanism. Apps call `LegacyShell.setDatasetCurrency(text)` from their own JS where they've already imported their data module. Works regardless of whether the export is named `dataVersion`, `DATA_VERSION`, or anything else.
- **Spec B — `Saving…` mislabel fixed**: introduced `Unsaved` as the dirty-state label. `Saving…` reserved for actual async writes (RAMIE session writes). Local-state-only apps (Biologic filter changes, PDF Studio controls) move between `Ready` and `Unsaved`.
- **Spec 5 — tool-aware drop validation**: overlay copy and accepted file types now branch by active tool. Image Packet accepts images; Packet Assembler accepts multiple PDFs; OCR accepts both; everything else is single PDF.
- **Spec 4 — severity schema migration spelled out**: the data shape change from `cautions: <string>` to `cautions: Array<{ severity, text, refs? }>` is explicit, including the priority signal already in `baselineTasks.critical` (no rename needed) and `monitoringSchedule.severity` (no change).
- **Rollout sequencing — Dermpath precompile promoted**: moved from position 8a to position 3, matching the body text that called it urgent.

Decided by owner during round 2.1: archived catalog entries (`status: legacy` in `apps.json`) are removed from `/apps/` entirely. They remain in `apps.json` as authoritative data and remain reachable via `/legacy/`, but the catalog filters and search exclude them.
