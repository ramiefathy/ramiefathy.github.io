# Repository Overview

## Topology Snapshot
```
$(cat audit/repo-tree.txt)
```
*Source: repo snapshot generated for this audit.*

Key domains:
- **Astro frontend** in `site/` with public apps bundled under `site/public/apps/` and reactive UI in `site/src/components/` and `site/src/apps/`. citesite/README.md:1-5site/src/pages/index.astro:1-122
- **Firebase Functions backend** in `functions-backend/` providing scheduling automation, notifications, analytics, cron, chatbot integrations, and supporting scripts. citefunctions-backend/index.js:1-549functions-backend/package.json:18-35
- **AI Dermatology Scribe websocket service** in `services/ai-scribe/` (Python 3.11) handling transcription, Gemini API calls, and session management. citeservices/ai-scribe/app.py:1-401services/ai-scribe/session_manager.py:8-92
- **Legacy/archival assets** retained under `legacy/` and large ZIP `audit/binaries.txt:1`. citelegacy/README.md:1-40audit/binaries.txt:1
- **Historic `/apps` directory** still present alongside the canonical `site/public/apps/`, pending full migration. citeapps/README.md:7-88audit/duplicate-report.txt:1-78

## Language & LOC Distribution
```
$(cat audit/loc-by-language.csv)
```
The codebase is dominated by JavaScript/React single-page tools (~56% of LOC), with significant static HTML exports and Markdown documentation. Python (AI Scribe) and TypeScript (mind map app) represent <1% each, highlighting the concentration of risk in the browser apps and Firebase functions. citeaudit/loc-by-language.csv:1-14

## Build & Runtime Targets
- `npm run site:dev|build|preview` orchestrate Astro builds; `npm run clinic:scheduler:build` compiles the React scheduler bundle in place. citepackage.json:11-30site/package.json:5-41
- `python services/ai-scribe/app.py` launches the websocket backend; requires `.env` with Gemini keys and session secret. citeservices/ai-scribe/README.md:5-34services/ai-scribe/config.py:17-34
- Firebase Functions deploys via `firebase deploy --only functions`, with supporting emulator/test scripts. citefunctions-backend/package.json:9-35

## Notable Assets & Binaries
- `audit/binaries.txt:1` (7.5 MB) – historical artifacts packaged for reference. citeaudit/binaries.txt:1
- Large knowledge-base datasets (`dermatopathology-differentials-data-deduplicated.js`, etc.) duplicated across legacy and public app directories. citeapps/dermatopathology-modern/dermatopathology-differentials-data-deduplicated.js:1site/public/apps/dermatopathology-modern/dermatopathology-differentials-data-deduplicated.js:1

This inventory underpins deeper architectural, dependency, and quality analyses in subsequent artifacts.
