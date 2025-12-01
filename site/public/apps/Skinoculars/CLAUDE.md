# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skinoculars is an interactive, procedurally generated skin anatomy visualization built with React and Three.js. It renders a 3D cross-section of human skin with explorable layers (epidermis, dermis, hypodermis) and anatomical structures (hair follicles, sweat glands, blood vessels, collagen).

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
```

Requires `GEMINI_API_KEY` in `.env.local` for AI explanation features.

## Architecture

### Entry Points
- `index.html` - HTML shell with Tailwind CDN and import maps for Three.js/React
- `index.tsx` - React root mount
- `App.tsx` - Main application state and UI layout

### Core Components (`/components`)
- `SkinScene.tsx` - Three.js scene with procedural anatomy generation, raycasting for structure selection, OrbitControls, clipping planes, and camera animation
- `Controls.tsx` - Layer/structure visibility toggles, explode slider, slice view controls
- `InfoPanel.tsx` - Selected structure details with localized content and AI explanation placeholder

### Data Modules (root)
- `types.ts` - TypeScript types for layers, diseases, timelines, zoom levels, and localized strings
- `constants.ts` - `STRUCTURE_CONTENT` mapping structure IDs to educational content
- `diseaseProfiles.ts` - Disease presets (psoriasis, eczema, photoaging) with parameter overrides
- `zoomLevels.ts` - Camera poses for macro/meso/micro zoom levels
- `tours.ts` - Guided tour definitions with camera waypoints and narratives
- `quiz.ts` - Quiz questions targeting specific structures
- `timelines.ts` - Process animations (e.g., wound healing)

### Key Patterns

**Procedural Anatomy**: `SkinScene` uses `buildAnatomy(params)` to generate geometry based on `ModelParameters`. Disease profiles modify these parameters via `computeParameters(diseaseId)`.

**State Flow**: App.tsx holds all UI state (visibility, explode, disease, timeline, tour, quiz). SkinScene receives props and applies them via useEffect hooks.

**Raycasting**: Click/hover detection in SkinScene uses `userData.type` or `userData.parentType` on meshes to identify structures.

**Localization**: Content supports `LocalizedString` (plain string or `{en, es, ar}` object). Use `getLocalizedString(value, lang)` helper.

**Clipping Plane**: A horizontal THREE.Plane clips all materials when slice view is enabled, controlled by `clippingNormalized` prop.

## Tech Stack
- React 19, TypeScript, Vite
- Three.js with OrbitControls (via import maps in production, npm in dev)
- Tailwind CSS (CDN in index.html)
