# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal and professional portfolio website for Dr. Ramie Fathy, combining:
- **Astro static site** with React components for interactive UI
- **RAMIE (Realtime Articulate Medical Intelligence Explorer)** - Modern AI-powered dermatology assistant with dark navy UI
- **Interactive medical tools** including Dermatopathology Navigator and clinical calculators
- **Python websocket backend** for AI-powered transcription and note generation
- **Legacy archives** preserving historical research and prototypes

## Common Development Commands

### Site Development
```bash
# Install dependencies (requires Node 20.x)
npm --prefix site install

# Start development server (http://localhost:4321)
npm run site:dev

# Build production assets
npm run site:build

# Preview production build
npm run site:preview
```

### Canonical Test Surface Inventory (IMPORTANT)
The canonical list of user-facing pages/apps that must be covered by automated checks lives at:
- `docs/site-test-inventory.md`

Playwright specs under `site/tests/` parse this inventory to decide what to smoke-test. **Update it** whenever you add/remove/rename routes under `site/src/pages/**`, add/remove shipped legacy HTML apps under `site/public/apps/**`, or change canonical external app URLs (e.g., Clinisched, Skinoculars).

### RAMIE/AI Scribe Backend
```bash
# Install Python dependencies
pip install -r services/ai-scribe/requirements.txt

# Run websocket server
cd services/ai-scribe
python app.py
```

## Architecture Overview

### Frontend Architecture
- **Astro Framework**: Static site generator with file-based routing in `site/src/pages/`
- **React Integration**: Interactive components using Framer Motion for animations and @paper-design/shaders-react for visual effects
- **Data Organization**: Structured content in `site/src/data/` for publications, apps metadata, and research
- **Interactive Apps**:
  - Most apps are shipped as static assets in `site/public/apps/` and linked from the app catalog in `site/src/data/apps.json`.
  - Some apps are intentionally hosted externally (subdomain + separate repo). Example:
    - **Skinoculars** is hosted at `https://skinoculars.ramiefathy.com/` and should remain listed in `site/src/data/apps.json`.

### Backend Architecture
- **WebSocket Service**: Python-based real-time transcription service in `services/ai-scribe/`
- **Gemini Integration**: AI-powered note generation using Google's Gemini API
- **Session Management**: Token-based authentication with configurable session secrets

### Key Integration Points
- RAMIE client connects to WebSocket backend using session tokens stored in localStorage
- Static apps are embedded via iframe or linked directly from the main Astro site
- Google AdSense integration with publisher ID `ca-pub-2958059905874922`

## CI/CD Workflow
- **GitHub Actions**: Automated builds on push/PR to master branch
- **Build Check**: Astro site build verification with Node.js 20
- **Python Lint**: Syntax validation for AI Scribe backend code

## Repository Organization

### Directory Structure
```
ramiefathy.github.io/
├── site/                    # Astro frontend (Node.js 20)
│   ├── src/                 # Astro components and pages
│   ├── public/apps/         # Interactive medical applications
│   └── tests/               # Unit and E2E tests
├── services/                # Backend services
│   └── ai-scribe/          # Python WebSocket service for RAMIE
├── functions-backend/       # Firebase Cloud Functions (Node.js 20)
│   ├── src/                # Modular function code (future)
│   ├── test/               # Backend tests
│   └── scripts/            # Maintenance utilities
├── docs/                    # Active documentation
│   ├── archived/           # Historical plans and completed specs
│   └── INDEX.md            # Documentation catalog
├── legacy/                  # Archived historical content (see README)
└── scripts/                # Build and migration scripts
```

### Dependency Management

**Root `/package.json`:**
- Babel (for clinic scheduler JSX compilation)
- Firebase client SDK (for browser apps)
- Scripts that orchestrate subdirectories

**Site `/site/package.json`:**
- Astro + React ecosystem
- All testing tools (Playwright, Vitest, Testing Library)
- Firebase emulator tools
- Coverage reporting

**Functions `/functions-backend/package.json`:**
- Firebase Admin SDK (server-side)
- Google Cloud services (Vertex AI, Firestore)
- Backend testing tools (Mocha, Sinon)

