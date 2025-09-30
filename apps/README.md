# /apps Directory - Migration Status

**Status:** Partial migration complete (Sept 29, 2025)

## Overview

This directory contains application sources that are being gradually migrated to `/site/public/apps/` to eliminate duplication and establish a single source of truth.

## Migration Status

### ✅ Completed

- **clinic-scheduler-pro** - Fully migrated to `/site/public/apps/clinic-scheduler-pro/`
  - Build script updated to compile directly in place
  - Source files consolidated
  - Savings: 1.3 MB

### 🚧 Pending Migration

The following directories have different organizational structures between `/apps` and `/site/public/apps/MindMaps` and require careful migration:

| Directory | Size | Status | Notes |
|-----------|------|--------|-------|
| AlopeciaMindMaps/ | Small | Needs merge | Corresponds to /site/public/apps/MindMaps/Alopecia/ |
| AutoimmuneBullousMindMaps/ | 40 KB | Needs merge | Corresponds to /site/public/apps/MindMaps/AutoimmuneBullous/ (partial) |
| CTCLMindMaps/ | 776 KB | Needs merge | Different structure, has additional HTML files |
| PruritusMindMaps/ | Medium | Needs merge | Different structure |
| PsoriasisMindMaps/ | Small | Needs merge | Corresponds to /site/public/apps/MindMaps/Psoriasis/ (partial) |

### Other Files

- `index.html` - Apps landing page (differs from site/public/apps/index.html)
- `shared/` - Shared assets directory
- `package.json` - Playwright dependencies (being moved to site/package.json)
- Static HTML files - Various utility pages

## Migration Strategy for Mind Maps

The mind maps require special handling because:

1. **Different Organization:**
   - `/apps`: Separate root folders (AlopeciaMindMaps/, CTCLMindMaps/, etc.)
   - `/site/public/apps`: Consolidated under MindMaps/ subdirectory

2. **Content Differences:**
   - Some maps exist only in /apps
   - Some exist only in /site/public/apps/MindMaps
   - Content may have diverged

3. **Recommended Approach:**
   - Manual comparison of each mind map
   - Merge content to /site/public/apps/MindMaps/
   - Verify all functionality preserved
   - Update any internal links
   - Remove /apps versions after verification

## Current Build Process

### Clinic Scheduler Pro (Migrated)

```bash
# Source: site/public/apps/clinic-scheduler-pro/src/
# Build: site/public/apps/clinic-scheduler-pro/assets/
npm run clinic:scheduler:build
```

### Mind Maps (Not Yet Migrated)

Currently served from both locations. After migration, all will be served from:
- `/site/public/apps/MindMaps/{condition}/`

## TODO

- [ ] Compare and merge mind map content
- [ ] Update internal links after migration
- [ ] Remove /apps mind map directories
- [ ] Migrate remaining static HTML files
- [ ] Remove /apps directory entirely
- [ ] Update documentation to reference only site/public/apps

## Space Savings Potential

Completing this migration will save approximately:
- Mind Maps: ~1.5 MB additional duplication
- Static assets: ~200 KB
- Total remaining: ~1.7 MB

**Already saved:** 1.3 MB (clinic-scheduler-pro)

## References

- Migration script: `/scripts/migrate-apps-to-site.sh`
- Build configuration: `/package.json`
- Production apps location: `/site/public/apps/`

---

**Last Updated:** September 29, 2025
**Migration Owner:** Repository maintainer