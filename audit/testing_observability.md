# Testing & Observability Assessment

## Current Test Surface
- **Astro E2E:** Single Playwright spec covering Alopecia mind map, guarded by `test.skip` if shell fails to render. citesite/tests/mindmap.spec.ts:5-40
- **Firebase Functions:** Placeholder Mocha tests only assert exported function existence; no emulator-backed behavioural checks. citefunctions-backend/test/index.test.js:45-199
- **Utility coverage:** Some validator unit tests exist but limited to positive/negative scalar cases. citefunctions-backend/test/utils/validators.test.js:13-200
- **AI Scribe:** No automated tests for websocket flows or Gemini integration.

## Gaps & Risks
- **No regression suite for Clinic Scheduler Pro.** The 7.5k-line React bundle has zero unit or integration tests; errors only surface in production. citesite/public/apps/clinic-scheduler-pro/src/main.jsx:1-200
- **Auto-scheduling logic untested.** Complex constraints in `autoSchedule` lack deterministic tests, risking duty-hour violations. citefunctions-backend/src/scheduling/autoSchedule.js:1-200
- **Websocket resilience unverified.** Reconnect, token expiry, and error handling are untested; manual QA required. citeservices/ai-scribe/app.py:118-326
- **Observability minimal.** Logs are ad-hoc `console.log`/`logger.info` statements with no structured metadata; no metrics or tracing.

## Recommendations
1. **Adopt Firebase emulator-driven integration tests.** Use `firebase-functions-test` with emulator to validate `autoSchedule`, `notifyScheduleChange`, and chatbot handlers, including error scenarios. citefunctions-backend/index.js:47-295functions-backend/test/index.test.js:45-199
2. **Introduce Vitest unit tests for mind map hooks/components.** Mock D3/html-to-image to cover search, export, and persistence logic. citesite/src/apps/mindmaps/MindMapApp.tsx:73-198site/package.json:5-41
3. **Create Playwright smoke for Clinic Scheduler Pro & Dermatopathology Modern.** Use hosted build served via Astro preview to capture regressions. citesite/public/apps/clinic-scheduler-pro/index.html:13-200
4. **Add websocket contract tests.** Use `pytest-asyncio` to simulate message sequences (transcript, image, discussion) and validate responses/timeouts. citeservices/ai-scribe/app.py:141-293
5. **Implement structured logging & telemetry.** Wrap logger to emit JSON with `sessionId`, `messageType`, and error codes; surface metrics via Cloud Logging or OpenTelemetry. citeservices/ai-scribe/app.py:134-322functions-backend/index.js:129-295
6. **CI Enhancements:** Add `npm run site:test`, `npm run site:test:e2e` on ephemeral preview, and `python -m pytest` for websocket harness; upload artifacts. citesite/package.json:5-41.github/workflows/ci.yml:20-49

## Observability Roadmap
- Enable Firebase function structured logs (using `functions.logger`). citefunctions-backend/index.js:47-549
- Emit Gemini request IDs for traceability without logging PHI. citeservices/ai-scribe/gemini_service.py:16-64
- Add uptime and failure alerts on Pub/Sub schedules using Cloud Monitoring dashboards.
