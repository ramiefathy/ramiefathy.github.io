# Dependency Audit & Consolidation Report

**Date:** September 29, 2025
**Status:** ✅ Completed
**Impact:** Resolved all version conflicts, established clear ownership

## Executive Summary

Consolidated dependencies across three package.json files, eliminating version conflicts and establishing clear ownership boundaries.

### Key Changes

- **Root package.json:** Simplified to build tools only (Babel for clinic scheduler)
- **site/package.json:** Owns all testing infrastructure (Playwright, Vitest, Testing Library)
- **functions-backend/package.json:** Owns all backend dependencies (Firebase Admin, Vertex AI)
- **apps/package.json:** Removed (consolidated into site)

## Before & After

### Root `/package.json`

**Before:**
- 14 devDependencies (testing tools, firebase-admin, firebase-tools, vitest, etc.)
- 2 dependencies (@google-cloud/vertexai, firebase client)

**After:**
- 3 devDependencies (Babel tools only)
- 1 dependency (firebase client SDK)
- **Removed:** 11 conflicting/misplaced dependencies

**Rationale:** Root should only contain tools needed for cross-cutting builds (Babel for clinic scheduler). Testing and backend tools belong in subdirectories.

### Site `/site/package.json`

**Before:**
- Had testing libraries but older versions
- Missing firebase-tools for emulator support
- Missing coverage tools

**After:**
- All testing tools with latest versions
- Added firebase-tools for emulator integration
- Added @vitest/coverage-v8

**Changes:**
```diff
+ "@vitest/coverage-v8": "^2.1.5"
+ "firebase-tools": "^13.8.0"
```

### Functions `/functions-backend/package.json`

**Before:**
- @google-cloud/vertexai: 1.5.0
- firebase-admin: 13.5.0

**After:**
- @google-cloud/vertexai: 1.10.0 (aligned)
- firebase-admin: 13.5.0 (kept)

**Changes:**
```diff
- "@google-cloud/vertexai": "^1.5.0"
+ "@google-cloud/vertexai": "^1.10.0"
```

### Apps `/apps/package.json`

**Status:** Removed entirely

**Rationale:** Only contained playwright for mind map tests. Playwright moved to site/package.json where all tests will live.

## Version Conflicts Resolved

| Package | Root (Before) | Site (Before) | Functions (Before) | Resolution |
|---------|---------------|---------------|-------------------|------------|
| @playwright/test | 1.46.1 | 1.49.1 | - | ✅ Use latest in site only |
| @testing-library/jest-dom | 6.4.2 | 6.6.3 | - | ✅ Use latest in site only |
| @testing-library/react | 14.2.1 | 16.0.1 | - | ✅ Use latest in site only |
| vitest | 1.6.0 | 2.1.5 | - | ✅ Use latest in site only |
| firebase-admin | 12.0.0 | - | 13.5.0 | ✅ Use functions version only |
| @google-cloud/vertexai | 1.10.0 | - | 1.5.0 | ✅ Aligned to 1.10.0 |
| firebase-tools | 13.8.0 | - | - | ✅ Moved to site |

## Dependency Ownership Model

### Root Package (`/package.json`)

**Purpose:** Shared build tools for cross-cutting tasks

**Dependencies:**
- `@babel/cli`, `@babel/core`, `@babel/preset-react` - For clinic scheduler JSX compilation
- `firebase` - Client SDK for browser apps (clinic scheduler auth/firestore)

**Scripts:**
- Build commands that orchestrate subdirectory scripts
- Cross-cutting utilities (serve, clinic:smoke, etc.)

### Site Package (`/site/package.json`)

**Purpose:** Frontend application and test infrastructure

**Dependencies:**
- Astro + React ecosystem
- UI libraries (d3, framer-motion, etc.)
- Testing tools (Playwright, Vitest, Testing Library)
- Firebase tools for emulator support

**Scripts:**
- Dev server, build, preview
- Unit tests, E2E tests
- Test coverage reports

### Functions Package (`/functions-backend/package.json`)

**Purpose:** Firebase Cloud Functions backend

**Dependencies:**
- Firebase Admin SDK (server-side)
- Google Cloud services (Vertex AI, Firestore)
- Backend utilities (SendGrid, nodemailer, PDFKit)
- Testing tools (Mocha, Sinon, Firebase Functions Test)

**Scripts:**
- Function deployment
- Emulator for backend testing
- Linting and testing

## Installation Instructions

After this update, install dependencies in each subdirectory:

```bash
# Install root dependencies (Babel only)
npm install

# Install site dependencies (Astro, React, testing tools)
npm --prefix site install

# Install functions dependencies (Firebase Admin, backend tools)
npm --prefix functions-backend install

# Install AI Scribe Python dependencies
pip install -r services/ai-scribe/requirements.txt
```

## Verification

Run the smoke test to verify all dependencies work:

```bash
npm run clinic:smoke
```

This will:
1. Run unit tests (placeholder for now)
2. Build clinic scheduler with Babel
3. Run functions backend tests
4. Verify functions code
5. Compile AI Scribe Python code

## Benefits Achieved

### ✅ No More Version Conflicts
- Single version of each testing library
- Clear ownership prevents future conflicts

### ✅ Faster Installs
- Fewer dependencies in root
- No duplicate installations

### ✅ Better Isolation
- Frontend tests can't accidentally import backend code
- Backend code doesn't depend on frontend libraries

### ✅ Clearer Intent
- Package.json files document their purpose
- New developers understand architecture immediately

## Migration Notes

If you have an existing node_modules:

```bash
# Clean all node_modules
rm -rf node_modules site/node_modules functions-backend/node_modules

# Reinstall with new dependency structure
npm install
npm --prefix site install
npm --prefix functions-backend install
```

## Future Considerations

### Monorepo Tools (Optional)

If the project grows further, consider:
- **pnpm workspaces** - Shared dependency deduplication
- **npm workspaces** - Native monorepo support
- **Lerna** - Multi-package management

For now, the current structure (independent package.json files) is appropriate for this project size.

### Dependency Updates

When updating dependencies:
- Update testing tools in `/site/package.json`
- Update backend tools in `/functions-backend/package.json`
- Update Babel tools in root `/package.json`
- Run `npm run clinic:smoke` to verify compatibility

## Appendix: Removed Dependencies

Documenting what was removed from root for future reference:

```json
{
  "removed_from_root": {
    "@playwright/test": "1.46.1",
    "@testing-library/jest-dom": "6.4.2",
    "@testing-library/react": "14.2.1",
    "firebase-admin": "12.0.0",
    "firebase-functions-test": "3.4.1",
    "firebase-tools": "13.8.0",
    "jsdom": "24.0.0",
    "live-server": "1.2.2",
    "turndown": "7.2.1",
    "vitest": "1.6.0",
    "esbuild-register": "3.5.0",
    "@google-cloud/vertexai": "1.10.0"
  },
  "moved_to": {
    "testing_tools": "site/package.json",
    "firebase_tools": "site/package.json (for emulators)",
    "backend_tools": "functions-backend/package.json"
  }
}
```

---

**Report Author:** Repository maintainer
**Review Status:** ✅ Completed
**Next Review:** When adding new dependencies