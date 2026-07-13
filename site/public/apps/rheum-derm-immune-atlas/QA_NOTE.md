# Rheum–Derm Immune Atlas release QA

Date: 2026-07-13
Route: `/apps/rheum-derm-immune-atlas/`

## Disposition

Approved for the repository's GitHub-to-production release workflow after the version 4 signal-coverage, overlap-comparison, antibody-association and subtype-map expansion.

## Evidence

- Focused Playwright tests: 5 passed, including the ten-route JAK–STAT wiring contract, two-inhibitor target model, four-state orthographic comparator, antibody matrix, 18-condition subtype inventory, and dark/light theme contract at 390 × 844.
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
- Built atlas artifact is byte-identical to the tested `site/public` source (`630ac6acaf2872ba44eb418e21a7f27b28c7b006a6a39b304b7f265202daa881`).

## Residual risk

- The atlas remains a large self-contained HTML application. The expansion deliberately keeps the dense visualizations and evidence payload local rather than adding runtime dependencies.
- Combination coverage reports declared molecular target intersection only. It does not model dose, tissue exposure, pharmacodynamics, efficacy, synergy, antagonism or safety.
- “Outside declared target model” is not evidence of biological absence; unmapped, filtered and mapped-zero states remain separate in the interface.
- Antibody marks summarize cohort-level enrichment and can vary by assay platform, population and ascertainment. The assay caveat and source links remain visible beside the matrix.
- Subtype labels are overlapping organizational phenotypes, not a validated classification instrument.
- Treatment–pathway and treatment–feature pair modes remain deferred until derived/inferred relationships receive a fifth visual state and an audited provenance contract.
- Canonical `origin/master` currently installs with eight dependency audit findings. This change does not modify dependencies.
