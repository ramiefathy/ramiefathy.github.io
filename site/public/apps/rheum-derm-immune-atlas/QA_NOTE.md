# Rheum–Derm Immune Atlas release QA

Date: 2026-07-13
Route: `/apps/rheum-derm-immune-atlas/`

## Disposition

Approved for the repository's GitHub-to-production release workflow after the clinical-editorial dark-mode refinement.

## Evidence

- Focused Playwright tests: 3 passed, including the dark/light token and no-gradient/no-panel-shadow contract at 390 × 844.
- Full site unit/policy suite: 212 passed.
- Full Playwright suite: 139 passed and 21 opt-in screenshot tests skipped by configuration; no failures across 160 collected tests.
- Production Astro build: passed; 27 routes generated.
- JavaScript syntax check: passed.
- Heading/landmark check: passed.
- Anti-slop blocklist: 0 errors and 0 warnings.
- Dark primary and secondary text achieve 16.36:1 and 9.71:1 contrast against the page field; accent and link colors exceed 8:1. UI borders exceed 3:1.
- Light-theme text, accent, link and button pairs meet WCAG AA; primary light-theme text achieves 13.81:1.
- Okabe–Ito-derived dark accents were checked under protanopia and deuteranopia transforms. Status, grade and network encodings also retain text, letters, line patterns or node shapes, so hue is not the sole channel.
- Reduced-motion behavior collapses animation and transition durations while preserving interaction state.
- Contrast-engine unit tests: 10 passed.
- Canonical inventory updated and inventory-driven route test passed.
- Built atlas artifact is byte-identical to the tested `site/public` source (`1f7fc8cd3f1618bb1b3e55ca615d98cfc81d3a315114ea4ba036cb2439fc8e9e`).

## Residual risk

- The atlas remains a large self-contained HTML application. The refinement deliberately leaves its dense scientific data visualizations and embedded source payload intact.
- The atlas is an educational evidence synthesis, not medical advice. Its embedded methods and limitations remain visible in the app.
- Canonical `origin/master` currently installs with eight dependency audit findings. This change does not modify dependencies.
