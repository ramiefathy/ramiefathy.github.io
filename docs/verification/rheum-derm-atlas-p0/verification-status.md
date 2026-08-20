# Rheum–Derm Atlas P0 verification status

**Result:** PASS

The exact source tree represented by the accompanying 15-file verified-source archive passed:

- the complete Vitest and repository policy suite;
- the production Astro build;
- focused P0 scientific-integrity, core explorer, graph interaction/contrast, alternative-view, desktop, and mobile Playwright suites;
- repository-wide CI, including the complete Chromium regression suite; and
- deterministic screenshot capture for default desktop, expanded desktop, and expanded mobile explorer states.

The dedicated workflow creates its source archive only after all focused gates pass. The manifest records exactly 15 allowlisted paths with byte sizes and SHA-256 digests. GitHub Actions are pinned to reviewed commit SHAs, checkout credentials are not persisted, and piped commands use fail-closed shell behavior where applicable.
