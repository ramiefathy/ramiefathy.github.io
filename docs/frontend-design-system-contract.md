# Frontend Design System Contract (Canonical) + Legacy Apps UI Audit

This document is the **hard constraint contract** for any frontend UI work in this repo (Astro pages, React islands, legacy HTML apps under `site/public/apps/**`).

It exists because AI-assisted code generation tends to converge on the same low-quality visual patterns (“vibecoded”): purple gradients, default Tailwind grays, centered card heroes, generic 3-column feature grids, and inconsistent tokens. The goal is to keep the site and tools looking **intentional, clinical, and professional**.

**Update this doc** whenever we:
- Change the design contract rules,
- Change the shared legacy token system in `site/public/apps/shared/**`,
- Or do a major UI pass that updates the “Known issues / recommendations” sections below.

## Where this is enforced in code
- Legacy apps token + “no vibecoded patterns” tests: `site/src/security/frontend-design-contract.test.ts`
- Canonical route/app inventory driving Playwright: `docs/site-test-inventory.md`
- Opt-in screenshot audit (not CI-enforced): `npm --prefix site run test:e2e:visual-audit` (outputs under `site/test-results/visual-audit/`)

---

## Frontend Design System Contract (Hard Constraints)

### Purpose
AI code generation tools converge on a recognizable “vibecoded” aesthetic: purple gradients, Inter font, three-column feature grids, fade-up animations on everything, and shadcn/ui defaults without customization. This contract prevents that convergence by establishing explicit design rules that must be satisfied before any frontend code is written.

### 1) Color System

**Banned**
- `indigo-500` (`#6366F1`), `indigo-600` (`#4F46E5`), `violet-500` (`#8B5CF6`), `violet-600` (`#7C3AED`), `purple-500` (`#A855F7`)
- Any `from-{blue|purple}-* to-{purple|blue}-*` gradient
- Purple, violet, or indigo as primary or accent unless the project’s brand identity explicitly requires it
- The default shadcn/ui achromatic theme without custom color tokens

**Required**
- Define `--primary`, `--accent`, `--background`, `--foreground`, and `--muted` CSS custom properties **before** generating any components
- Use a palette appropriate to the project domain (medical = trustworthy blues/greens/whites)
- Limit the palette to 2–4 intentional colors plus neutrals
- If no brand palette is specified, choose a **non-purple** palette and state the rationale

Example palettes (rotate — never reuse the same one consecutively):

```css
/* Warm editorial */   --primary: #B45309; --accent: #1E3A5F; --bg: #FFFBF5;
/* Clinical trust */   --primary: #0F766E; --accent: #164E63; --bg: #F0FDFA;
/* Bold minimal */     --primary: #000000; --accent: #DC2626; --bg: #FFFFFF;
/* Earth modern */     --primary: #78716C; --accent: #A16207; --bg: #FAFAF9;
/* Deep luxury */      --primary: #1C1917; --accent: #CA8A04; --bg: #0C0A09;
```

### 2) Typography

**Banned**
- Inter, Poppins, Montserrat, Roboto, DM Sans, or Geist Sans as the sole typeface
- Single font family for both headings and body text
- Default Tailwind type scale without project-specific customization
- Uniform `font-extrabold` on all headings

**Required**
- Specify at least **two** typefaces: one for headings, one for body text
- Neither typeface may be Inter, Poppins, Montserrat, or Roboto
- Define a hierarchy with intentional variation in weight, tracking, and color (not just size)
- Install fonts via `@fontsource/*` packages, Google Fonts CDN, or local files

Recommended font pairings (rotate):
- Headings: Instrument Serif | Body: General Sans
- Headings: Cabinet Grotesk  | Body: Source Serif 4
- Headings: Clash Display    | Body: Satoshi
- Headings: Playfair Display | Body: IBM Plex Sans
- Headings: Space Grotesk    | Body: Lora
- Headings: Fraunces         | Body: Commissioner

Type scale template:

```css
--font-heading: 'Instrument Serif', serif;
--font-body: 'General Sans', sans-serif;

h1 { font-family: var(--font-heading); font-size: 3rem; font-weight: 500; letter-spacing: -0.02em; color: var(--foreground); }
h2 { font-family: var(--font-heading); font-size: 2rem; font-weight: 500; letter-spacing: -0.01em; }
h3 { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 600; }
body { font-family: var(--font-body); font-size: 1rem; font-weight: 400; line-height: 1.65; color: var(--muted-foreground); }
.caption { font-family: var(--font-body); font-size: 0.875rem; font-weight: 500; letter-spacing: 0.02em; text-transform: uppercase; }
```

### 3) Layout

**Banned**
- Canonical vibecoded section order: hero → logo cloud → 3-col features → testimonials → pricing → CTA → footer
- Three equal-width feature cards in `grid md:grid-cols-2 lg:grid-cols-3` with icon + title + description
- Centered hero with `text-center max-w-3xl` + dual CTA buttons
- Semi-transparent navbar with `backdrop-blur` as the default navigation pattern
- Logo cloud / partner logo strip immediately below the hero

