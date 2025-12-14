# Dr. Ramie Fathy – Personal & Professional Portfolio

This repository powers [ramiefathy.github.io](https://ramiefathy.github.io) and its Netlify mirror. It combines:

- **Astro static site** (`/site`) for the primary pages and navigation
- **Interactive tools** (`/site/public/apps`) including the AI Dermatology Scribe, Dermatopathology Navigator, DermaScore calculators, and PDF utilities
- **AI Scribe backend** (`/services/ai-scribe`) for websocket-driven transcription and Gemini-powered note generation
- **Legacy archives** (`/legacy`) for historical research reports and prototypes

## Repository Layout

```
.
├── site/                     # Astro project
│   ├── public/               # Static assets + interactive apps
│   └── src/
│       ├── data/             # Structured content (profile, apps, research, legacy)
│       ├── layouts/          # Shared layouts
│       ├── pages/            # Astro routes (/, /about, /apps, /legacy)
│       └── styles/           # Global design system
├── services/
│   └── ai-scribe/            # Python websocket service for the AI Dermatology Scribe
├── legacy/                   # Archived analyses and prototypes
├── docs/                     # Additional documentation (to be expanded)
└── scripts/                  # Utility scripts (reserved)
```

## Prerequisites

- Node.js **20.x** (Astro build) – download a local copy if your global installation is newer/older.
- Python **3.11+** (for the AI Scribe backend) if you intend to run the websocket service locally.
- Google AdSense publisher ID `ca-pub-2958059905874922` (already configured). Individual ad slots are intentionally left blank—see [Ads Setup](#ads-setup) for instructions on obtaining IDs.

## Getting Started

### Install Dependencies

```bash
# (Optional) Fetch portable Node 20 and esbuild binary into /tmp if not already present
curl -L https://nodejs.org/dist/v20.17.0/node-v20.17.0-darwin-arm64.tar.gz -o /tmp/node20.tar.gz
mkdir -p /tmp/node20 && tar -xzf /tmp/node20.tar.gz -C /tmp/node20 --strip-components=1
mkdir -p /tmp/esbuild-0259 && curl -L https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.9.tgz | tar -xz -C /tmp/esbuild-0259

# Install static site dependencies (uses the portable binaries above)
PATH=/tmp/node20/bin:$PATH ESBUILD_BINARY_PATH=/tmp/esbuild-0259/package/bin/esbuild npm --prefix site install

# Install AI Scribe backend dependencies
pip install -r services/ai-scribe/requirements.txt
```

> **Note:** If `/tmp/node20` or `/tmp/esbuild-0259` are cleared, download them again following the commands in this README or switch to a native Node 20 environment before running `npm --prefix site install`.

### Local Development

```bash
# Start the Astro dev server on http://localhost:4321
npm run site:dev

# Build production assets
npm run site:build

# Preview the production build
npm run site:preview

# Run the AI Dermatology Scribe websocket server
cd services/ai-scribe
python app.py
```

In development, the RAMIE AI Scribe frontend reads its backend connection settings from browser storage:

- WebSocket URL: `dermascribe.websocketUrl`
- Access Token: `dermascribe.sessionToken` (session-scoped by default; persisted only if you check “Remember token” in the UI)

Open `/apps/dermatology-scribe/index.html` and use the **Backend Connection** card to set:

- WebSocket URL (e.g. `ws://localhost:8765` for local dev)
- Access Token (must match `SESSION_SECRET` in the backend `.env`, or be a JWT signed with `JWT_SIGNING_SECRET`)

Configure the AI Scribe service with environment variables in `services/ai-scribe/.env` (see `services/ai-scribe/.env.example`).

## Ads Setup

1. Sign in to [Google AdSense](https://adsense.google.com).
2. Navigate to **Ads > Overview > By ad unit** and create two ad units:
   - Responsive banner for the homepage hero (recommended size 970×90 / 728×90 fallback).
   - Rectangle/inline unit for the Applications section (recommended size 336×280 or responsive).
3. Copy each ad unit’s **Ad unit code** – the numeric value listed as `data-ad-slot`.
4. Update the placeholders in `site/src/pages/index.astro`:
   - Replace `REPLACE_WITH_TOP_BANNER_SLOT` with the banner slot ID.
   - Replace `REPLACE_WITH_INLINE_APPS_SLOT` with the inline rectangle slot ID.
5. Deploy the updated site. Once AdSense approves the new placements, ads will render automatically.

To temporarily disable ads without editing code, comment out or remove the `<ins class="adsbygoogle">` elements.

## Legacy Content

The `/legacy` route lists archived HTML reports and application prototypes. These files remain untouched to preserve historical context; please add disclaimers when sharing them externally.

## Reporting Issues & Contributing

1. Open an issue describing the change or bug.
2. Create a feature branch referencing the issue.
3. Run linting/tests (lint tasks forthcoming) before submitting a pull request.
4. Include screenshots or recording snippets for UI/UX updates.

## Roadmap Snippets

- Expand structured data sources (publications, leadership timeline) and render them via Astro components.
- Add automated lint/test/CI workflows for the Astro site and AI Scribe backend.
- Harden the AI Scribe client with authentication and rate limiting as the deployment plan evolves.

For any questions, contact **hello@ramiefathy.com**.

## Landing UI Upgrade

Files touched:

- `site/astro.config.mjs`, `site/package.json` – enabled the React integration and added UI dependencies.
- `site/src/styles/global.css`, `site/src/layouts/MainLayout.astro` – added premium typography tokens and font loading.
- `site/src/components/Header.jsx`, `site/src/components/Hero.jsx` – new interactive header and hero experiences.
- `site/src/pages/index.astro` – renders the new header/hero pair while preserving existing sections.

Libraries introduced:

- `@astrojs/react` to render React components inside Astro.
- `framer-motion` for the gooey login morph animation and subtle hero entrance.
- `@paper-design/shaders-react` for the layered mesh gradient background effect without hand-rolled shaders.

How to run:

```bash
PATH=/tmp/node20/bin:$PATH npm --prefix site install
npm run site:dev
```

Open [http://localhost:4321](http://localhost:4321) to preview the landing refinement.

Responsive notes: the hero keeps text anchored bottom-left on desktop, gracefully stacking content on tablets/phones. Keyboard focus states remain visible on header links and buttons with the gooey morph interaction honoring reduced-motion preferences.

## Future Enhancements

### Additional Functionality Ideas
- Patient-friendly education hub with downloadable aftercare PDFs and automated email summaries.
- Secure note export pipeline that pushes finalized AI scribe output directly into institutional EMRs via FHIR integration.
- Resident analytics dashboard aggregating usage metrics, note turnaround times, and quality indicators.

### Potential Application Expansions
- Dermoscopy pattern recognizer using de-identified sample images to triage lesions.
- Inflammatory disease tracker that pairs patient-reported outcomes with photography timelines.
- Procedural consent builder that assembles tailored, printable consent forms for common dermatologic surgeries.

### Ways to Increase Overall Impact
- Story-driven case studies with imagery and long-form articles similar to the Richard Mattka portfolio reference.
- Cinematic scrolling interactions highlighting the research pipelines powering each tool.
- Integrated testimonial/video section featuring collaborators and mentors discussing the technology in practice.
