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
- **Location:** Within app directory (`/site/public/apps/{app-name}/`)
- **Purpose:** App-specific setup, usage, and technical details
- **Examples:**
  - `clinic-scheduler-pro/README.md` - User guide and setup
  - `clinic-scheduler-pro/firebase-setup.md` - Firebase configuration
  - `dermatopathology-modern/PROJECT-HANDOFF-DOCUMENT.md` - Technical handoff

### When to Create Documentation
- **DO create:** Operational runbooks, release checklists, handoff documents
- **DO create:** App-specific READMEs for complex applications
- **DO create:** Architecture decision records (ADRs) for major changes
- **DON'T create:** Implementation plans unless explicitly requested
- **DON'T create:** Duplicate documentation - link to canonical source instead

## Clinic Scheduler Pro

### Overview
**Clinic Scheduler Pro** is a Firebase-powered clinical scheduling application located in `/site/public/apps/clinic-scheduler-pro/`. It's a React-based single-page application with real-time data synchronization for managing medical institution schedules, attendings, residents, and assignments.

### Development Commands
```bash
# Build the React bundle after editing source files
npm run clinic:scheduler:build

# Serve locally for testing
cd site/public/apps/clinic-scheduler-pro && python -m http.server 8000
```

### Architecture
- **Frontend**: Standalone React SPA using CDN-loaded dependencies (React 18, Tailwind CSS, Framer Motion, Lucide icons)
- **Source Files**: React JSX components in `site/public/apps/clinic-scheduler-pro/src/main.jsx` and `src/main-animated.jsx`
- **Build Process**: Babel transpilation to browser-compatible JS bundles in `assets/` (in-place, no duplication)
- **Single Source of Truth**: All source and built files in `site/public/apps/clinic-scheduler-pro/`
- **Firebase Services**:
  - **Authentication**: Email/password authentication with persistent sessions
  - **Firestore Database**: Real-time data sync for institutions, members, attendings, residents, assignments
  - **Security Rules**: Role-based access control (admin, scheduler, member) defined in root `firestore.rules`
  - **Cloud Functions**: Backend logic in `/functions-backend/` (Node.js 20)

### Key Features
- Multi-tenant institution management with role-based permissions
- Real-time schedule updates with drag-and-drop interface
- Audit logging for all data modifications
- Offline persistence with automatic sync when reconnected
- Protected time slots and continuity clinic management
- Natural language chatbot for scheduling (Gemini-powered)

### Firebase Configuration
- Firebase config is embedded in `index.html` for the `autoclinicscheduler` project
- Requires enabling Authentication (Email/Password), Firestore, and Cloud Functions in Firebase Console
- Security rules must be deployed from root `firestore.rules` for proper access control
- Cloud Functions deployed from `/functions-backend/` directory
