# UI/UX Improvement Roadmap

**Author:** Frontend-design audit · **Date:** 2026-04-17
**Method:** Live Playwright walkthrough at 1440×900 + 375×812 across all routes in `docs/site-test-inventory.md`, cross-referenced against `docs/frontend-design-system-contract.md`.
**Companion docs:**
- Hard contract + previous audit findings: `docs/frontend-design-system-contract.md`
- Canonical surface list: `docs/site-test-inventory.md`

This document complements (not replaces) the existing legacy-apps audit baked into the contract. The contract focuses on rules + 2026-02 legacy screenshot pass; this doc is a current-state walkthrough of the **whole site** (Astro pages, the app catalog, dashboards, and embedded HTML apps), with concrete enhancement options ranked by ROI.

---

## 0. TL;DR

The site is significantly stronger than typical "AI-vibecoded" output: serif display + IBM Plex pairing, real palette (slate/cyan/teal — not indigo), consistent shell across legacy apps. But several recurring patterns drag the perceived quality down across the entire surface:

1. **Identical card grids dominate** four of the eight Astro routes (Home About-About, Home About, Blog, Legacy). Visual rhythm is missing — every section reads with the same weight.
2. **Decorative purple/violet/pink gradients persist** on Apps page placeholders, Blog post thumbnails, About page "Research & Scholarship" skill card, and the active filter chip on Astro mindmaps — direct violations of the design contract that lives one folder up.
3. **Fake/meaningless data visualizations** on the About page ("AI/Machine Learning 80%" skill bars). These hurt credibility for a research-clinician portfolio.
4. **Empty states dominate first impressions** on Dermatopathology Differentials, Dermatopathology Navigator (modern), and RAMIE — the "app" looks like a blank canvas before users do anything.
5. **Legacy apps still inherit the "RMarkdown print" / dashboard sprawl problems** noted in the prior audit (WoundCare, Dermpath modern). No structural redesign has happened since 2026-02.
6. **Mobile experience flattens correctly but loses the asymmetric design intent** — every page becomes a centered single column. There's an opportunity to design *for* mobile, not just shrink to it.

Below: page-by-page and app-by-app, then a prioritized roadmap.

---

## 1. Cross-cutting issues (apply to every page)

### 1.1 Color: stop using purple/violet anywhere as decoration
The site palette already commits to slate-navy + cyan + teal — a clinically credible choice. But several surfaces still emit the AI-purple aesthetic:

| Surface | File | Symptom |
|---|---|---|
| Apps page preview tiles | `site/src/pages/apps/index.astro` (preview component) | Purple/violet gradient on the Skinoculars + Dermpath placeholder thumbnails |
| Blog category thumbnails | `site/src/pages/blog.astro` | Purple-pink, teal, pink-purple gradient blocks per card |
| About skills card | `site/src/pages/about.astro` ("Research & Scholarship") | Purple progress bars + purple gradient inside one of three identical cards |
| Astro mindmap active tab | `site/src/pages/apps/mindmaps/[topic].astro` | Active filter chip uses purple-blue gradient |
| Sidebar header on Apps page | `site/src/pages/apps/index.astro` | Selected card has an indigo accent |

**Fix options (pick one approach and apply everywhere):**
- **(A) Purge it** — replace all gradients with the existing teal→cyan ramp (`--accent-start: #38bdf8; --accent-end: #22d3ee;` already defined). Single line change in `global.css` for the gradient utility class.
- **(B) Replace gradients with imagery** — for Blog and Apps cards, swap the decorative gradient block for either a 4-color minimal SVG glyph, a small actual product screenshot, or a typographic treatment (large display number / kicker on flat color).
- **(C) Make gradients meaningful** — only render the gradient on the *featured* item. Everything else gets a flat brand color. Hierarchy comes from contrast, not decoration.

I recommend **(B) + (C)**: kill 80% of the gradients, keep one as a brand moment.

### 1.2 Layout rhythm: break the "every section is a card grid" pattern
Across Home, About, Blog, and Legacy you can see the same structural beat — section heading centered above a `grid-cols-3` row of equal cards. The contract bans this for a reason: it's the canonical AI-template look.

**Patterns to introduce (rotate, never use the same one twice on the same page):**
- **Asymmetric split (60/40 or 70/30):** Contact page already does this well — copy that pattern to About > "About" intro, Home > Featured Apps, Blog > newest post.
- **Bento grid:** for About > Highlights, mix one large feature card with three small ones (1×2 large + 1×1 + 1×1 + 1×1).
- **Editorial single column:** for the legacy archive page, run a chronological reverse-time list with year tags inset in the left margin, like a magazine archive.
- **Full-bleed alternating with constrained:** Home > Featured Apps already attempts the alternating pattern with the `app-showcase-row--reverse` class — but the iframe previews are tiny relative to the available width. Push them full-bleed on alternating rows.