**Required**
- Use at least one layout technique that breaks the three-column-card pattern:
  - bento grid (varied cell sizes), asymmetric split (60/40 or 70/30), single-column editorial flow,
    overlapping elements, off-center composition, or full-bleed alternating with constrained
- Hero sections must **not** be centered-text-with-two-buttons
- Navigation should be context-appropriate (top bar, sidebar, minimal, hidden) — not reflexive blur bars
- Section order must follow content logic, not a template

### 4) Components

**Banned**
- Sparkle emoji (✨) anywhere in the UI
- Emojis as substitutes for designed icons in feature lists, navigation, or pricing
- Lucide icons at uniform 24×24 / 2px stroke as the only icon treatment site-wide
- Inconsistent border radius (mixing 4px, 12px, 32px, circular on the same page)
- Shadow escalation: `shadow-sm` at rest → `shadow-2xl` on hover
- Fake testimonials with generic names and AI-generated avatars

**Required**
- Pick one border radius base and derive all others: `--radius: Npx`
  - cards at `radius + 4px`, buttons at `radius`, small elements at `radius - 2px`
- Shadows follow semantic elevation (surface → raised → overlay → modal)
- If using an icon library: vary icon size by context (16/20/24)
- Testimonials must be clearly marked placeholders: `[Customer Name, Role at Company]`

### 5) Animation & Interaction

**Banned**
- Universal fade-up animation on everything
- Staggered children with uniform `delay: index * 0.2`
- `transition-all duration-300` applied globally
- `hover:-translate-y-2 hover:shadow-2xl` on every card
- `hover:scale-105 active:scale-95` on every button
- Bounce overshoot, cursor-following shadows, rotation-on-hover

**Required**
- ≤30% of visible elements animate on load; the rest should be static
- Vary transition duration by interaction type:
  - 100–200ms hover/focus, 250–400ms layout, 400–600ms page transitions
- Use intentional easing: `ease-out` (entrances), `ease-in` (exits), `ease-in-out` (layout)
- Hover effects are subtle and reserved for truly interactive elements

### 6) Copy & Content

**Banned**
- Generic taglines (“Build your dreams”, “Launch faster”, etc.)
- Generic CTAs (“Get Started”) without context
- Buzzword stacking (“effortlessly”, “revolutionize”, etc.)

**Required**
- CTAs reflect the actual action (“Open the editor”, “Download PDF”, etc.)
- Hero copy states specific value, not aspiration
- `<title>` is descriptive, not default boilerplate
- Social links are real or TODO-marked (never `href="#"`)
- `<meta name="description">` exists and is relevant
- Copyright uses the current year

### 7) Pre-Generation Checklist

```text
[ ] Color palette defined — no purple/indigo/violet (unless brand-explicit)
[ ] Two typefaces selected — neither is Inter/Poppins/Roboto/Montserrat
[ ] Layout plan sketched — does NOT follow hero → 3-col → testimonials → pricing
[ ] Border radius system chosen — one base value, consistently derived
[ ] Animation budget set — which ≤3 elements will animate, and how
[ ] CTA language drafted — specific to the product, not generic
[ ] Design direction named — can describe the aesthetic in 2–3 words
```

### 8) Post-Generation Self-Review

```text
[ ] grep for indigo|violet|purple — NONE present (or brand-justified)
[ ] grep for text-center in hero sections — hero is NOT centered-text-with-two-buttons
[ ] grep for grid-cols-3 — no three-equal-card feature grids
[ ] grep for opacity.*0.*translateY|opacity.*0.*y: — fade-up on ≤3 elements
[ ] grep for hover:-translate-y — lift effect on ≤1 element
[ ] grep for hover:scale — scale effect is purposeful, not everywhere
[ ] grep for href="#" — no dead links
[ ] Verify <title>, copyright year, meta description are correct
[ ] Verify two distinct font families are loaded and applied
[ ] Verify border radius is consistent (one base value ± derived variants)
```

---

## Legacy Apps Visual Audit (2026-02-14) — Observed Issues + Targeted Fix Ideas

This section is based on the screenshot set produced by:
- `npm --prefix site run test:e2e:visual-audit`

Screenshots are written locally under `site/test-results/visual-audit/<runId>/` (not committed).

### Cross-cutting issues (affects multiple apps)

1) **Legacy shell breaks layouts on pages where `<body>` uses `display:flex` without `flex-direction: column`.**
   - Symptom: shell renders “to the left” of the app, creating giant dead space and a broken two-column layout.
   - Seen in: PDF Splitter + Text Extractor screenshots.
   - Source: `site/public/apps/PDF Splitter.html` and `site/public/apps/textExtractor.html` use `flex` but not `flex-col`.

2) **Mixed design systems: token CSS + Tailwind grays + hardcoded hex.**
   - Symptom: inconsistent typography/color contrast; dark mode breaks; pages look “stitched together”.
   - Fix direction: prefer token-backed CSS (`legacy-tokens.css` + `legacy-primitives.css`) and only use Tailwind utilities where unavoidable.

3) **Unstyled native file inputs degrade perceived quality and consistency.**
   - Fix direction: standardize a single “file picker” pattern (button + filename + hint) across PDF tools.

