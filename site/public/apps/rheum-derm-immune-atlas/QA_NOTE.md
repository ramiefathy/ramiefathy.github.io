# Rheum–Derm Immune Atlas release QA

Date: 2026-07-13
Route: `/apps/rheum-derm-immune-atlas/`

## Disposition

Approved for the repository's stacked review workflow after the version 4.2 comparator and cohort-ledger layer. The relational contract now drives five pairwise presets and a complete 18-condition ledger while preserving explicit denominators, direct/derived provenance and the closed five-state resolver.

## Evidence

- Focused Playwright tests: 8 passed, including the ten-route JAK–STAT wiring contract, two-inhibitor target model, five-preset orthographic comparator, complete cohort ledger, narrow-screen local-overflow contract, antibody matrix, 18-condition subtype inventory, theme contract, and version 5 relational-contract closure.
- Full site unit/policy suite: 212 passed.
- Full Playwright suite: 141 passed and 21 opt-in screenshot tests skipped by configuration; no failures across 162 collected tests.
- Production Astro build: passed; 27 routes generated.
- JavaScript syntax check: passed.
- Heading/landmark check: passed.
- Anti-slop blocklist: 0 errors and 0 warnings.
- Dark primary text achieves 16.36:1 against the page field; secondary and faint text achieve 8.87:1 and 5.84:1 against panels; ochre and blue accents achieve 7.59:1 and 7.41:1. All tested pairs meet WCAG AA.
- Light-theme primary, secondary, faint, accent and link pairs achieve 15.60:1, 6.95:1, 4.99:1, 5.38:1 and 5.57:1 respectively. All tested pairs meet WCAG AA.
- A grayscale visual pass preserved separate circle, diamond, square and dashed-circle encodings for present, mapped-no-effect, filtered and unmapped cells. Antibody association direction also retains arrow, border and dash encodings, so hue is not the sole channel.
- Custom browser checks at 390 × 844 and 1440 × 1000 found zero runtime errors and zero body overflow. All ten receptor routes retained four labeled stages, all 18 subtype modules were non-empty, and new controls were keyboard-operable.
- The orthographic comparator completed 100 redraws in 20.7–21.2 ms locally in headless Chromium.
- Reduced-motion behavior collapses animation and transition durations while preserving interaction state.
- Contrast-engine unit tests: 10 passed.
- Canonical inventory already covered the route; the inventory-driven route test passed.
- The preceding version 4 built artifact was byte-identical to its tested `site/public` source (`630ac6acaf2872ba44eb418e21a7f27b28c7b006a6a39b304b7f265202daa881`). The version 4.1 production build is byte-identical to source at SHA-256 `03726743ee8de86249ff7411f330a1ab750e23d31edd6feb102fa326447a7703`; version 4.2 is byte-identical at `550fdaafe3e4cfb1150296b6353968f9ecacb683d0b47be6b6c714b1f62830b5`.
- Version 4 golden baseline before the relational changes: production/source SHA-256 `630ac6acaf2872ba44eb418e21a7f27b28c7b006a6a39b304b7f265202daa881`; 5 focused Playwright tests passed.
- Version 4.1 relational raw-row audit: 18 condition, 27 canonical pathway, 49 medication and 124 normalized feature entities; 736 normalized relationship rows across condition–pathway, condition–feature, condition–medication, medication–feature and medication–pathway strata. Contract validation reports zero errors.
- The five resolver outcomes were exercised directly: direct, explicit zero, filtered, unknown and derived. Missing rows remain unknown; explicit zero requires a source row; derived rows retain an intermediate-path record.
- Version 4.2 exposes five pairwise presets: condition × pathway, condition × treatment, condition × feature, treatment × pathway and treatment × feature. Treatment × feature requires an explicit condition context.
- The cohort ledger renders the frozen 18-condition order against all 27 pathways, 49 treatments or 124 normalized features. Browser assertions verify 486, 882 and 2,232 visible coordinates respectively; none are silently dropped.
- At 390 × 844, inactive slabs collapse to face-on tabs, the document width remains within the viewport and the active ledger scrolls locally.

## Residual risk

- The atlas remains a large self-contained HTML application. The expansion deliberately keeps the dense visualizations and evidence payload local rather than adding runtime dependencies.
- Combination coverage reports declared molecular target intersection only. It does not model dose, tissue exposure, pharmacodynamics, efficacy, synergy, antagonism or safety.
- “Outside declared target model” is not evidence of biological absence; unmapped, filtered and mapped-zero states remain separate in the interface.
- Antibody marks summarize cohort-level enrichment and can vary by assay platform, population and ascertainment. The assay caveat and source links remain visible beside the matrix.
- Subtype labels are overlapping organizational phenotypes, not a validated classification instrument.
- The cohort ledger is intentionally dense and uses local horizontal scrolling. It is an inventory/overlap surface, not a ranking model; cell magnitude reflects the embedded relation strength only.
- Feature-level links reuse already embedded condition/effect source trails and do not add new efficacy claims. The relation export is a normalized projection of the existing evidence payload, not an independent systematic review.
- Canonical `origin/master` currently installs with eight dependency audit findings. This change does not modify dependencies.
