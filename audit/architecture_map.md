# Architecture Map

## High-Level Components
- **Astro Frontend (`site/`)** renders static pages and boots React-powered applications (mind maps, Clinic Scheduler Pro) via client-side hydration. citesite/src/pages/index.astro:1-122site/src/pages/apps/index.astro:1-154
- **Interactive Browser Apps (`site/public/apps/`)** host large standalone React/vanilla bundles that call Firebase client SDKs, Gemini endpoints, or local browser APIs. citesite/public/apps/clinic-scheduler-pro/index.html:13-200site/public/apps/clinic-scheduler-pro/src/main.jsx:1-200
- **Firebase Functions (`functions-backend/`)** provide scheduling automation (`autoSchedule`), trigger-based notifications, PDF exports, analytics and chatbot actions, all backed by Firestore. citefunctions-backend/index.js:47-549
- **AI Dermatology Scribe (`services/ai-scribe/`)** exposes a websocket server that brokers transcripts, Gemini calls, and session state for the scribe UI. citeservices/ai-scribe/app.py:35-401services/ai-scribe/session_manager.py:8-92

## Data Flow (Text Diagram)
```
[Browser UI]
  |-- Astro routes serve static shell --> CDN or GitHub Pages cache
  |-- React apps fetch config JSON --> site/src/data/*.json
  |-- Clinic Scheduler Pro loads via importmap and reaches Firebase client SDK
      |-- Calls HTTPS callable functions (autoSchedule, analytics)
      |-- Listens to Firestore collections (assignments, auditLogs)
  |-- Mind Maps app loads dataset (mindmaps/) and persists annotations to localStorage
  |-- Dermatology Scribe UI opens websocket to AI Scribe backend

[Firebase Functions]
  |-- HTTPS callable: autoSchedule -> Firestore writes, audit logging
  |-- Firestore triggers: notifyScheduleChange, validateAssignment -> email + compliance
  |-- Pub/Sub: weeklyScheduleGeneration, dailyReminders -> scheduling + email summary
  |-- Gemini-powered chatbot actions via Vertex AI runtime

[AI Scribe Backend]
  |-- Websocket authentication via SESSION_SECRET + Origin whitelist
  |-- Handles transcript, image analysis, discussion prompts
  |-- Calls Google Gemini (text + vision) using google-generativeai SDK
  |-- Maintains in-memory SessionManager per client connection
```
citesite/public/apps/clinic-scheduler-pro/index.html:13-200functions-backend/index.js:47-549services/ai-scribe/app.py:118-326services/ai-scribe/gemini_service.py:16-64

## External Integrations
- **Firebase** – Admin SDK initialised without explicit options; Firestore used for institutions, assignments, audit logs. citefunctions-backend/src/config/firebase.js:6-19functions-backend/index.js:52-149
- **SendGrid/SMTP** – Email notifications fallback via SendGrid API or SMTP transport based on runtime config. citefunctions-backend/src/config/email.js:6-70
- **Google Vertex AI / Gemini** – Chatbot functions call Vertex AI; AI Scribe uses Gemini API directly. citefunctions-backend/chatbot/gemini.js:1-118services/ai-scribe/gemini_service.py:16-64
- **esm.sh / CDN vendors** – Runtime import maps fetch React, Tailwind, charts and animation libs from esm.sh and Google Fonts. citesite/public/apps/clinic-scheduler-pro/index.html:8-73

## Public API Surfaces
- **Firestore Callable Functions**: `autoSchedule`, `generateSchedulePDF`, `calculateAnalytics`, `syncWithExternalSystem`, etc. Input validation is manual within the shared handler file. citefunctions-backend/index.js:47-549
- **Firestore Triggers**: `notifyScheduleChange`, `validateAssignment`, triggered on `institutions/{id}/assignments/{id}` changes. citefunctions-backend/index.js:154-444
- **Pub/Sub Scheduled Jobs**: `weeklyScheduleGeneration`, `dailyReminders` for automation. citefunctions-backend/index.js:467-600
- **Websocket Protocol**: message types (`transcript_segment`, `stop_finalize_recording`, `discussion_input`, etc.) defined in AI Scribe handler. citeservices/ai-scribe/app.py:141-288

## Architectural Seams & Concerns
- **Boundary between React bundles and Astro pages is thin**—apps are shipped as prebuilt scripts rather than integrated components, complicating SSR and shared state. citesite/public/apps/clinic-scheduler-pro/index.html:13-200site/src/pages/apps/index.astro:20-142
- **Firebase Functions lack module boundaries**, mixing cron, triggers, and APIs in one file; failure in one flow risks redeploying the whole backend. citefunctions-backend/index.js:47-549
- **AI Scribe sessions remain in-memory**, so process restarts drop context, and scaling horizontally requires sticky sessions or external cache. citeservices/ai-scribe/session_manager.py:8-92services/ai-scribe/app.py:118-326
