# Onboarding Brief

## What This Repo Contains
- **Astro marketing site** with React-enhanced sections (`site/`). citeREADME.md:10-25site/src/pages/index.astro:1-122
- **Interactive browser apps** served from `site/public/apps/` (mind maps, Clinic Scheduler Pro, PDF tools). citesite/src/pages/apps/index.astro:1-154site/public/apps/clinic-scheduler-pro/index.html:13-200
- **Firebase Cloud Functions backend** for scheduling automation and chatbot. citefunctions-backend/index.js:47-549
- **AI Dermatology Scribe websocket backend** (`services/ai-scribe/`). citeservices/ai-scribe/app.py:1-401

## Setup Checklist
1. **Install Node 20 + dependencies**
   ```bash
   npm --prefix site install
   ```
   citeREADME.md:34-66
2. **Install Python deps (AI Scribe)**
   ```bash
   pip install -r services/ai-scribe/requirements.txt
   ```
   citeservices/ai-scribe/README.md:5-12services/ai-scribe/requirements.txt:1-3
3. **Configure environment**
   - `services/ai-scribe/.env`: `SESSION_SECRET`, Gemini keys, allowed origins. citeservices/ai-scribe/config.py:17-34
   - Firebase Functions: set `sendgrid.key`, SMTP creds via `firebase functions:config:set` before deploy. citefunctions-backend/src/config/email.js:10-57

## Daily Commands
| Task | Command |
|------|---------|
| Run Astro dev server | `npm run site:dev` citesite/package.json:5-14 |
| Build static site | `npm run site:build` (required before deploy) citesite/package.json:5-14 |
| Preview production build | `npm run site:preview` citesite/package.json:5-14 |
| Compile Clinic Scheduler bundle | `npm run clinic:scheduler:build` citepackage.json:21-28 |
| Start AI Scribe websocket | `python services/ai-scribe/app.py` citeservices/ai-scribe/README.md:5-34 |
| Run Firebase Functions locally | `npm --prefix functions-backend run serve` (emulators) citefunctions-backend/package.json:9-16 |

## Testing (current state)
- Playwright mind map check: `npm run site:test:e2e` (requires Playwright install). citesite/package.json:5-13site/tests/mindmap.spec.ts:5-40
- Functions Mocha tests (placeholder): `npm --prefix functions-backend test`. citefunctions-backend/package.json:9-16functions-backend/test/index.test.js:45-199
- Python: no automated tests yet—manual run recommended after changes.

## Deployment Pipeline
- GitHub Actions `CI` workflow builds Astro site and runs Python bytecode compile; add npm cache + tests per roadmap. cite.github/workflows/ci.yml:20-49
- GitHub Pages workflow builds `site/dist` and deploys to `master`. cite.github/workflows/pages.yml:22-45

## Directory Tour
- `site/src/components/` – shared UI (Hero, Header). citesite/src/components/Hero.jsx:1-200
- `site/src/apps/` – React mind map source with TypeScript and D3. citesite/src/apps/mindmaps/MindMapApp.tsx:1-200
- `site/public/apps/clinic-scheduler-pro` – source + generated assets for scheduler. citesite/public/apps/clinic-scheduler-pro/src/main.jsx:1-200
- `functions-backend/` – Cloud Functions, scripts, tests. citefunctions-backend/index.js:47-549
- `services/ai-scribe/` – Websocket server, session manager, Gemini integration. citeservices/ai-scribe/session_manager.py:8-92services/ai-scribe/gemini_service.py:16-64
- `apps/` – legacy duplicates pending removal (do not modify). citeapps/README.md:7-88

## Glossary
| Term | Meaning |
|------|---------|
| **AI Scribe** | Real-time transcription + note generation workflow backed by Google Gemini. citeservices/ai-scribe/app.py:141-293 |
| **Clinic Scheduler Pro** | React app for residency rotation scheduling integrated with Firebase. citesite/public/apps/clinic-scheduler-pro/index.html:13-200 |
| **Mind Maps** | Interactive dermatology knowledge graphs with search/export. citesite/src/apps/mindmaps/MindMapApp.tsx:1-198 |
| **Protected Time** | Scheduling rules preventing duty hour violations. citefunctions-backend/chatbot/action-handlers.js:19-57 |
| **Gemini** | Google Vertex AI generative models used for text, image, and discussion prompts. citeservices/ai-scribe/gemini_service.py:16-64 |

## First Week Goals
1. Run `npm run site:build` and `npm run clinic:scheduler:build` to ensure environment parity. citepackage.json:15-28
2. Shadow deploy AI Scribe locally with sample `.env` and verify websocket handshake. citeservices/ai-scribe/README.md:5-34services/ai-scribe/app.py:118-162
3. Review `functions-backend/index.js` flows for features you will own; document open questions in `docs/`. citefunctions-backend/index.js:47-549
