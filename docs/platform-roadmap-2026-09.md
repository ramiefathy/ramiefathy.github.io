# Platform Roadmap: knowledge graph, publishing layer, and six new apps

**Author:** claude-code (planning session, 2026-09-05)
**Status:** Proposal for review. Nothing in this document is built yet.
**Companion docs:** `docs/site-test-inventory.md` (surface contract), `docs/frontend-design-system-contract.md` (design contract), `docs/devlog.md` (change log), `CLAUDE.md` / `AGENTS.md` (agent conventions).

This plan covers eight workstreams the owner asked for, in the order they should be built:

| # | Workstream | Why this order |
|---|---|---|
| 0 | Foundations (repo hygiene, licensing, storage, CI gates) | Everything below depends on a license decision and a place to put large files. |
| 1 | Knowledge-graph unification | Every clinical app below reads from it. |
| 2 | Publishing layer (MDX blog, RSS, sitemap, JSON-LD, OG images, talks, changelog) | Every result below needs a place to be announced and cited. |
| 3 | Open Data API + Zenodo DOIs | Makes the graph and benchmark citable; cheap once 1 and 2 exist. |
| 4 | Open Dermatology VLM Benchmark | The citable research output; must ship before fellowship. |
| 5 | Citation-verified MCQ engine + unified spaced repetition | Depends on the graph's reference table and the publishing layer. |
| 6 | Immunosuppression timeline planner | Depends on the graph's drug entities and the source-audit workflow. |
| 7 | Dermatopathology virtual slide viewer + morphology trainer | Depends on unified SRS and external tile storage. |
| 8 | Consumer derm-AI app scorecard | Independent; scheduled last because it is the least coupled. |

Every section below has the same shape: **what exists today (verified in-repo)**, **design**, **deliverables**, **acceptance criteria**, **risks and open decisions**. Verified facts cite `file:line`. Anything marked *assumption* or *unverified* is exactly that.

---

## Working assumptions (please confirm or correct)

1. **Fellowship start is July 2027.** The profile lists PGY-4 at Johns Hopkins with an incoming MGB fellowship (`site/src/data/profile.json:19-20`). That gives roughly 42 weeks from this plan's date. Every "before fellowship" milestone below assumes that date.
2. **One primary human plus coding agents.** Effort estimates are in agent-assisted weeks, not team-weeks. Parallel tracks are marked; most weeks assume two tracks at once, not more.
3. **GitHub Pages stays the deploy target for `ramiefathy.com`,** with Cloudflare in front (per `CLAUDE.md`). GitHub Pages ignores `site/public/_headers`, so any header-dependent behaviour (CORS, cache-control) must be set at Cloudflare or avoided.
4. **No PHI anywhere, ever.** All six apps are teaching or research surfaces. No app stores patient identifiers, and the two decision-adjacent ones (planner, MCQ) take only synthetic or date-only inputs.
5. **Content licensing splits code from data.** Code stays MIT (root `package.json`). Datasets get CC BY 4.0. This is a decision, not a fact; see Workstream 0.

---

## Workstream 0: Foundations (weeks 1–2)

### What exists today
- Root `package.json` declares MIT but there is **no `LICENSE` file, no `CITATION.cff`, no `.zenodo.json`** anywhere in the repo.
- `site/public/sw.js` applies stale-while-revalidate to every same-origin GET with a single cache name `rf-site-static-v1` and no path exclusions. Any new JSON or RSS endpoint will be served stale until the cache name changes.
- CI (`.github/workflows/ci.yml`) runs Vitest, the Astro build, a D&D asset contract check, the scribe simulation guard, Playwright, and the Python compile/pytest step. There is **no scheduled workflow** and no Lighthouse or axe gate.
- Two concrete defects found during the survey that should be fixed before building on these apps:
  - `site/public/apps/rheum-derm-clinical-trials/index.html` (the committed stub) fetches `dashboard.0.b64` through `dashboard.6.b64`, which do not exist. The real shards are `dashboard.00.b64` through `dashboard.10.b64` plus `08a`/`08b` (`site/scripts/assemble-rheum-derm-dashboard.mjs:20-33`). The stub only works because `npm run build` overwrites it.
  - The psoriasis mind map carries 21 numeric citation markers such as `\[2, 7\]` across `subtypes.json`, `comorbid.json`, `patho.json`, `psa.json` with **no bibliography anywhere in the repo**. They render to users as dead bracketed numbers.
- `site/public/apps/biologic-monitoring-dashboard/data.js:1-27` has self-colliding condition slugs (`hidradenitis-suppurativa` and `hidradenitis`; `lupus`, `cutaneous-lupus`, `systemic-lupus-erythematosus`; `autoimmune-blistering-disease`, `immunobullous`, `pemphigus`).
- `dermatotarget-atlas` has a Playwright spec and an inventory entry but is absent from `site/src/data/apps.json`. Unclear whether that is intentional.

### Deliverables
1. `LICENSE` (MIT, code) and `LICENSE-DATA` (CC BY 4.0) at repo root, plus `CITATION.cff` and `.zenodo.json` skeletons. Zenodo's GitHub integration deposits on **GitHub Releases**, so a release tagging convention is needed: `data-v<semver>` for dataset releases, `bench-v<semver>` for benchmark releases.
2. Service worker v2: bump cache name; network-first (or bypass) for `/api/`, `/data/`, `/rss.xml`, `/sitemap*.xml`; keep stale-while-revalidate for HTML and static assets.
3. Fix the trials `index.html` stub so the committed file matches the shard names (or commit the assembled artifact and stop overwriting it; either is fine, but the repo should not contain a loader that cannot load).
4. Resolve or strip the 21 dangling psoriasis markers. Preferred: recover the source bibliography if it exists off-repo and add it as a `references` block resolved by the tooltip renderer; fallback: strip markers and add structured `DiagramCitation`-style refs to the tooltips that make specific claims.
5. Large-file storage decision: **Cloudflare R2** bucket (S3-compatible, free egress) for WSI tiles, benchmark prediction dumps, and any dataset over a few MB. GitHub Pages has a 1 GB site limit and 100 MB per-file limit; the 13 MB `study/mcq-benchmark-dashboard/dashboard.json` is already the wrong shape for this host.
6. CI additions: Lighthouse CI budget on `/`, `/apps`, `/research` (performance ≥ 90 on desktop, accessibility 100); axe-core assertions inside `site/tests/inventory-surface.spec.ts` for every `astroRoutes` entry; a weekly scheduled workflow slot (used by Workstream 2's publication refresh and Workstream 4's leaderboard rebuild).
7. `docs/INDEX.md` refresh (last updated Sept 2025) and a `docs/devlog.md` entry per shipped phase, per `CLAUDE.md`.

