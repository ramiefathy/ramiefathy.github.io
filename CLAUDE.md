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
- **Interactive Apps**: Standalone HTML/JS applications in `site/public/apps/` loaded as static assets

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

## Development Notes
- Portable Node.js 20 binaries can be used from `/tmp/node20` if system Node version differs
- RAMIE requires `.env` configuration in `services/ai-scribe/` with Gemini API credentials
- Ad unit slots in `site/src/pages/index.astro` need replacement with actual AdSense unit IDs
- Legacy content in `/legacy` is preserved as-is for historical reference

## Recent Updates (January 18, 2025)
- **RAMIE Launch**: AI Dermatology Scribe rebranded as RAMIE with modern dark navy UI
- **UI/UX Enhancements**: Added command palette, focus mode, accessibility features, and export options
- **Production Deployment**: Modern RAMIE interface is now the default at `/apps/dermatology-scribe/`