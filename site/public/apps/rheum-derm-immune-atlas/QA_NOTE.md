# Rheum–Derm Immune Atlas release QA

Date: 2026-07-13
Route: `/apps/rheum-derm-immune-atlas/`

## Disposition

Approved for the repository's GitHub-to-production release workflow.

## Evidence

- Focused Playwright test: 2 passed.
- Full site unit/policy suite: 212 passed.
- Full Playwright suite: 159 tests completed without failure; opt-in screenshot tests remained skipped by configuration.
- Production Astro build: passed; 27 routes generated.
- JavaScript syntax check: passed.
- Heading/landmark check: passed.
- Anti-slop blocklist: 0 errors, 21 advisory radius warnings.
- Contrast-engine unit tests: 10 passed.
- Canonical inventory updated and inventory-driven route test passed.
- Built atlas artifact is byte-identical to the tested `site/public` source.

## Residual risk

- The app retains its existing rounded-panel visual language, producing 21 advisory anti-slop warnings. Hard-blocked palette, font, blur, metadata, and gradient issues were removed in the deployed copy.
- The atlas is an educational evidence synthesis, not medical advice. Its embedded methods and limitations remain visible in the app.
- Canonical `origin/master` currently installs with eight dependency audit findings. This change does not modify dependencies.