### 1.3 Typography: increase hierarchy variation in marketing pages
Playfair Display (display) + IBM Plex Sans (body) is a strong pairing already. But across the site:
- All H2s are the same size, weight, and color.
- Kickers exist (`.section__kicker`) but are inconsistently used.
- No use of italic Playfair for editorial accent — Playfair has a beautiful italic.

**Recommendations:**
- Establish a clear three-tier display scale: `H1 (clamp 2.75rem→4.5rem)` / `H2 (clamp 2rem→3rem)` / `H3 (1.5rem)`. Currently H1 and H2 read very similar.
- Use Playfair *italic* for inline emphasis in body copy and for the kicker pre-headings instead of uppercase tracked sans.
- Mix weights more aggressively — Playfair 400 for headlines, Playfair 700 for one statement word per page.

### 1.4 Navigation: the top nav is fine but underutilized
The current header is a centered horizontal nav over the dark gradient. It works but:
- The "RAMIE" feature is hidden behind /apps even though it's the marquee tool.
- There's no quick command-palette / search across the catalog.
- On scroll, the header is fixed-translucent — fine, but doesn't earn its presence.

**Options:**
- Add `Cmd/Ctrl-K` global command palette (search publications + apps + pages). For a research-heavy site, this is genuinely useful and not just decoration.
- On long pages (Research, About), surface a sticky in-page TOC on the left rail at `lg:` breakpoint.
- Add a "What's new" pip indicator (no notification spam — just a small dot near the brand mark when something material changed in the last 30 days, tied to `devlog.md`).

### 1.5 Animation budget: the site is currently quiet — keep it that way
Good news: there's no fade-up-on-everything pattern, no hover:scale-105 on buttons. The shaders react component on the hero is a single, intentional moment. Keep this discipline. The one exception:
- The `scroll-fade` data attribute is applied to almost every section. Audit which sections actually benefit and remove the rest. Fade-up on a publications grid that's already below the fold is invisible and adds JS weight.

### 1.6 Ad slots break the visual flow
Two AdSense slots sit in the home page main flow with `class="ad-slot"`. Right now they're empty placeholders, but when filled they will:
- Inject visual chaos into a clinical/professional brand.
- Inject third-party tracking that conflicts with the "no third-party form provider" framing on the Contact page.

**Decision needed:** keep ads (decide a constrained presentation: small label "Sponsor", muted styling, max one per page below the fold) **or** remove them entirely. A research-clinician portfolio with AdSense reads as cheap. I'd remove them.

### 1.7 "LEGACY" pill on every embedded app shell
Every legacy HTML app renders inside a shell whose top-left badge says "LEGACY". This sets a low-confidence frame for tools the user is asking visitors to actually use (PDF Studio, RAMIE, Biologic Monitoring). Consider:
- Rename "LEGACY" to "TOOL" or remove it for actively maintained apps.
- Reserve the "LEGACY" label for the truly archived apps in `/legacy/apps/**`.

---

## 2. Page-by-page review (Astro routes)

### 2.1 `/` Home
**Observed (desktop):**
- Hero: shaders-react canvas behind a left-anchored card. The card is well-designed — good use of asymmetry, large display type.
- "About" section: `card-grid` with three equal cards of single sentences, each in identical dark glass containers. Reads as filler.
- "Featured Applications" section: alternating media+body layout (good), but the iframe preview is small and shows scaled-down site content rather than a dedicated product moment.
- "Selected Publications" section: 4 cards in a 2×2 grid + a horizontal year timeline below. The timeline is a strong, original element; the grid is generic.
- "Get in Touch" section: a single card with 4 contact links — fine but redundant with the dedicated /contact page.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Replace 3-equal "About highlights" cards with a single editorial paragraph + 3 inline pull-quote-style numbers (e.g., "PGY-4 · Johns Hopkins · 12 publications") | S | High |
| 2 | Replace generic iframe previews in Featured Applications with hand-picked screenshots/animations + one-line "what it does" instead of the scaled-down live page | M | High |
| 3 | Make the Publications timeline the *primary* visual — invert hierarchy: timeline first, expandable per-year, featured papers inline | M | High |
| 4 | Remove the Get in Touch section entirely (or collapse to a single line "Email · LinkedIn · Scholar" in the footer); the footer already has these | S | Medium |
| 5 | Kill or de-emphasize the AdSense slots | S | High |
| 6 | Kill the "scroll-fade" on publications and contact sections | S | Low (perf) |