4) **Unsafe / brittle UI rendering patterns still exist in some apps.**
   - Example: `innerHTML` used to render preflight summaries that include user-controlled file names.
   - Fix direction: build DOM nodes via `textContent` or sanitize explicitly (never interpolate file names into HTML).

### Page-by-page notes (top issues)

#### 01 — Legacy apps index (`site/public/apps/legacy/index.html`)
- Problems: monotone hierarchy (all sections/cards same “weight”), buttons and right-aligned notes feel disconnected, tags are noisy and low-contrast.
- High ROI: vary section weight (featured Clinical), remove the “hero-in-a-box” pattern, consolidate repeated tags at section level, tighten CTA column.

#### 02–04 — MindMaps (`site/public/apps/MindMaps/**`)
- Problems: **purple/violet node palette** (hardcoded in D3 renderer) clashes with teal token palette; initial view has excessive whitespace; controls lack grouping; links too faint; node labels are small for long medical terms.
- High ROI: move node colors to token-backed teal/cyan ramp; improve initial fit/zoom; group controls; increase font size/radii slightly; increase link visibility.
- Sources:
  - Renderer: `site/public/apps/MindMaps/*/js/d3-renderer.js`
  - Shared CSS: `site/public/apps/MindMaps/shared/mindmap-base.css`
  - Theme CSS: `site/public/apps/MindMaps/*/css/theme.css`

#### 05 — PDF Merger (`site/public/apps/PDF Merger.html`)
- Problems: centered single-card layout feels like a demo; file input is native browser chrome; status text uses emoji + arbitrary colors; preflight uses `innerHTML` with file names.
- High ROI: switch to a 60/40 split layout (inputs left, preflight/results right), normalize status rendering via shared status components, remove emoji from workflow status, render preflight safely.

#### 06 — PDF Splitter (`site/public/apps/PDF Splitter.html`)
- Problems: shell renders as a left-side block due to `body` flex-direction; inconsistent alignment (Step 3 centered but others left); remove-row affordance is small; uses Tailwind grays not tokens.
- High ROI: fix `body` layout (column), unify section alignment, adopt token-backed colors, tighten spacing, make row removal a consistent icon/button.

#### 07 — Text Extractor (`site/public/apps/textExtractor.html`)
- Problems: same shell/flex issue; “Important Notes” contains literal `**markdown**` and backticks; heavy shadow; Tailwind grays; preflight uses `innerHTML`.
- High ROI: fix layout, remove markdown artifacts, convert notes box to token-based warning component, safe preflight rendering.

#### 08 — Wound Care (`site/public/apps/WoundCareWebpages.html`)
- Problems: reads like raw RMarkdown output (code-heavy), weak typographic hierarchy, limited navigation affordance, container width/spacing not tuned to reading.
- High ROI: wrap content in an editorial “reading layout” (single column with max-width), improve code block styling, add a sticky table-of-contents or in-page nav.

#### 09 — Biologic Monitoring Dashboard (`site/public/apps/biologic-monitoring-dashboard/index.html`)
- Problems: information density is extremely high; content looks like a long unstructured printout; hard to scan; no obvious “jump” navigation.
- High ROI: add anchored TOC (left rail) + sticky filters/search; reduce per-card vertical padding; add “view modes” (compact vs expanded).

#### 10 — Dermpath Differentials (`site/public/apps/dermatopathology-differentials.html`)
- Problems: overall structure OK, but “empty state” dominates; header chrome is heavy; duplicates theme toggle; needs clearer “first action” emphasis.
- High ROI: emphasize primary action (search/select), reduce header noise, ensure empty state sits in-context (right pane) not as a blank “app”.

#### 11–14 — Dermpath Modern HTML (`site/public/apps/dermatopathology-modern/*.html`)
- Problems (index.html): “AI dashboard” styling (glass + heavy chrome + long card sprawl) harms readability and perceived authority; excessive vertical scroll; unclear legend for color borders.
- High ROI: subtractive redesign (remove shader background, solid cards, collapse list into expandable groups, add legend, simplify toolbar).
- Problems (index-fixed.html): better, but still has gamification/emoji and dashboard widget clutter.

#### 15–16 — Scribe (`site/public/apps/dermatology-scribe/*.html`)
- Problems (index): centered card with large whitespace; duplicated controls; typography feels generic; needs stronger hierarchy + more “app-like” layout.
- Problems (test-ui-enhancements): **explicit contract violations**:
  - purple gradient toast (`linear-gradient(... #667eea ... #764ba2 ...)`),
  - emoji in a primary UI notification,
  - lots of inline styles / `innerHTML`.

---

## Recommended next steps (high ROI, low regression risk)

1) Fix shell + flex layout breakage across all legacy pages (make shell positioning robust).
2) Purge purple/violet/indigo accents in MindMaps renderer and scribe test page.
3) Normalize PDF tools into a shared “2-pane workflow” layout:
   - left: inputs; right: preflight, progress, download outputs
4) Replace raw markdown artifacts and native inputs with token-backed primitives.
5) Reduce chrome and dashboard noise in dermpath modern pages (subtractive redesign).
