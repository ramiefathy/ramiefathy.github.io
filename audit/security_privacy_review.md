# Security & Privacy Review

## Secrets & Authentication
- **Shared session token for AI Scribe.** Websocket connections accept a single `SESSION_SECRET` token (query param or `X-Auth-Token`), raising risk of leakage and lacking per-user revocation. citeservices/ai-scribe/config.py:17-27services/ai-scribe/app.py:101-120
- **Default allowed origins include localhost only.** Production deployments must set `ALLOWED_ORIGINS`; absence falls back to localhost, but misconfiguration could allow any origin if env not set. citeservices/ai-scribe/config.py:23-28
- **SendGrid/SMTP dual configuration.** Fallback SMTP credentials (defaulting to Gmail host) may encourage storing reusable username/password pairs in Functions config; prefer API-based SendGrid with scoped keys. citefunctions-backend/src/config/email.js:10-55
- **Firebase callable functions rely solely on context.auth.** No fine-grained role guard beyond manual Firestore lookups; missing quotas/rate limits on scheduling endpoints. citefunctions-backend/index.js:47-149

## Data Protection & Privacy
- **Transcript data kept in memory only, but logs can leak metadata.** Handlers log session IDs and message types; ensure no transcript content is logged when exceptions occur. citeservices/ai-scribe/app.py:134-198
- **Email notifications include schedule details.** Ensure PHI policies allow emailing assignments with resident names; consider encrypting or requiring opt-in. citefunctions-backend/index.js:211-295
- **Audit logs store full assignment payload.** Logs include entire assignment object, potentially containing sensitive notes. citefunctions-backend/index.js:129-139

## Dependency & Supply-Chain Risk
- **Unpinned CDN dependencies.** Clinic Scheduler Pro downloads React, Tailwind, Recharts, framer-motion from `esm.sh` without version pinning or subresource integrity. citesite/public/apps/clinic-scheduler-pro/index.html:13-148
- **Python Gemini SDK unpinned.** `google-generativeai` floats to latest, risking breaking API changes; lock to known-good release. citeservices/ai-scribe/requirements.txt:1-3
- **Vertex AI SDK auto-updates.** Pin `@google-cloud/vertexai` to minor version; monitor security bulletins. citefunctions-backend/package.json:18-29

## Input Validation & Abuse Scenarios
- **Sequential Firestore reads in chatbot handler.** Lack of throttling could amplify billable reads on repeated commands; add caching and limit recurrence. citefunctions-backend/chatbot/action-handlers.js:118-198
- **Auto-schedule accepts arbitrary options.** No schema validation; malicious clients could request large date ranges causing resource exhaustion. citefunctions-backend/index.js:52-118
- **Image analysis accepts arbitrary base64** without size guard beyond websocket `max_size=10MB`; enforce MIME/type whitelist server-side. citeservices/ai-scribe/app.py:175-199

## Logging & Observability
- **Generic error response.** `services/ai-scribe` sends plain string errors; include correlation IDs to trace sessions while avoiding sensitive content. citeservices/ai-scribe/app.py:171-322
- **CI lacks dependency scanning.** No npm audit/SBOM step before deployment. cite.github/workflows/ci.yml:20-35

## Recommendations
1. Introduce per-user signed JWTs for AI Scribe with rotation schedule and rate limiting. citeservices/ai-scribe/config.py:17-27
2. Replace CDN imports with bundled assets plus SRI hashing; enforce lockfiles. citesite/public/apps/clinic-scheduler-pro/index.html:13-148
3. Pin Gemini/Vertex AI SDK versions and add automated CVE scanning in CI. citeservices/ai-scribe/requirements.txt:1-3functions-backend/package.json:18-29.github/workflows/ci.yml:20-35
4. Add schema validation (Zod/TypeBox) for callable function payloads; cap date range and recurrence parameters. citefunctions-backend/index.js:52-149
5. Sanitize email/audit payloads to avoid PHI leakage; encrypt or minimize stored fields. citefunctions-backend/index.js:211-295functions-backend/index.js:129-139