**Aesthetic direction option:** lean into "editorial dossier" — magazine-style with strong serif, generous margins, one typographic moment per scroll, no card grids at all.

### 2.2 `/about`
**Observed:**
- Hero: same dark gradient + serif headline pattern as home. Centered-text-with-supporting-paragraph.
- White content card containing CV bullets — good readable surface. Reasonable density.
- Career Timeline: vertical timeline alternating left/right sides. This is well-designed and original — the strongest section on the page.
- "Skills & Expertise": **3 equal cards with progress bars showing made-up percentages.** Card 3 ("Research & Scholarship") uses a purple/violet gradient on its progress bars and heading.

**Critical fix — the skill bars:**
"Medical Dermatology 95%" / "AI/Machine Learning 80%" are not measurable claims. For a research clinician's portfolio they read as fictional and weaken everything else.

**Replace with one of:**
- **Option A (factual):** Replace bars with concrete artifacts — "12 publications in dermatology", "5 years contributing to AI-in-medicine peer review", "8 invited talks on equity in derm." Anchored to verifiable items.
- **Option B (categorical):** Replace bars with tag clouds — three columns of expertise tags sized by frequency (medium / heavy / signature), no spurious precision.
- **Option C (visual map):** Replace with a single overlapping Venn or radar plot of three domains (Clinical / Technical / Research). One designed visualization beats three identical fake bars.

**Other improvements:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Replace skill-bar percentages (see above) | M | Critical |
| 2 | Remove purple/violet gradient from "Research & Scholarship" card | S | High |
| 3 | Change H1 from centered to left-aligned with kicker; align with the brand voice | S | Medium |
| 4 | Add CV download CTA in the page header (currently buried at home hero) | S | Medium |
| 5 | Consider promoting the Career Timeline up — it's currently mid-page, deserves to be the page spine | M | Medium |

### 2.3 `/apps` (catalog)
**Observed (desktop):**
- Strong asymmetric layout: vertical filter chips + vertical scrollable card list on left, large preview tile on right. Good!
- Filter chips use emoji icons (📚 🏥 📖 ⚡) — direct contract violation ("Emojis as substitutes for designed icons").
- The right-side preview tile is a **purple-violet gradient placeholder** with the app's first letter in a circle. This is the single worst aesthetic moment in the Astro site.
- The "↑/↓ to browse" hint and pagination dots are nice details.
- Selected card on the left has a subtle indigo glow border.

**Mobile:**
- Layout collapses to single column with hero text first, then chips wrap, then cards stack. The right-side preview disappears (correct), but the chips with emoji are even more prominent.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Remove emoji from filter chips. Replace with a small designed icon (Lucide at 16px is fine) **or** drop icons entirely and use uppercase tracked labels | S | Critical |
| 2 | Replace purple gradient preview with: real screenshot of the app, looping muted video, or a typographic poster (giant numeral + tag color block) | M | Critical |
| 3 | Replace the indigo selected-card glow with cyan/teal | S | High |
| 4 | The preview right-pane could host more — current state shows description + tags + Visit/Details buttons, but has empty space. Add a 3-line "what's inside" list (techniques used, status, last updated) | S | Medium |
| 5 | Add keyboard shortcut hints visibly on desktop (`↑/↓` already shown, add `Enter`, `/` for search) | S | Low |
| 6 | Mobile: replace the left/right card-with-preview pattern with a swipeable carousel of screenshot + summary | M | Medium |

**Aesthetic direction option:** treat the catalog like a record/film index — large numeral per app (01, 02, 03), short tagline, single accent color per category, no chrome.

### 2.4 `/research`
**Observed:**
- Centered serif H1 + paragraph (recurring pattern).
- Featured "Dermoscopy LLM Evaluation" callout card sits below the hero — good promotion of the dashboard.
- Filter row (search + Year + Type + Export + Co-author Network) — functional and well-aligned.
- Publications list as full-width cards. Good readability. Slightly bland — every card identical in shape.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Replace the centered hero with a magazine-style index header: large kicker "PUBLICATIONS · 2018–2026" left-aligned, eyebrow stat right ("12 papers · 4 first-author"). | S | High |
| 2 | Vary card emphasis: Featured publications get a dark theme card with display serif title; non-featured get compact one-line entries. Right now they're all the same. | M | High |
| 3 | Add inline citation count or impact indicator if the data exists — currently no visual difference between a JAAD article and a Reports article | S | Medium |
| 4 | The "Cite" button on each card is good. Add "BibTeX" inline copy too. | S | Low |
| 5 | Co-author Network is teased but the link target is the dashboard. Make this an in-page slide-over or modal — current pattern requires a full navigation. | M | Medium |
| 6 | Consider a chronological view toggle (table view ⇄ card view ⇄ timeline view) | M | Medium |

