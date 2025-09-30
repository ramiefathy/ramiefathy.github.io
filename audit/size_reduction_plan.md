# Size & Complexity Reduction Plan

## Impact × Effort Matrix
| # | Initiative | Impact | Effort | Est. Savings | Evidence |
|---|------------|--------|--------|--------------|----------|
| 1 | Remove legacy `/apps` directory after migration | High | Small | ~1.7 MB git history, 42 duplicate trees | citeapps/README.md:13-88audit/duplicate-report.txt:1-78scripts/migrate-apps-to-site.sh:42-170 |
| 2 | Bundle Clinic Scheduler Pro via Vite + shared components | High | Medium | Reduce 7.5k LOC runtime bundle, ~500 KB gzipped | citesite/public/apps/clinic-scheduler-pro/src/main.jsx:1-200package.json:21-28 |
| 3 | Consolidate dermatopathology datasets into single JSON | Medium | Medium | Drop duplicate 4.4k-line file, ~300 KB per deploy | citesite/public/apps/dermatopathology-modern/dermatopathology-differentials-data-deduplicated.js:1-120site/public/apps/dermatopathology-differentials-data.js:1-120 |
| 4 | Remove CDN fonts / inline Tailwind and serve locally | Medium | Small | Cut 2 CDN requests, avoid runtime blocking | citesite/public/apps/clinic-scheduler-pro/index.html:8-73 |
| 5 | Enable npm cache + dependency pruning in CI | Medium | Small | ~40-60% faster builds, smaller Actions usage | cite.github/workflows/ci.yml:20-35 |
| 6 | Split mind map app into feature modules with lazy imports | Medium | Medium | Reduce initial bundle >200 KB, easier testing | citesite/src/apps/mindmaps/MindMapApp.tsx:1-200 |
| 7 | Archive redundant scheduler HTML variants | Medium | Small | Remove >2.3k LOC static pages | citesite/public/apps/clinic-scheduler-modern/index.html:1-200site/public/apps/Scheduler.html:1-200 |

## Phased Rollout
1. **Stage 1 – Repository Hygiene (Week 1)**
   - Execute migration script, remove `/apps`, add git hook preventing new files there.
   - Delete redundant dermatopathology data copies after validating Astro consumes canonical JSON.
   - Update `.gitignore` to exclude build artifacts (scheduler `assets/`).
2. **Stage 2 – Bundling & Toolchain (Weeks 2-3)**
   - Scaffold Vite config for Clinic Scheduler Pro; reuse Astro's Vite pipeline.
   - Refactor mind map app into modules, adding lazy imports for export-heavy features (PDF, PNG).
3. **Stage 3 – CI & Delivery (Week 3)**
   - Add npm cache (`cache: 'npm'`) and `npm ci --prefer-offline` to workflows; run bundler builds.
   - Insert Playwright smoke for scheduler and mind map to guard refactors.
4. **Stage 4 – Follow-up (Week 4+)**
   - Replace CDN fonts with local assets; update CSP and preloads.
   - Monitor bundle size via Lighthouse/Vite analyzer; set thresholds in CI.

## Quick Win Snippets
- **Git clean-up:** `diff -rq apps site/public/apps || git rm -r apps` (after manual review). citescripts/migrate-apps-to-site.sh:63-123
- **CI cache addition:**
  ```yaml
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
      cache-dependency-path: site/package-lock.json
  ```
  cite.github/workflows/ci.yml:16-31
- **Astro data refactor:** move dataset into `site/src/data/mindmaps/` and import via `await Astro.glob`. citesite/src/data/mindmaps/alopecia/manifest.json:1-40

Executing this plan reduces repo size, improves cold-start time, and positions the project for more maintainable feature work.