### Acceptance
- `npm run site:test`, `npm run site:build`, `npm run site:test:e2e` green with the new gates.
- Opening the committed trials stub in a browser loads the dashboard without a build step, or the stub is gone.
- Zero `\[\d` markers in `site/src/data/mindmaps/**`.

### Open decisions
- Confirm CC BY 4.0 for data (alternatives: CC BY-NC 4.0 if commercial reuse is a concern; CC0 if maximum reuse is the goal). Note that CC BY-NC would conflict with some downstream academic uses and with Zenodo's default recommendation.
- Whether `dermatotarget-atlas` should be listed in `apps.json`.
- Cloudflare R2 account and monthly budget (expected under USD 5/month at planned volumes; *unverified*).

---

## Workstream 1: Knowledge-graph unification (weeks 2–10)

### What exists today (verified)
Five surfaces carry overlapping rheum-derm content with no shared identifiers and no cross-links between them (grep for each app's route slug inside the others returns zero hits).

| Surface | Data location | Records | Identity | Evidence vocabulary | Load path |
|---|---|---|---|---|---|
| Immune Atlas | inline `const DATA` at `site/public/apps/rheum-derm-immune-atlas/index.html:328` (~380 KB) | 18 conditions, 100 pathways, 49 medications, 143 effects, 239 manifestation links, 62 references | slugs `psa`, `sle`, `dm`, `mtx`, `jaki`, `tnfi_ada`; pathways have **no id** (positional `pathIndex`) | A/B/C/D with rubric in `meta.rubric`; `refs[]` resolve to `references` table | classic script global |
| Clinical Trials | 12 gzip+base64 shards assembled by `site/scripts/assemble-rheum-derm-dashboard.mjs`; `registry-regimens.json` (142 NCT records) | 214 studies | slugs `s001-…`; `condition` is free text with **103 distinct values**; `intervention` free text with doses embedded | A1/A2/B1/B2/C1/C2/E/N plus six `evidenceState` values; per-study denormalized `citation`/`doi`/`nct` | hash-gated build step |
| Therapeutics Field Guide | Parcel bundle with inlined data at `site/src/data/rheum-derm-medication-dashboard/index.html` | 60 drugs, 14 conditions, condition→drug edges via `S(drug, tier, …)` | drug ids `adalimumab`, `mtx`, `ivig`; condition ids `dm`, `lupus`, `psopsa` | tiers Anchor/Alternative/Refractory/Adjunct/Emerging plus `regulatoryStatus`; per-record `sources[{label,url}]` | prerendered Astro endpoint |
| Biologic Monitoring | ES module `site/public/apps/biologic-monitoring-dashboard/data.js` | 26 class-level entries | ids `tnf-inhibitors`, `methotrexate`, `ivig`; 24 condition slugs with collisions | `riskLevel` only, no grade; `references[{label,url}]` | ESM import |
| Mind maps | 16 topic dirs under `site/src/data/mindmaps/` (120 files) | 592 nodes, 47 diagrams, 7 comparisons; 11 of 16 topics are 2-node stubs | node ids local to a tab, not globally unique | diagrams require `{pmid|doi|url, quote}` (`site/src/apps/mindmaps/schema.ts:166-184`); tooltips have no structured refs | Vite `import.meta.glob`, validated at build |
| DermatoTarget Atlas (unlisted) | 8 JSON files under `site/public/apps/dermatotarget-atlas/data/` | 600 target rows, 6 diseases | **EFO disease ids, Ensembl target ids, NCT, PMID** | `literature.grade`, `readiness.tier` | runtime fetch |

Concrete collisions: methotrexate is `mtx` (atlas, field guide) and `methotrexate` (monitoring). Adalimumab is `tnfi_ada` (atlas, class-level), `adalimumab` (field guide, molecule-level), and folded into `tnf-inhibitors` (monitoring). Dermatomyositis appears as nine distinct free-text condition strings in the trials data and has no mind map topic. The only alias table in the repo is the 9-entry search-synonym map at `site/src/apps/mindmaps/synonyms.ts`.

### Design

**Principle: add a canonical layer and crosswalks; do not rewrite the five apps first.** The apps keep shipping unchanged while the graph is built beside them, then each app is migrated to read canonical ids in its own PR.

```
site/src/data/graph/
  schema/            zod schemas (zod is already a dependency) + generated JSON Schema
  entities/
    conditions.json  canonical condition records
    drugs.json       canonical drug records (molecule level) + drug-classes.json
    pathways.json    canonical pathway/target records
    references.json  canonical reference table (PMID/DOI/NCT/URL keyed)
  edges/
    condition-drug.json      indication/tier/regulatory edges
    condition-pathway.json   mechanism edges (from atlas pathways + dermatotarget)
    drug-pathway.json        mechanism-of-action edges
    drug-monitoring.json     monitoring/hold/contraindication edges
    trial-*.json             study → condition/drug/reference edges
  crosswalks/
    immune-atlas.json        { atlasId → canonicalId }
    clinical-trials.json     { studyConditionString → canonicalConditionId, interventionString → [canonicalDrugId] }
    field-guide.json
    biologic-monitoring.json
    mindmaps.json            { "topic/tab/nodeId" → canonicalId }
    dermatotarget.json
  aliases.json               surface-form → canonicalId (replaces synonyms.ts over time)
```

**Identifiers.** Canonical ids are stable human-readable slugs (`drug:methotrexate`, `cond:dermatomyositis`, `path:il23-th17`, `ref:pmid:12345678`). Each entity also carries external ids where they exist: drugs → RxNorm CUI and ATC code; conditions → MONDO (with EFO cross-ref, because dermatotarget already uses EFO); pathways → Reactome or GO where sensible; references → PMID, DOI, NCT. External ids are optional fields validated by format, not required, so the graph can be built incrementally.

**Granularity.** Drugs are modelled at molecule level with an explicit `classId`. This matches the field guide (60 molecules) and lets the class-level atlas (`jaki`) and monitoring (`tnf-inhibitors`) entries map to classes while trials map to molecules. A class edge inherits nothing automatically; inheritance is a query-time choice the UI makes visibly.

**Evidence.** Do **not** collapse the three vocabularies into one letter. Every edge keeps `sourceGrade` (verbatim), `sourceGradeSystem` (`atlas-abcd`, `trials-a1n`, `field-guide-tier`, `monitoring-risk`), and gets a computed `canonicalTier` from an explicit, documented mapping table in `schema/evidence-tiers.json`. The UI shows the source grade with the system name; the canonical tier is for filtering and sorting only.

**References.** One table. The atlas's 62 `R##` references and the trials' 214 denormalized citations are the seed. Mind map `DiagramCitation` objects (`pmid`/`doi`/`url` + `quote`) are already the right shape; promote that type to the graph-wide reference-with-quote type. Every edge must carry at least one reference id or an explicit `unsourced: true` flag, which the UI renders as such.

**Tooling.**
- `site/scripts/graph/extract-*.mjs`: one extractor per surface that reads that surface's current data and emits candidate entities + a crosswalk draft with unresolved rows flagged. The trials free-text conditions (103 strings) and interventions get a rules-first normalizer (strip doses, split on `vs`, `+`, `/`) with a human-reviewed override file.
- `site/scripts/graph/validate.mjs` (also a Vitest test): schema validity, referential integrity (every FK resolves), no orphan references, every crosswalk target exists, alias uniqueness, and a **coverage report** (percent of each surface's entities mapped).
- `site/scripts/graph/build.mjs`: emits `site/public/api/v1/graph/*.json` (Workstream 3) and a denormalized search index for the command palette.

**Consumers, in migration order.**
1. New Astro route `/graph` (React island): entity pages `/graph/drug/[id]`, `/graph/condition/[id]`, `/graph/pathway/[id]` with "appears in" panels linking into each of the five apps. This is the first user-visible payoff and requires no app changes.
2. `CommandPalette.jsx` currently indexes a hardcoded 6-item array (`site/src/components/CommandPalette.jsx:23-30`). Replace with a Fuse.js index over pages + apps + graph entities + blog posts.
3. Mind maps: add optional `canonicalId` to `MindMapNode.metadata`; the drawer shows graph links. Enable the existing `crossTopicLinks` flag (`site/src/lib/featureFlags.js`).
4. Field guide, monitoring, atlas: add `data-canonical-id` attributes and deep links; later, read entity names from the graph.
5. Trials: replace free-text `condition` filter with canonical condition facets while keeping the original string visible.

### Deliverables and milestones
- Week 2–3: schemas, evidence-tier mapping, reference table seeded from atlas + trials, validator test in Vitest.
- Week 4–6: six extractors + crosswalks; target ≥ 95% of drugs and ≥ 90% of conditions mapped across all surfaces; unresolved rows listed in a checked-in report.
- Week 6–8: `/graph` route + entity pages; command palette re-index; inventory + design-contract compliance.
- Week 8–10: mind map canonical ids + cross-topic links; deep links from the four legacy apps.

### Acceptance
- Vitest graph validator passes with referential integrity and coverage thresholds asserted numerically.
- Searching "methotrexate" in the palette returns one drug entity whose page lists its atlas effects, trial count, field-guide tiers, and monitoring entry.
- No behaviour change in the five existing apps' Playwright specs.

### Risks
- **Normalizing 103 trial condition strings and hundreds of intervention strings is clinical curation work,** not just code. Budget owner review time; the override file is where that review lives.
- **External ontology mapping can consume unbounded time.** Make external ids optional and time-box the first pass to drugs (RxNorm/ATC are well-covered) before conditions.
- The atlas data lives inside a 539 KB HTML file. Do not edit it in place; extract to JSON in the atlas's own PR and have the HTML load the JSON.

---

## Workstream 2: Publishing layer (weeks 2–8, parallel with Workstream 1)

### What exists today (verified)
- `site/astro.config.mjs` has a single integration (`@astrojs/react`). `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap` are absent from `site/package.json` and the lockfile. `site/src/content/` does not exist.
- `site/src/pages/blog.astro` renders 7 entries from `site/src/data/blog.json`, all off-site links with `target="_blank"`, newest 2022, hardcoded "8 min" read time (`blog.astro:54`).
- `site/src/layouts/MainLayout.astro` emits OG and Twitter tags pointing at a single static `/og.svg` for every page (`MainLayout.astro:14,38,42`). Most crawlers do not render SVG OG images. No JSON-LD, no RSS `<link>`, no sitemap, no `robots.txt`.
- Two lecture microsites exist under `site/public/lectures/` and are deliberately `noindex` (`site/public/_headers`, `docs/site-test-inventory.md:246-253`).
- `docs/devlog.md` has a consistent `## [YYYY-MM-DD] Title` / **What changed** / **Why** / **Verification** structure that can be parsed into a changelog page.
- `site/src/data/publications.js` has 12 entries with the shape `{title, authors, venue, year, url, tags[], featured?}`; the newest are one 2024 and one 2025 entry.
- Design contract constraints that new pages must satisfy: no emoji outside `data` paths, no Google Fonts, banned hex list and font list, at least the type primitives (`kicker`, `display1`, `lede`, …) in use (`site/src/security/site-design-contract.test.ts`).

### Design
1. **Content collections.** `site/src/content/blog/*.mdx` with a zod frontmatter schema (`title, date, updated?, summary, tags[], canonical?, draft, series?, graphRefs?[]`). Keep `blog.json` as an "elsewhere" collection (`site/src/content/elsewhere/`) so the external ABC/Medscape pieces still list. Route `/blog/[slug]` with reading time computed, not hardcoded. MDX lets posts embed the React islands (dashboards, graph entity cards) directly, which is the point.
2. **Feeds and indexing.** `src/pages/rss.xml.ts` (posts + dataset releases + benchmark releases), `@astrojs/sitemap` with the unlisted routes filtered out via the inventory's `unlistedAstroRoutes`/`unlistedStaticPages`, `public/robots.txt` pointing at the sitemap and disallowing the unlisted prefixes.
3. **Structured data.** A `<JsonLd>` Astro component: `Person` on `/` and `/about` (from `profile.json`), `ScholarlyArticle` list on `/research` (from `publications.js`), `BlogPosting` on posts, `Dataset` on each open-data page (Workstream 3), `SoftwareApplication` on `/apps` entries. Validate in CI with a Vitest test that parses each built page's JSON-LD and checks required fields.
4. **OG images.** Build-time PNG generation per route with satori + resvg-js (both pure JS, no browser needed in CI), using Fraunces/Bricolage from `site/public/apps/shared/fonts/`. Fallback to a static PNG conversion of `og.svg`.
5. **Talks page** `/talks`: a `talks` content collection (title, date, venue, slides href, video href, abstract). The two existing lectures stay unlisted unless the owner opts them in; the page ships with whatever the owner is willing to list.
6. **Changelog** `/changelog`: build-time parse of `docs/devlog.md` into entries. Optionally the "what's new" dot in the header that the April 2026 audit proposed, driven by entries in the last 30 days.
7. **Publication freshness.** Weekly scheduled workflow that queries PubMed E-utilities (author query) and, if new records appear, opens a PR editing `publications.js`. Scholar has no API and scraping it is brittle; PubMed plus a manual `ORCID` check is the reliable path. *Assumption:* the owner has or will create an ORCID.
8. **Inventory and palette.** Add `/blog/[slug]`, `/talks`, `/changelog`, `/graph/**` to `astroRoutes`; note the inventory test generates a Playwright test per route asserting `<main>` is visible (`site/tests/inventory-surface.spec.ts:16-25`).

### Deliverables and milestones
- Week 2–3: deps + lockfile, content collections, first three posts migrated or written, `/blog/[slug]`, RSS, sitemap, robots.
- Week 4–5: JSON-LD component + CI validation; OG image pipeline.
- Week 6–8: `/talks`, `/changelog`, publication refresh workflow, palette index.

### Acceptance
- Google Rich Results test passes for `/`, `/about`, one post, `/research` (manual check, recorded in the devlog).
- `curl https://ramiefathy.com/rss.xml` returns a valid feed; W3C feed validator passes.
- Lighthouse SEO 100 on the routes above.

### Risks
- `npm --prefix site install` in CI resolves from the lockfile; adding three integrations bumps transitive deps. Run the full E2E suite before merging; the `optimizeDeps.include` list in `astro.config.mjs` exists because of past Vite 504s and may need `@astrojs/mdx` runtime additions.
- Writing posts is the owner's time, not agent time. The plan ships the platform with three posts; the cadence after that is a personal commitment, not an engineering item.

---

## Workstream 3: Open Data API and Zenodo DOIs (weeks 8–14)

### What exists today (verified)
- `site/public/data/` contains exactly one file, `dermoscopy-llm-eval.json` (295 KB), with no manifest, schema, or version.
- Other public JSON is scattered: `apps/dermatotarget-atlas/data/*.json`, `apps/rheum-derm-clinical-trials/registry-regimens.json` (`schemaVersion: 1`, `retrievedAt`), `mcq-eval/dashboard.json`, `study/mcq-benchmark-dashboard/dashboard.json` (13 MB), `games/games.json`, `music/*.json`.
- No `CITATION.cff`, `.zenodo.json`, or LICENSE (Workstream 0 adds them).
- GitHub Pages cannot set custom response headers; Cloudflare can.

### Design
- **Static, build-generated API** at `/api/v1/`. Astro prerendered endpoints (`src/pages/api/v1/**/*.json.ts`) read `site/src/data/**` and the graph build output and emit JSON. This keeps the API in lockstep with what the site renders.
- **Index and manifest.** `/api/v1/index.json` lists every dataset with `id, title, description, version (semver), schemaVersion, updatedAt, license, sha256, bytes, schemaUrl, doi?`. Each dataset also has `/api/v1/<dataset>/schema.json` (JSON Schema generated from the zod schemas via `zod-to-json-schema`).
- **Datasets in v1:** `graph/{conditions,drugs,pathways,references,edges}`, `trials/studies` (with the free-text originals preserved), `medications`, `monitoring`, `mindmaps/<topic>`, `dermoscopy-eval/aggregate`, `publications`. Files over ~5 MB (the MCQ corpus) live on R2 with a signed manifest entry rather than in `site/dist`.
- **Fail-closed build check.** A Vitest test compares each emitted file's sha256 to the manifest and fails the build on mismatch; a second test asserts each dataset validates against its own published schema. This follows the pattern the trials assembly script already uses.
- **Cache and CORS.** Cloudflare rule for `/api/*`: `Cache-Control: public, max-age=300, stale-while-revalidate=86400`, `Access-Control-Allow-Origin: *`. *Unverified:* whether GitHub Pages already emits a permissive CORS header; test with `curl -I` before relying on Cloudflare.
- **Zenodo.** `.zenodo.json` with creators (ORCID), license, keywords, related identifiers (the site URL, the benchmark repo). Each `data-v*` GitHub Release triggers a Zenodo deposit and a concept DOI plus version DOI. The `Dataset` JSON-LD (Workstream 2) and `index.json` carry the DOI back onto the site.
- **Docs page** `/data`: human-readable catalogue with schema links, DOI badges, changelog per dataset, and a "how to cite" block generated from `CITATION.cff`.

### Acceptance
- `curl https://ramiefathy.com/api/v1/index.json | jq '.datasets | length'` ≥ 10; every listed sha256 matches.
- First Zenodo DOI minted for `data-v1.0.0`; DOI visible on `/data` and in RSS.

### Risks
- **Content provenance.** The trials dataset paraphrases study findings; the mind maps quote sources. Both are the owner's synthesized text and are fine to license, but any verbatim quotes longer than a sentence should be attributed and kept short. Do a pass before the first release.
- Semver discipline on data needs a written rule: patch = typo/ref fix, minor = new records, major = schema or id changes.

---

## Workstream 4: Open Dermatology VLM Benchmark (weeks 6–24; overlaps 1–3)

### What exists today (verified)
- The dashboard (`site/src/components/DermoscopyLLMEvaluationDashboard.jsx`, 3,547 lines) renders **aggregates only** from `site/public/data/dermoscopy-llm-eval.json`: 17 models, 6 prompting arms, 8 diagnoses, 100 images, 10,200 trials, Wilson CIs, a 6-way error taxonomy, cost and latency, and pairwise head-to-head from per-(model, arm) 100-bit correctness strings.
- The generator `scripts/generate_dermoscopy_llm_dashboard_json.py` reads a per-trial CSV from a **local desktop path that is not in the repo** and deliberately drops image ids, prompts, and rationales.
- **The dataset identity is not stated anywhere.** No image assets, no per-image predictions, no prompt text, no skin-tone or Fitzpatrick field exists in the repo. The study is Tadros, Zhuo, Fathy et al., JAAD 2025 (`dermoscopy-llm-dashboard.astro:45-47`).
- No McNemar, bootstrap, or calibration analysis exists; the dashboard's head-to-head is win-rate only.

**Implication:** the benchmark is a new study, not an extension of existing data. What is reusable is the dashboard component, the aggregation script's shape, the CI machinery, and the JAAD framing.

### Design

**Separate repository** `ramiefathy/derm-vlm-bench` (Python 3.11+, `uv`, fully pinned). The site consumes its published aggregates; it never runs inference. Reasons: the site repo is Node-centric with a heavy E2E suite, image datasets cannot be redistributed, and a Zenodo software DOI for the harness needs its own release cadence.

**Tracks.** Dermoscopy datasets generally lack skin-tone labels, and clinical-photo datasets with skin-tone labels are not dermoscopic. Two tracks, reported separately, never pooled:

| Track | Candidate datasets | Skin tone label | Label quality | Redistribution |
|---|---|---|---|---|
| A. Dermoscopy | ISIC Archive (2018/2019/2020 challenge subsets), HAM10000 | Largely absent | Histopathology or expert consensus, varies by subset | Licenses vary by contributor (CC-0, CC BY-NC); publish image ids, not images |
| B. Clinical photo, skin-tone stratified | DDI (Diverse Dermatology Images, Stanford), Fitzpatrick17k | DDI: dermatologist-labelled FST I–II / III–IV / V–VI, biopsy-proven. Fitzpatrick17k: crowd-annotated FST, known noise | DDI high; Fitzpatrick17k label noise is documented | DDI requires a data-use agreement and forbids redistribution; Fitzpatrick17k is a list of URLs to third-party atlases |

*Unverified:* current license text and access terms for each dataset. Confirm before the first run and record the confirmed terms in the harness README. The harness must **never** commit or publish images; it publishes image-id manifests with per-dataset hashes and instructs users to obtain images from the source.

**Harness architecture.**
```
derm-vlm-bench/
  configs/            run configs (dataset, split, models, arms, seeds, n) as YAML, hashed into the run id
  datasets/           loaders + manifest builders; label taxonomies per dataset with an explicit mapping to the benchmark's parent classes
  prompts/            versioned prompt arms (the JAAD study's six arms re-implemented and version-stamped)
  providers/          adapters: OpenAI, Google, Anthropic, and an OpenAI-compatible adapter for open-weight models served by vLLM/Ollama
  runner/             async, rate-limited, resumable; caches raw responses keyed by (image sha256, model, prompt hash, seed)
  parsing/            response → label; strict parser with an explicit "unparseable" outcome, never a silent fallback
  metrics/            accuracy, sensitivity/specificity for malignancy, per-class, Wilson + bootstrap CIs, McNemar for paired model comparisons, calibration (ECE) when models emit confidence, per-stratum metrics with minimum-n gating
  export/             per-trial JSONL, aggregate JSON in the dashboard's schema (extended), run manifest with hashes
  leaderboard/        builds the public leaderboard JSON from accepted run manifests
```

**Fail-closed run manifests.** Each run emits `manifest.json` with the config hash, dataset manifest hash, prompt hashes, provider model ids as returned by the API (not as requested), start/end times, cost, and sha256 of every output file. A run without a complete manifest is not eligible for the leaderboard. This mirrors the trials assembly script's hash gates and the repo's stated rigor standard.

**Leaderboard.** Submissions are PRs to `derm-vlm-bench` adding a run manifest and aggregate JSON. CI verifies hashes and schema; a maintainer merges. A scheduled workflow in the site repo pulls the leaderboard JSON into `/api/v1/vlm-bench/` and rebuilds `/research/vlm-benchmark`. The existing dashboard is generalized with a **dataset/track selector and a stratum selector** (skin tone, diagnosis, malignancy), and gets a leaderboard tab that reads the multi-run file.

**Statistics that must be in v1.** Wilson and bootstrap CIs; McNemar with Holm correction for model-vs-model on the same images; per-stratum sensitivity/specificity with a minimum-n floor (suppress cells under 30 images with an explicit "insufficient n" state, never a misleading point estimate); a stated primary endpoint per track (recommend: malignant-vs-benign sensitivity at the model's default operating point, because that is the clinically consequential error).

**Budget.** The JAAD run cost USD 169 for 10,200 trials (about USD 0.017 per trial, `overallStats.totalCost`). A v1 with roughly 1,000 images per track, 10 models, 3 arms, 1 seed is 60,000 trials; at 2–5x the historical per-trial cost for current frontier models, expect USD 2,000–5,000. Open-weight models on a rented GPU add USD 200–500. *These are estimates from one data point.* Gate the budget by running a 100-image pilot per track first.

**Governance and ethics.**
- Public de-identified datasets are typically exempt from IRB review, but Hopkins and MGB policies differ; get a written determination before publishing results.
- Provider terms of service generally permit benchmarking; confirm for each provider at run time and record in the manifest.
- Publish the pre-registration (endpoints, models, arms, analysis plan) on the site before running the full study. This is cheap, and it is the difference between a leaderboard and a paper.

### Deliverables and milestones
- Week 6–8: repo skeleton, provider adapters, two dataset loaders (HAM10000, DDI once access is granted), prompt arms ported, 100-image pilot per track.
- Week 9–10: pre-registration post on the site (Workstream 2), budget approval, dataset terms recorded.
- Week 11–16: full v1 run; metrics module with the statistics above; manifest verification CI.
- Week 17–20: dashboard generalization (tracks, strata, leaderboard tab); `/research/vlm-benchmark` route; `/api/v1/vlm-bench/`.
- Week 20–24: `bench-v1.0.0` release, Zenodo DOIs (software + results), manuscript draft. This lands well before a July 2027 fellowship start and leaves slack for a second seed or a model refresh.

### Acceptance
- Anyone with dataset access and API keys can reproduce a leaderboard row from a config file and get identical aggregates (byte-identical when providers are deterministic, within CI otherwise).
- Leaderboard shows per-stratum sensitivity with suppressed low-n cells.
- Results DOI resolves; the site page cites it.

### Risks
- **DDI access is a formal application** and may take weeks; start it in week 1 regardless of everything else.
- **Fitzpatrick17k label noise** is well documented; treat its FST strata as secondary and say so on the page.
- **Model deprecation mid-run.** Record the exact API model id returned; if a model is retired, the row is frozen with the retirement date, not re-run under a new id.
- **Scope creep toward a full paper pipeline.** The leaderboard and DOI are the deliverables; the manuscript is a by-product, not a gate.

---

## Workstream 5: Citation-verified MCQ engine and unified spaced repetition (weeks 14–28)

### What exists today (verified)
- **No MCQ engine.** `site/public/mcq-eval/` and `site/public/study/mcq-benchmark-dashboard/` are read-only reports of eight open-weight models *writing* board items, judged by LLMs (1,920 and 1,516 items respectively). Generation and judging code is **not in the repo**; only exported artifacts are.
- A rich item schema exists in those artifacts: `stem, leadIn, options[5], correctAnswer, explanationCorrect, distractorExplanations[5], teachingPoint, learningObjective, superdomain, difficulty, itemArchetype` plus a 10-criterion 0–4 rubric and `judgeRuns[]`. **No citation, PMID, or DOI field exists on any item.**
- The dermpath navigator (`site/public/apps/dermatopathology-modern/index-fixed.html`) is described in `apps.json:51` as having an "AI study assistant, spaced repetition"; in the shipped file neither exists. The Gemini call site was stripped for security reasons (`site/src/security/legacy-apps-remediation.test.ts`), the "AI recommendations" are three hardcoded strings, and `studyStats` is never persisted.
- The **only working SRS** is `site/public/apps/spacedRepetition.js` (SM-2, Anki-style, storage key `dermpath_srs_data`), consumed by `site/public/apps/dermatopathology-differentials.html` (grade buttons Again=1 / Hard=3 / Good=4 / Easy=5). Favorites and notes live in a separate key `dermatopathologyDifferentialsState`. Mind maps persist UI state only (`mindmap:<id>:state:v1`).
- Mind map diagrams already enforce `{pmid|doi|url, quote}` citations (`site/src/apps/mindmaps/schema.ts:166-184`); that validator is the seed for citation verification.

### Design

**Item schema v2** = existing artifact schema + `sources[]` where each source is `{refId (graph reference id), locator (section/page/figure), quote, supports: ["stem"|"key"|"option:B"|"explanation"]}` + `verification: {status: "unverified"|"machine-verified"|"human-verified"|"rejected", generator: {model, promptVersion}, verifier: {model, promptVersion}, adjudicator?, verifiedAt}` + `graphRefs[]` (canonical condition/drug/pathway ids). Unverified or rejected items **never** enter the served bank.

**Generation pipeline** (separate repo or `services/mcq-forge/`, Python):
1. **Grounded generation.** The generator is given a bounded source packet: graph entities and their referenced quotes, mind map tooltips and diagram citations, and PubMed abstracts fetched by PMID. It may not cite anything outside the packet. Board-style but synthetic; no reproduction of any board item.
2. **Independent verification.** A different model family from the generator (per the repo's rigor guidance on correlated errors) receives each claim in the stem, key, and explanation and must return, for each, the source id and an exact quote span from the packet that entails it, or `unsupported`. Quote spans are checked by string match against the packet, not trusted. Any `unsupported` claim in the stem or key rejects the item; `unsupported` in a distractor explanation flags it.
3. **Rubric scoring.** Reuse the 10-criterion rubric from the existing artifacts so new items are comparable to the 3,400 already judged.
4. **Human adjudication queue.** An unlisted `/study/adjudicate` route (same `noindex`/`canonical={null}` pattern as other unlisted pages) where the owner approves, edits, or rejects. Approval writes `human-verified`. Target: a bank of 300 human-verified items before public launch, seeded by re-verifying the best-scoring items from the existing 3,400.

**Delivery.** Astro route `/study` with a React island: session builder (by graph entity, superdomain, difficulty), item player with rationale reveal and source quotes shown inline, and per-item "report a problem" that files a GitHub issue via a prefilled URL (no backend). Bank served from `/api/v1/mcq/` (Workstream 3) with only verified items exported.

**Unified spaced repetition.** New module `site/src/lib/study/` (TypeScript, tested):
- Scheduler: port SM-2 from `spacedRepetition.js` for continuity, behind an interface, with FSRS-4.5 as a second implementation selectable per user (FSRS is materially better calibrated; SM-2 first avoids breaking existing decks).
- Card model: `{id, kind: "dermpath-ddx"|"mindmap-node"|"mcq"|"wsi-region", ref, graphRefs[], scheduling…}`.
- Storage: IndexedDB under one database `rf-study` with schema versioning; migration from `dermpath_srs_data` and `dermatopathologyDifferentialsState` on first load; JSON export/import (existing `exportData`/`importData` shape preserved).
- Consumers: `dermatopathology-differentials.html` (swap the import), mind maps (add "study this node" in the side drawer), MCQ player, WSI viewer (Workstream 7).
- Optional later: sync via the existing Firebase functions backend, off by default.

### Deliverables and milestones
- Week 14–16: `site/src/lib/study/` with SM-2 + FSRS, IndexedDB store, migration, tests; dermpath differentials switched over.
- Week 16–20: mcq-forge pipeline; re-verify top existing items; adjudication route.
- Week 20–24: `/study` player; `/api/v1/mcq/`; mind map study hooks.
- Week 24–28: 300 verified items; public launch post; `apps.json` copy for the dermpath navigator corrected to match reality.

### Acceptance
- An item cannot appear in `/api/v1/mcq/` unless `verification.status` is `human-verified` (asserted by a build-time test).
- Every displayed rationale shows at least one clickable source with a quote that string-matches the source packet.
- Existing SRS users keep their cards after migration (Playwright test seeds `dermpath_srs_data`, loads the app, asserts due counts match).

### Risks
- **Verification is only as good as the packet.** If the source packet is thin, the generator produces trivially verifiable but shallow items. Track item difficulty distribution against the existing corpus.
- **Copyright.** Textbook text cannot go in packets. Abstracts, open guidelines, and the site's own content can.
- **Owner adjudication time** is the real bottleneck; 300 items at roughly two minutes each is ten hours.

---

## Workstream 6: Immunosuppression timeline planner (weeks 22–32)

### What exists today (verified)
- Biologic Monitoring has `holdCriteria[]`, `contraindications`, `interactions`, `monitoringSchedule[{timing, relativeWeeks}]` per class (`data.js:80-127`) with `references[{label,url}]` to labels and one PMC article. No half-life, no perioperative, vaccine, or pregnancy fields.
- The Field Guide has `dosing, monitoring, avoid, cautions, regulatoryStatus, sources[]` per molecule.
- Neither has quotes or retrieval dates on its sources.

### Design
**Scope: education only, dates as the only input.** The user enters a hypothetical procedure date, or a conception-planning window, or a vaccine date; the tool renders hold/resume windows and vaccine timing per drug from **rule records**, each of which is a sourced, quoted statement. No weight, labs, or patient identifiers are collected. Nothing is stored beyond the session unless the user exports a PDF (existing jspdf dependency).

**Rule record** (new graph edge type `drug-timing.json`):
```
{ drugId, context: "perioperative"|"live-vaccine"|"inactivated-vaccine"|"pregnancy"|"lactation"|"conception-male"|"conception-female",
  rule: { holdBeforeDays?, resumeAfterCondition?, windowText, appliesTo? (procedure class / vaccine type) },
  halfLifeHours?, halfLifeSource?,
  sources: [{ refId, quote, locator, retrievedAt }],   // minimum two independent sources per rule, or explicit "single-source" flag
  sourceGradeSystem, sourceGrade, canonicalTier,
  reviewedBy: [{ initials, date }],                    // two sign-offs required before "published"
  status: "draft"|"reviewed"|"published"|"retired", supersedes? }
```
Candidate source classes (to be confirmed at build time, not asserted here): ACR/AAHKS perioperative guideline for arthroplasty, ACR vaccination guideline, ACR reproductive health guideline, FDA labels via DailyMed, and specialty society statements. The build rejects a rule whose sources lack quotes or retrieval dates.

**UI** `/apps/immunosuppression-planner` (Astro + React island): drug picker from the graph, context tabs, a horizontal timeline with hold/resume bands, and a "what the sources do not say" panel listing contexts with no published rule for that drug. Every band is clickable to the quote. Persistent banner: teaching tool, not a substitute for the treating clinician's judgement or the label.

**Why the quotes matter beyond rigor.** FDA's clinical decision support guidance treats software that displays recommendations a clinician can independently review, with the basis visible, differently from software that computes a patient-specific recommendation opaquely. Date-only inputs and visible source quotes keep this firmly on the educational-reference side. *This is a design constraint, not legal advice; a short review by someone who does this professionally is warranted before launch.*

### Deliverables
- Week 22–24: schema, two-sign-off workflow (a Vitest test that refuses to publish rules with fewer than two reviewers), initial 15 drugs × perioperative context.
- Week 25–28: vaccine and pregnancy contexts; UI; PDF export.
- Week 29–32: full 60-molecule coverage where sources exist; launch post; `apps.json` + inventory.

### Acceptance
- Every rendered band traces to at least one quote with a retrieval date; the build fails otherwise.
- The "not covered" panel is populated (proving the tool distinguishes absence of evidence from evidence).

### Risks
- Guidelines change; rules need `retired`/`supersedes` and a quarterly review reminder (scheduled workflow opens an issue).
- This is the highest-consequence surface in the plan if misread. Copy, banners, and the two-reviewer gate are not optional.

---

## Workstream 7: Dermatopathology virtual slide viewer and morphology trainer (weeks 26–38)

### What exists today (verified)
- `site/public/apps/dermatopathology-differentials-data.js`: 89 finding → diagnoses entries with free-text `sources` (book and page), no ids, **no images**.
- No deep-zoom viewer, tiles, or WSI code anywhere in the repo.
- SRS exists for finding→diagnosis cards (Workstream 5 unifies it).

### Design
- **Viewer:** OpenSeadragon with DZI tiles; annotation layer via Annotorious (OpenSeadragon plugin) or a thin custom GeoJSON layer; annotations stored as GeoJSON with `graphRefs[]` and structured morphology descriptors.
- **Tiles on R2**, never in the repo (Workstream 0). Tiling pipeline: `vips dzsave` in a small Python/CLI tool with a manifest (slide id, source, license, stain, magnification, sha256 of the source file).
- **Slide sources.** Honest constraint: **public dermatopathology whole-slide images are scarce.** The reliable open source is TCGA-SKCM (melanoma, ~470 diagnostic slides via the GDC portal, open access). Other candidate sets exist on Zenodo and institutional portals but must be checked individually for license and stain quality; treat this as a sourcing task in week 26, and plan v1 around melanoma and whatever else clears licensing. Own de-identified slides would need institutional approval and are out of scope for v1.
- **Morphology trainer.** Structured vocabulary from pattern analysis (reaction patterns, epidermal changes, dermal infiltrate composition and distribution, special features). The learner annotates a region and selects descriptors; scoring is **deterministic** against expert annotations (set overlap and required-feature checks), not LLM-judged. Optional LLM feedback text can come later and is not a v1 dependency.
- **SRS integration.** `wsi-region` cards: a region plus a question (name the pattern, list the top three differentials), scheduled by the unified scheduler.

### Deliverables
- Week 26–28: sourcing + licensing record; tiling tool; 20 slides on R2.
- Week 29–33: viewer route `/apps/dermpath-slides`; annotation layer; expert annotations for the 20 slides (owner time).
- Week 34–38: trainer scoring, SRS cards, launch.

### Acceptance
- Viewer loads a 1 GB-class slide over R2 in under two seconds to first tiles on a typical connection (measured, recorded).
- Every slide page shows source, license, and stain; no slide without a license record ships.

### Risks
- **Slide supply is the gating factor,** not code. If sourcing yields fewer than 20 usable slides, ship the viewer with what exists and say so.
- R2 egress is free but request counts are billed; tile requests per session can reach thousands. Set a Cloudflare cache rule for `/tiles/*` with long TTLs.

---

## Workstream 8: Consumer derm-AI app scorecard (weeks 32–38)

### What exists today
Nothing in-repo. This is greenfield and intentionally last.

### Design
- **Two modes, ship the first only in v1.**
  1. *Evaluate an app yourself:* a guided checklist the public completes about any app they are considering. Domains: intended use clarity, validation evidence (peer review, external validation, prospective study, population), skin-tone coverage (does the app report the FST or Monk distribution of its training and test data), data handling (image retention, sharing, deletion, jurisdiction), regulatory status (FDA clearance or CE mark vs "wellness" positioning), transparency (model card, known limitations), and escalation (does it tell users when to see a clinician). Output: a plain-language summary and a printable one-pager. No app is named by the tool; the user supplies the answers.
  2. *Curated reviews of named apps:* higher value and higher legal exposure (accuracy, defamation, vendor disputes). Defer; if built, every statement must cite a public source with a retrieval date, be dated, and offer a vendor right of reply.
- The rubric should align to published frameworks (regulatory guidance on software as a medical device, mobile health app evaluation models, and dermatology-specific position statements). **Sources are to be identified and cited during the build, not asserted here.**
- Route `/apps/derm-ai-scorecard`, static, no backend; answers stay in the browser; optional PDF export.

### Deliverables
- Week 32–34: rubric with cited framework mapping; owner review.
- Week 35–38: UI, PDF, launch post.

### Acceptance
- Every rubric item links to the framework element it derives from.
- Readability check on the plain-language copy (target: general audience).

---

## Cross-cutting engineering rules for every workstream

1. **Surface contract.** Every new route goes into `docs/site-test-inventory.md` (`astroRoutes`, or `unlistedAstroRoutes` with `noindex={true}` and `canonical={null}` and `allowedLinkFiles`). The inventory test auto-generates a Playwright test per route.
2. **Design contract.** No emoji in non-data source, no Google Fonts, banned hex/font lists, type primitives in use, single dark theme, coral as the only accent hue. Run `npx vitest run src/security/site-design-contract.test.ts` before pushing.
3. **Data validation is a test.** Every dataset has a zod schema and a Vitest test; every build-emitted artifact has a hash in a manifest that a test checks.
4. **Fail closed on evidence.** Unsourced edges render as unsourced; unverified items are not served; low-n strata are suppressed; rules without two sign-offs do not publish.
5. **No secrets in the browser.** Any LLM call goes through a backend (the scribe's sessionStorage-only JWT pattern at `site/public/apps/dermatology-scribe/app.js:1-52` is the reference) or happens offline in a pipeline. The dermpath navigator's stripped Gemini key is the cautionary example.
6. **Devlog per phase**, commit format `agent(<name>): <summary>`, vault update when the vault is present (per `CLAUDE.md`).
7. **Large files go to R2**, never to `site/public`.

## Sequenced calendar (assumes two parallel tracks)

| Weeks | Track A | Track B |
|---|---|---|
| 1–2 | Foundations (licenses, SW v2, stub fix, CI gates) | Start DDI access application; confirm dataset terms |
| 2–6 | Graph schemas, extractors, crosswalks | Publishing: MDX, RSS, sitemap, JSON-LD, OG |
| 6–10 | `/graph` route, palette, mind map ids | VLM bench skeleton, pilots, pre-registration post |
| 10–16 | Open Data API, Zenodo `data-v1.0.0` | VLM full run, metrics, manifests |
| 14–20 | Unified SRS module, dermpath migration | VLM dashboard generalization, leaderboard |
| 20–24 | MCQ pipeline, adjudication route | `bench-v1.0.0`, DOIs, manuscript draft |
| 22–28 | MCQ player, bank to 300, launch | Planner schema, rules, two-reviewer gate |
| 26–32 | WSI sourcing, tiling, viewer | Planner UI, launch |
| 32–38 | WSI trainer, SRS cards, launch | Scorecard rubric, UI, launch |
| 38–42 | Slack: second benchmark seed, second graph pass | Retrospective devlog, vault capture |

## Decisions needed from the owner before week 2

1. Data license (recommend CC BY 4.0).
2. Cloudflare R2 (recommend yes) and a monthly ceiling.
3. VLM benchmark budget ceiling for v1 (plan assumes USD 2,000–5,000 in API spend plus GPU rental; pilot first).
4. Fellowship start date, to anchor the calendar.
5. Whether the two existing lectures may be listed on `/talks`.
6. Whether `dermatotarget-atlas` should be listed in the catalogue.
7. Whether the off-repo psoriasis bibliography and the JAAD per-trial CSV still exist (they change the cost of Workstream 0 item 4 and the framing of the benchmark page respectively).
8. IRB determination path at Hopkins for the benchmark.

## What this plan does not verify

- Current license terms of ISIC, HAM10000, DDI, and Fitzpatrick17k (must be read at build time).
- Whether GitHub Pages sends permissive CORS headers by default.
- Current API pricing for the frontier models in scope (the budget uses one historical data point).
- Availability and quality of public dermatopathology WSIs beyond TCGA-SKCM.
- The exact regulatory framing of the planner; a professional review is recommended before launch.