### 2.5 `/research/dermoscopy-llm-dashboard`
**Observed:**
- Strong dashboard implementation. Six stat tiles in a row at the top: Models / Trials / Accuracy / Sensitivity / Specificity / Latency.
- Tab nav (Overview / Leaderboard / Heatmaps / Error analysis / Tradeoffs / Head-to-head). Good organization.
- Charts: horizontal bar charts for "Accuracy by prompting strategy" and "Accuracy by diagnosis" with red/green/yellow color coding by performance threshold.

**The good:**
- Real data, real visualizations, dense and useful — exactly what the research audience wants.
- Color is functional (red = low performance, green = high) — semantically correct, not decorative.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | The 6-metric tile row is the "hero metric" template the contract warns against. Compress to 3 primary metrics + 3 secondary (smaller, inline) so the eye knows what matters. | M | High |
| 2 | Add a 1-sentence interpretive summary at the top of each chart ("Few-shot exemplars improved accuracy 16pp over zero-shot — see Arm 2 vs 5") — without it, charts are just data | S | High |
| 3 | The red/yellow/green threshold coloring is great but lacks a legend. Add a tiny "scale: <60% red, 60-80% amber, ≥80% green" footer | S | High |
| 4 | Dataset footer ("Dermoscopy LLM evaluation summary · Total trials: 10,200") could be a sticky bottom strip with a "download data" CTA | S | Medium |
| 5 | Tab labels could use sentence case + numerals ("01 Overview", "02 Leaderboard") for editorial polish | S | Low |
| 6 | Consider a "share this view" feature that encodes filters in URL — researchers will want to send specific slices | M | Medium |

### 2.6 `/blog`
**Observed:**
- Centered "Insights & Updates" hero (recurring centered pattern).
- 3-column equal grid of post cards.
- Each card: a **decorative gradient block** (purple-pink, teal-blue, pink-purple) with a single-word category pill, then date, tags, title, excerpt, "Read More".

**Critical issues:**
- This is the canonical AI-template feature grid the contract bans.
- The gradient thumbnails are pure decoration — they convey nothing about the post content.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Replace 3-column equal grid with magazine layout: featured/most-recent post takes a 2/3-width row with a real cover image; older posts collapse to a compact left-aligned title-list (date · title · category) | M | Critical |
| 2 | Kill the decorative gradient blocks. Replace with: real article images (Medscape and ABC News articles have actual hero images that could be embedded), or pure typography (giant pull quote in serif italic) | M | Critical |
| 3 | The "April 19, 2022" date is the same size as the title — flip the hierarchy | S | High |
| 4 | "Read More" buttons are unnecessary — make the entire card clickable; show "→" affordance on hover instead | S | Medium |
| 5 | Add reading time estimate ("4 min read") — small detail, signals respect for reader | S | Low |
| 6 | If posts are sparse, consider "From the archive" categorization rather than chronological feed — sets expectations | S | Medium |

### 2.7 `/contact`
**Observed:**
- Best-designed page on the site. 60/40 split: large left-aligned "Let's build clinician-grade tools." + intro + 4 topic chips || compact right card with Email/LinkedIn/Scholar links + medical-disclaimer microcopy.
- Below: "Send a note" form.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Already strong — minor: the topic chips ("Clinical AI", "Dermatology Education", "Research", "Speaking") could be interactive — clicking pre-fills the contact form's subject line | S | Medium |
| 2 | The form opens the user's mailto: client. Acknowledge this in microcopy near the Send button so users aren't surprised when Outlook pops up | S | Medium |
| 3 | Add response-time expectation ("Replies within 1 week typical · faster for time-sensitive clinical AI questions") | S | Low |
| 4 | The medical-disclaimer is good — keep prominent. | — | — |

### 2.8 `/legacy`
**Observed:**
- "Research Reports" and "Archived Applications" as 4-column equal card grids. Each card identical: title + "Archived resource available for historical context" + year pill.
- Reads as filler — every entry has the same description text.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Replace with chronological list: year (left margin, large numeral) → title (medium) → 1-line authentic description of what was actually built | M | Critical |
| 2 | Group by status: "Archived but useful" (still link out) vs. "Archived for record" (no link, just listed) — current page treats both equally | S | High |
| 3 | If a project has primary outputs (paper PDFs, screenshots, repos), surface them inline rather than gating behind another page | M | Medium |
| 4 | Consider this entire page should be `/about/timeline` — merging into the About career timeline reduces navigation, gives projects a richer frame | L | Medium |