**AI Scribe `/services/ai-scribe/requirements.txt`:**
- Python WebSocket libraries
- Google Generative AI (Gemini)
- Python dotenv

### Build Artifacts (.gitignore)
The following are generated files and should NOT be committed:
- `_astro/` - Astro build output
- `*.map`, `*.js.map` - Source maps
- `**/test_*.js`, `**/test*.png` - Test artifacts
- `node_modules/` - Dependencies
- `.env` - Environment secrets

## Development Notes
- Portable Node.js 20 binaries can be used from `/tmp/node20` if system Node version differs
- RAMIE requires `.env` configuration in `services/ai-scribe/` with `SESSION_SECRET` and Gemini API credentials
- **IMPORTANT:** `SESSION_SECRET` is now required; service will fail to start without it
- Ad unit slots in `site/src/pages/index.astro` need replacement with actual AdSense unit IDs
- Legacy content archived to [GitHub Release v1.0.0-legacy](https://github.com/ramiefathy/ramiefathy.github.io/releases/tag/v1.0.0-legacy) (15 MB)
- Build artifacts (*.map, _astro/, test PNGs) are gitignored and should not be committed
- Dependency version conflicts have been resolved as of Sept 29, 2025 (see `/docs/dependency-audit-2025-09-29.md`)

## Recent Updates

### September 29, 2025 - Repository Modernization
- **Cleanup:** Removed 17 MB of build artifacts, test files, and legacy content
- **Consolidation:** Eliminated dependency conflicts across package.json files
- **Documentation:** Reorganized with active/archived structure
- **Apps Migration:** Consolidated clinic-scheduler-pro to single source in `site/public/apps/`

### January 18, 2025 - RAMIE Launch
- **RAMIE Launch**: AI Dermatology Scribe rebranded as RAMIE with modern dark navy UI
- **UI/UX Enhancements**: Added command palette, focus mode, accessibility features, and export options
- **Production Deployment**: Modern RAMIE interface is now the default at `/apps/dermatology-scribe/`

## Documentation Standards

### Active Documentation
- **Location:** `/docs` (root level)
- **Purpose:** Operational runbooks, release procedures, current implementation status
- **Lifecycle:** Keep up-to-date with each release
- **Index:** See `/docs/INDEX.md` for complete catalog

### Archived Documentation
- **Location:** `/docs/archived`
- **Purpose:** Historical implementation plans, completed feature specs
- **Lifecycle:** Move here when feature is complete or superseded
- **Index:** See `/docs/archived/README.md` for status and timeline

### Application Documentation
- **In-repo apps:** documentation lives alongside the app under `site/public/apps/{app-name}/`.
- **External apps (subdomains):** documentation lives in the external repo, with integration notes in `docs/`.
- **Examples:**
  - `docs/skinoculars-subdomain.md` - Skinoculars canonical URL + redirects
  - `docs/clinisched-subdomain.md` - Clinisched canonical URL + redirects
  - `site/public/apps/dermatopathology-modern/PROJECT-HANDOFF-DOCUMENT.md` - Dermatopathology Navigator handoff

### When to Create Documentation
- **DO create:** Operational runbooks, release checklists, handoff documents
- **DO create:** App-specific READMEs for complex applications
- **DO create:** Architecture decision records (ADRs) for major changes
- **DON'T create:** Implementation plans unless explicitly requested
- **DON'T create:** Duplicate documentation - link to canonical source instead

## Clinisched (Clinic Scheduler)

Clinisched is hosted as a standalone app on its own subdomain and intentionally does **not** live in this repository.

- Canonical URL: `https://clinisched.ramiefathy.com/`
- Source/deploy repo: `ramiefathy/clinisched` (private)
- Main-site listing: `site/src/data/apps.json` (slug `scheduler-pro`) must point to the canonical URL
- Regression guard: `site/tests/clinic-scheduler-pro.spec.ts` ensures the link stays correct

Development happens in the Clinisched repo:

```bash
# Frontend
npm install
npm run dev
npm run build
npm run preview

# Backend
npm install --prefix functions-backend
npm test --prefix functions-backend
```

See `docs/clinisched-subdomain.md` for Cloudflare redirect rules and integration notes.
