# Dead Code & Duplication Report

## `/apps` legacy tree (duplicate of `site/public/apps`)
- **Evidence:** Migration doc flags remaining directories; duplicate analysis shows 42 identical file groups. citeapps/README.md:7-88audit/duplicate-report.txt:1-78scripts/migrate-apps-to-site.sh:42-170
- **Status:** Safe to delete once `diff -rq apps site/public/apps` returns no differences.
- **Action:** Complete migration script, remove `/apps` from git, update documentation.

## Dermatopathology dataset duplicates
- **Evidence:** Both deduplicated and raw datasets ship in production (`dermatopathology-differentials-data*.js`). citesite/public/apps/dermatopathology-modern/dermatopathology-differentials-data-deduplicated.js:1-120site/public/apps/dermatopathology-differentials-data.js:1-120
- **Status:** Keep a single canonical dataset; regenerate derived files during build.
- **Action:** Move dataset into Astro data module and export variants programmatically.

## Legacy Scheduler HTML variants
- **Evidence:** Multiple static scheduler pages (`Scheduler.html`, `clinic-scheduler-modern/index.html`) coexist with Clinic Scheduler Pro. citesite/public/apps/Scheduler.html:1-200site/public/apps/clinic-scheduler-modern/index.html:1-200
- **Status:** If no longer linked from Astro site, archive or remove after confirming analytics.
- **Action:** Publish curated legacy showcase page and delete redundant HTML.

## Generated bundles committed to VCS
- **Evidence:** `site/public/apps/clinic-scheduler-pro/assets/main.js` and `assets/lib/` are build outputs from Babel script. citepackage.json:21-28site/public/apps/clinic-scheduler-pro/assets/main.js:1-120
- **Status:** Should be build artifacts, not source; commit history bloats when rebuilding.
- **Action:** Move generated assets to build step (Astro `public/` output) and add to `.gitignore`.

## Legacy mind map trees under `/apps/*MindMaps`
- **Evidence:** Migration notes indicate content moved into `site/public/apps/mindmaps/`. citeapps/README.md:20-55site/src/data/mindmaps/alopecia/manifest.json:1-40
- **Status:** Once parity verified, delete `AlopeciaMindMaps/`, `CTCLMindMaps/`, etc.
- **Action:** Run side-by-side diff, port missing nodes, remove old folders.

## Deprecated documentation duplicates
- **Evidence:** `site/public/apps/dermatopathology-modern/data-deduplication-plan.md` duplicates docs in `/apps`. citeapps/dermatopathology-modern/PROJECT-STATUS.md:1-120site/public/apps/dermatopathology-modern/PROJECT-STATUS.md:1-120
- **Status:** Retain a single authoritative docs directory (prefer `site/public/apps/`).
- **Action:** Delete `/apps/...` copies post-migration.

Removing these artifacts will shrink the repository, reduce confusion, and simplify onboarding.