### 2.9 `/404`
Not directly captured but typically follows `MainLayout`. Recommend:
- Use the page as a personality moment: large display "404" with a single editorial line ("This page is in the differential, but the workup didn't pan out.") — *only* if voice fits the brand.
- Surface 4–5 links to actual destinations users land on most (Apps, Research, Contact).

### 2.10 `/tasks` (unlisted)
Internal task board. If publicly reachable, lock it behind auth. If intentionally public, label it as internal explicitly. Did not screenshot.

---

## 3. Astro mindmaps `/apps/mindmaps/[topic]`

**Observed (Alopecia):**
- Hero: serif headline + paragraph + "Explore other mind maps" inline links.
- Tab bar of node-categories: **active tab = purple-blue gradient pill** (banned), inactive = dark slate pills. Good organization but wrong color.
- Toolbar of action chips: theme toggle (☾ icon), Reset, Presentation, Collapse all, Expand all, Export PNG/PDF, state import/export, ?
- Search bar full-width.
- The actual mind map renders below: very sparse — handful of unconnected node circles with small labels, lots of dead space, several labels overlap (e.g., "Hair Shaft Integ" + "Examination" overlap; "ComprehenManticn History" merged-looking).
- Right-side "Details" pane: empty state "Select a node to view details and add notes."

**Problems:**
- Initial fit is wrong (labels too small, layout too sparse, no zoom-to-fit on first render).
- Label overlap at this zoom level is unreadable.
- Active tab gradient is a contract violation.
- Node strokes are very faint — links between nodes barely visible.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | On mount, run zoom-to-fit so the entire visible category fills the canvas; current state shows a tiny isolated section | S | Critical |
| 2 | Replace purple gradient on active tab with the brand teal | S | Critical |
| 3 | Increase node label font-size by ~25%; truncate long labels to 2 lines with hover for full | M | High |
| 4 | Strengthen link stroke (currently ~0.5 opacity); use `var(--accent-start)` at 0.8 | S | High |
| 5 | Toolbar has 10 buttons in one row — group into clusters: View (theme/fit/zoom) · Layout (collapse/expand) · Export (PNG/PDF/state) · Help. Use dividers. | M | High |
| 6 | "Details" pane should default to the topic intro (overview text, learning objectives), not "select a node" | M | Medium |
| 7 | Consider an alternate radial layout option for users who prefer that mental model | L | Low |
| 8 | The "Explore other mind maps" inline links between hero and tabs are invisible (low-contrast text on dark) — promote to a real selector | S | Medium |

---

## 4. Embedded HTML apps (`site/public/apps/**`)

The previous audit (2026-02 in the contract doc) flagged the structural shell + flex issues + token-mixing in detail. Below: current-state confirmations + new observations + concrete options.

### 4.1 PDF Studio (`/apps/pdf-studio.html`)
**Observed:**
- 3-column shell: left sidebar (tool list), center (active tool), right panel (Inspector + Preflight + Output).
- Quick Start modal on first load — well-designed, dismissible.
- Tool sidebar: 9 vertical buttons, current selection highlighted with cyan border.
- Center pane: "Pages Studio" with empty thumbnail board + toolbar + "0 pages selected" status.
- Right panel: 3 stacked panels (Inspector / Preflight / Output) each with their own empty state.

**Strengths:**
- Genuinely useful local-first PDF utility — privacy story is good.
- Multi-tool consolidation (formerly Merger / Splitter / Text Extract) is a real UX win.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | The empty state spans 3 panels each saying some variant of "no PDF loaded" — collapse into one centered drop-zone covering the whole canvas until a file is loaded | M | High |
| 2 | The "Pages Studio" tool selector is hidden in the sidebar — make active tool visible in a top breadcrumb so user knows what tool is active | S | High |
| 3 | The 9 tool buttons in the sidebar all look identical. Visually group: editing tools (Pages / Extract / Mark) vs generation (Image Packet / Packet Assembler) vs metadata (Metadata / Reduce / OCR / Text Extract) | S | Medium |
| 4 | Drag-and-drop file zone should be visually obvious — currently you have to find the "Load PDF" affordance | S | High |
| 5 | OCR (Beta) badge is right — keep that pattern. Consider "Local · No upload" badge prominently to reinforce the privacy story | S | High |
| 6 | The "LEGACY" pill in the shell is wrong here — this is the active recommended tool | S | High |

### 4.2 Dermatopathology Navigator (modern, `index-fixed.html`)
**Observed:**
- Top white header with brand mark + Search + theme toggle + profile icon. Generic SaaS header.
- Body: dark navy background containing **light/white cards**. The contrast between the white cards on dark navy is jarring — the site jumps between dark and light with no transition.
- Three-column layout: left sidebar (Current Finding dropdown + view-mode toggles Grid/Flashcards/Network), center (list of finding cards: Bowen disease / Clear cell acanthoma / Psoriasis), right (Progress Overview + Clinical Correlations + Generate Study Plan).
- "Floating action button" cyan + in lower-right corner.

**Problems:**
- The two color worlds (dark page background, white card surfaces) compete instead of nesting. Either commit to dark or commit to light.
- Cards have heavy spacing — only 3 visible above the fold.
- The right "Clinical Correlations" pane is generic-AI-sounding ("Consider reviewing similar patterns in psoriasiform dermatitis") — this content was likely auto-generated. If it's real, signal so; if it's a placeholder, mark it.
- "Generate Study Plan" is the most prominent CTA but its purpose isn't clear from the page.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Pick one theme commit. If dark: re-skin the cards with dark glass surfaces (matching `--surface-bg`). If light: lift the page background to ivory and use the cards as-is. | L | Critical |
| 2 | Reduce card padding by ~30% to fit 5–6 above the fold | S | High |
| 3 | Surface "what is this?" intro line in the empty space so first-time users understand what they're looking at | S | High |
| 4 | If the Clinical Correlations are LLM-generated, mark them as "AI-suggested · verify before use" and dim slightly | S | Critical |
| 5 | The Floating Action Button (cyan +) needs a tooltip — its function is unclear | S | High |
| 6 | The "LEGACY · Dermatopathology Navigator - Modern UI" header label is internally contradictory (legacy AND modern). Rename to just the app title. | S | Medium |
| 7 | Consider replacing the 3-column with a 2-column: index left, detail right. Three columns squeeze the actual finding content. | M | Medium |

### 4.3 Dermatopathology Differentials (`/apps/dermatopathology-differentials.html`)
**Observed:**
- Tall navy header with low-contrast "Interactive differential diagnoses..." subtitle barely visible.
- Below: small left-side search/select pane (~25%) + large right pane (~75%) dominated by an empty state — large dashed rectangle with "No Finding Selected" + a hint, then the rest of the page is empty white space below.
- Below the empty state, a long stretch of blank white extends to the footer.

**Problems:**
- The page LOOKS broken on first load. ~70% of the viewport is empty white below the empty state.
- The header is tall and low-contrast — wastes space without delivering value.
- Tabs (List / Table / Flashcards / Network) are below the welcome message but the content area is the empty box, so tabs feel disconnected.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Reduce header height by 60%; make subtitle legible at full opacity in the muted text token | S | Critical |
| 2 | Pre-load a sample finding so first-time visitors land in a populated state. Add "Reset" button to clear. | M | Critical |
| 3 | Remove the entire empty white area below the empty state (it's a layout bug, not intentional space) | S | Critical |
| 4 | Auto-open the dropdown on first visit | S | High |
| 5 | The 4 view-mode tabs should be more prominent — they're the actual feature differentiation here | S | Medium |
| 6 | Consider replacing this tool entirely with the Modern Dermpath Navigator's flashcard/network views — the two tools overlap and confuse | L | Medium |

### 4.4 Astro Mindmaps already covered (§3); legacy MindMaps below:

### 4.5 Legacy MindMaps (`/apps/MindMaps/Alopecia/AlopeciaMindMaps.html` + CTCL/Psoriasis)
**Observed:**
- Centered serif title "Alopecia Workup & Management".
- Search + Prev/Next/Clear bar.
- Tab strip: Diagnostic Approach / Classification / Diagnostic Tools / Therapeutic Modality / Treatment by Condition ▼ / Patient Counseling.
- Mind map area shows the **D3 renderer at much better quality than the Astro version** — large legible "Comprehensive History" node, clean teal stroke, good initial sizing.
- Toolbar with theme toggle, view-fit, +/- zoom, refresh, Fit.

**Comparison observation:** the legacy mind map renders BETTER than the Astro version (`/apps/mindmaps/[topic]`). The new Astro version has overlapping labels and tiny initial scale. **The Astro mindmaps page is regressing the experience.**

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | **Audit why the Astro mindmaps version is worse than the legacy one** — likely the new D3 renderer or container sizing logic. Port the better legacy initial-fit behavior. | M | Critical |
| 2 | The legacy page is itself solid but uses the same purple/violet node coloring noted in the contract audit — apply the teal tokens | S | High |
| 3 | The "Treatment by Condition ▼" dropdown is the only tab with a dropdown — flag visually that it's different (caret is small) | S | Low |
| 4 | "Click a node to explore" subhint is clear — keep | — | — |
| 5 | Decide: do we deprecate the Astro wrapper and link directly to the legacy versions? Or do we fix the Astro version and deprecate legacy? Pick one to avoid two competing paths. | L | High |

### 4.6 RAMIE / Dermatology Scribe (`/apps/dermatology-scribe/index.html`)
**Observed:**
- "Quick Start" modal on entry — clean.
- After dismissal: small RAMIE brand block top-left, sparse command input, three "Quick Actions" cards (Start new conversation / Begin transcription / Resume session), Connection settings card top-right.
- Lots of empty white space below.
- Footer status: "● UI ready · offline-safe" + Settings + Help + the disclaimer.

**Problems:**
- For a "marquee" application, the empty state sells itself short. A user lands and sees three small cards and a lot of nothing.
- The Connection settings card is a header-level concern but visually equal to a Quick Action.
- "RAMIE" + "Realtime Articulate Medical Intelligence Explorer" tagline — the acronym expansion is buried in tiny gray text.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Re-architect as a chat-first interface: large message composer + sample prompt chips ("Document a teledermatology visit", "SOAP from transcript", "DDx from photo"). Default state shows what RAMIE *can do*. | M | Critical |
| 2 | Move "Connection settings" out of the main canvas — collapse into a top-right gear icon (only visible when connection is unconfigured, with a red dot) | S | High |
| 3 | Show 1–2 example conversations in a "Recent" rail (anonymized, short) so users have something to look at | M | High |
| 4 | The 3 Quick Action cards each have an emoji/glyph icon and prose — convert to shortcut keys (`/new`, `/record`, `/resume`) since the UI also exposes a `/Commands` hint | S | Medium |
| 5 | Brand the tool with a stronger landing — consider a single hero line: "Articulate clinical reasoning, in real time." then the input. | S | Medium |
| 6 | Surface the privacy story prominently — "Local-first · audio never leaves your machine unless you start a session" — currently buried | S | Critical |

### 4.7 Biologic Monitoring Dashboard (`/apps/biologic-monitoring-dashboard/index.html`)
**Observed:**
- Tall hero: kicker "CLINICAL REFERENCE" + "Biologic Monitoring Dashboard" + 3-line description with a date stamp.
- Tabs: Filters / Comparison / Results / Entries.
- 3-column "Quick search / Categories / Actions" panel.
- Below: list of regimen cards. Each card: drug class header (BIOLOGICS) + class name (TNF inhibitors / IL-17 / IL-23) + risk pill (HIGH / MODERATE / LOWER) + lab cadence pill + description + Agents list + Indication tags + Lab tags + "View monitoring details" expander.

**Strengths:**
- Best information density on the site for a clinical reference.
- Risk + lab-cadence pills are good semantic color use.
- The card layout actually varies by content (different number of indication tags) — good non-monotony.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | The hero description block is too long — compress to one line + small "About this dataset" expander | S | Medium |
| 2 | Tab bar (Filters / Comparison / Results / Entries) reads as utility — could be navigation? Currently unclear if these are distinct views or sub-actions | M | High |
| 3 | "Categories" pills (Biologics / Targeted / Conventional) — consider a sticky filter rail on left so users don't lose them when scrolling | M | Medium |
| 4 | "Switch to table view" hidden in Actions panel — promote to a primary toggle next to the regimen list (icon button) | S | Medium |
| 5 | Each regimen card shows redundant info (BIOLOGICS · TNF inhibitors heading is shouting) — drop the BIOLOGICS kicker since the section is already biologics | S | Low |
| 6 | Add a "Print monitoring checklist" CTA per card (clinicians want printable artifacts at point of care) | M | High |

### 4.8 WoundCare Webpages (`/apps/WoundCareWebpages.html`)
**Observed:**
- Reads literally like raw RMarkdown print output. R function definitions visible (`p_table <- function(tab_data, ...)`), code chunk dumps showing massive untrimmed tables of provider categories, "this is an R Markdown document" boilerplate.
- Date "11/21/2019" — 6 years stale.

**This page is broken-in-public.** It exists at a URL but the content is developer artifacts, not patient/clinician-facing material.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | **Decision needed:** is this content alive or archived? If alive, re-knit with `echo=FALSE` and proper output suppression. If archived, move to `/legacy/` and add a banner. | S | Critical |
| 2 | If kept active: re-render with editorial styling (constrained reading column, max-width ~720px, proper heading hierarchy, no code blocks visible) | M | High |
| 3 | Update the 2019 date or remove it (currently signals abandonment) | S | High |

### 4.9 Legacy apps index (`/apps/legacy/index.html`)
**Observed:**
- Already audited in the contract. Centered "Apps" hero, sectioned by Clinical / Mind maps / Reference. Each card: title + description + Open button.
- "Featured" pill on Dermatology Scribe with darker emphasis — good.

**Status:** OK as a legacy index. Not a primary surface.

**Improvement options:**

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | Add a banner at top: "These are the legacy versions. Active versions live at /apps." with link | S | High |
| 2 | Visually de-emphasize compared to active /apps — slightly faded styling, smaller cards | S | Medium |
| 3 | Consider whether this page should be reachable at all — the canonical surface is `/apps`. Either redirect or label as internal. | M | Medium |

### 4.10 PDF Merger / Splitter / Text Extractor legacy redirects
These all redirect to PDF Studio with the appropriate tool selected — correct behavior. No changes needed beyond making sure the redirect is fast and the destination tool is auto-selected (it already is).

### 4.11 External apps (Skinoculars, Clinisched, SkinScores)
Out of scope — separate repos. But on the catalog page, treat them visually identically to in-repo apps so users don't perceive them as second-class citizens.

---

## 5. Mobile review highlights

Pages were re-rendered at 375×812:

- **Home:** the offset hero card becomes a centered single column. The shaders react background still works. Acceptable but loses the asymmetric design intent. Consider a mobile-specific composition (large display title taking 80vh, then content stack below).
- **Apps:** the desktop split layout collapses correctly. The emoji filter chips are even more visible on mobile and look unprofessional. **Replace.**
- **Research dashboard:** the 6 stat tiles wrap to 2 per row — fine. The horizontal bar charts are hard to read at narrow width — labels truncate. Consider stacking or rotating for mobile.
- **Mindmaps:** mobile usability is the worst on the site for any tool. D3 mind maps need specific mobile treatment — consider replacing with the linear "Outline" view by default on touch devices.

---

## 6. Recommended roadmap (priority order)

### Phase 1 — Hygiene (1-2 days, high ROI, low risk)
1. Purge purple/violet/indigo from: About skill bars, Apps page placeholders, Blog thumbnails, Astro mindmaps active tab, Apps page selected-card glow.
2. Replace emoji filter chips on Apps page.
3. Fix the empty-white-space layout bug on Dermpath Differentials.
4. Fix Astro mindmaps initial zoom-to-fit.
5. Decide on AdSense slots — keep with constrained styling or remove.
6. Decide on WoundCare page — kill or rebuild.
7. Remove "LEGACY" badge from active tools.

### Phase 2 — Hierarchy (3-5 days, high impact)
8. Replace the About skill-bar percentages with one of options A/B/C in §2.2.
9. Replace Blog 3-column gradient grid with magazine-layout.
10. Replace Apps page purple preview with screenshots / typography posters.
11. Replace Legacy page card grids with chronological list.
12. Compress Research dashboard's 6 metrics to 3 primary + 3 secondary; add chart legends + interpretive captions.
13. Reduce Dermpath Modern's white-card-on-dark contrast clash; pick one theme.
14. Restructure RAMIE landing as chat-first with sample prompts.

### Phase 3 — Editorial polish (1-2 weeks)
15. Adopt Playfair italic for emphasis; expand display scale.
16. Introduce one bento or full-bleed section per major page to break grid monotony.
17. Add `Cmd-K` global command palette across the Astro site.
18. Audit and unify Astro vs legacy mindmaps — pick one path forward.
19. Add print-friendly checklist export to Biologic Monitoring.

### Phase 4 — Considered redesigns (1+ months)
20. Decide whether `/legacy` and `/about` should be merged into a single "Career & archive" timeline.
21. Decide whether Dermatopathology Differentials and Dermatopathology Navigator (modern) should be merged.
22. Mobile-specific compositions for Home and Mindmaps rather than responsive shrinks.
23. A11y/perf pass: scroll-fade audit, image lazy-load review, focus-visible coverage.

---

## 7. What this audit didn't cover

- A11y compliance (WCAG color contrast on every surface, focus order, screen-reader labels).
- Performance (LCP, CLS, JS bundle size per page).
- SEO and structured-data validation.
- The 404 page (didn't directly screenshot).
- The internal `/tasks` board.
- The actual content on Astro mindmaps for topics other than Alopecia.
- External-hosted apps (Skinoculars, Clinisched, SkinScores) — separate repos.

These should be follow-up audits with their own scoped methods.
