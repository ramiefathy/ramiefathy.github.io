# Hotspots (Top 20)
Each entry lists Severity, Confidence, Evidence, Recommendation, Effort, and Risk.

## 1. Clinic Scheduler Pro monolithic runtime
- **Severity:** Blocker | **Confidence:** 70%
- **Evidence:** 7,580 LOC single file with embedded UI/state/helpers. citeaudit/hotspot-loc.txt:1site/public/apps/clinic-scheduler-pro/src/main.jsx:1-200
- **Issue:** Hard to test; mixes networking, state, DOM, and styling; increases bundle size and regressions.
- **Recommendation:** Split into modules (state, data adapters, components) and bundle via Vite; adopt code-splitting.
- **Effort:** Large | **Risk:** Medium (requires regression testing across scheduler flows).

## 2. Firebase Functions megafile
- **Severity:** Blocker | **Confidence:** 80%
- **Evidence:** 1,929 LOC handling callable APIs, triggers, cron, and chatbot plumbing. citeaudit/hotspot-loc.txt:2functions-backend/index.js:47-549
- **Issue:** Single deployment unit; difficult to review, test, or apply least-privilege IAM.
- **Recommendation:** Refactor into per-feature modules (autoSchedule, notifications, analytics) and unit test with emulator.
- **Effort:** Medium | **Risk:** Medium.

## 3. Dermatopathology dataset duplication
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 4,455-line static dataset bundled verbatim into client. citeaudit/hotspot-loc.txt:3site/public/apps/dermatopathology-modern/dermatopathology-differentials-data-deduplicated.js:1-120
- **Issue:** Bloats initial download, repeated across multiple HTML variants.
- **Recommendation:** Serve JSON from CDN/API with lazy loading or compress into Astro data files.
- **Effort:** Medium | **Risk:** Low.

## 4. Dermatopathology Modern index HTML
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 3,765 LOC single-page HTML with inline scripts/styles. citeaudit/hotspot-loc.txt:4site/public/apps/dermatopathology-modern/index.html:1-200
- **Issue:** Hard to maintain; duplicates markup across variants; minimal separation of concerns.
- **Recommendation:** Port into Astro/React component tree; share layout primitives.
- **Effort:** Medium | **Risk:** Medium.

## 5. Legacy Dermatopathology differentials page
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 1,844 LOC static HTML maintained alongside modern app. citeaudit/hotspot-loc.txt:5site/public/apps/dermatopathology-differentials.html:1-200
- **Issue:** Divergent UX; unclear ownership; duplicates data from modern flow.
- **Recommendation:** Sunset or auto-generate from canonical dataset.
- **Effort:** Small | **Risk:** Low.

## 6. Biologic Monitoring CSS bundle
- **Severity:** Major | **Confidence:** 70%
- **Evidence:** 1,265-line stylesheet mixing layout, theming, and animations. citeaudit/hotspot-loc.txt:6site/public/apps/biologic-monitoring-dashboard/styles.css:1-200
- **Issue:** No design tokens; difficult to scope changes.
- **Recommendation:** Extract to CSS modules or Tailwind; dedupe colors/spacing via Astro.
- **Effort:** Medium | **Risk:** Low.

## 7. Biologic Monitoring JS bundle
- **Severity:** Major | **Confidence:** 70%
- **Evidence:** 1,208-line vanilla JS orchestrating data tables, exports, state. citeaudit/hotspot-loc.txt:7site/public/apps/biologic-monitoring-dashboard/app.js:1-200
- **Issue:** Lacks tests; compounds DOM manipulation/perf debt.
- **Recommendation:** Componentize (e.g., React/Vue) or split modules; add unit tests.
- **Effort:** Medium | **Risk:** Medium.

## 8. Shared data.js aggregator
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 1,134-line file storing heterogeneous app metadata. citeaudit/hotspot-loc.txt:8site/public/apps/data.js:1-200
- **Issue:** Coupled to multiple UIs; no schema validation.
- **Recommendation:** Move to structured JSON + Zod schema inside Astro data layer.
- **Effort:** Small | **Risk:** Low.

## 9. Clinic Scheduler Modern legacy page
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 1,227 LOC legacy HTML/JS page. citeaudit/hotspot-loc.txt:9site/public/apps/clinic-scheduler-modern/index.html:1-200
- **Issue:** Maintained alongside Pro stack; duplicates functionality.
- **Recommendation:** Deprecate or auto-generate from Pro components.
- **Effort:** Small | **Risk:** Low.

## 10. Original Scheduler prototype
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 1,082 LOC static HTML. citeaudit/hotspot-loc.txt:10site/public/apps/Scheduler.html:1-200
- **Issue:** Legacy detritus; risk of unmaintained features.
- **Recommendation:** Archive outside repo or integrate into legacy showcase only.
- **Effort:** Small | **Risk:** Low.

## 11. Dermatopathology differentials data (non-deduped)
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 1,228 LOC dataset. citeaudit/hotspot-loc.txt:11site/public/apps/dermatopathology-differentials-data.js:1-200
- **Issue:** Duplicate of deduplicated file; increases repo weight.
- **Recommendation:** Keep single canonical dataset, generate derived views at build time.
- **Effort:** Small | **Risk:** Low.

## 12. Mind Map React surface
- **Severity:** Major | **Confidence:** 70%
- **Evidence:** 807 LOC component combining state, D3 rendering, export, storage. citeaudit/hotspot-loc.txt:12site/src/apps/mindmaps/MindMapApp.tsx:1-200
- **Issue:** Hard to test; complex effect chains; performance risk on large datasets.
- **Recommendation:** Break into hooks (persistence, search, export) and unit-test with Vitest.
- **Effort:** Medium | **Risk:** Medium.

## 13. Chatbot action handlers
- **Severity:** Major | **Confidence:** 70%
- **Evidence:** 1,208 LOC orchestrating scheduling commands with Firestore reads inside loops. citeaudit/hotspot-loc.txt:13functions-backend/chatbot/action-handlers.js:1-200
- **Issue:** Sequential Firestore queries per loop; limited error handling.
- **Recommendation:** Extract reusable Firestore services, batch reads, add emulator tests.
- **Effort:** Medium | **Risk:** Medium.

## 14. Auto-schedule algorithm module
- **Severity:** Major | **Confidence:** 70%
- **Evidence:** 529 LOC algorithm mixing business logic, normalization, logging. citeaudit/hotspot-loc.txt:14functions-backend/src/scheduling/autoSchedule.js:1-200
- **Issue:** No unit tests; complex loops; difficult to tweak.
- **Recommendation:** Introduce strategy objects (rules, constraints) and test coverage.
- **Effort:** Medium | **Risk:** Medium.

## 15. AI Scribe websocket handler
- **Severity:** Major | **Confidence:** 80%
- **Evidence:** 401 LOC multi-branch async handler. citeaudit/hotspot-loc.txt:15services/ai-scribe/app.py:118-326
- **Issue:** Single function handles auth, message routing, Gemini calls; minimal error stratification.
- **Recommendation:** Split per message type, add middleware for auth/logging, reuse tasks.
- **Effort:** Medium | **Risk:** Medium.

## 16. Prompt templates module
- **Severity:** Minor | **Confidence:** 80%
- **Evidence:** 184 LOC multi-line string constants. citeaudit/hotspot-loc.txt:16services/ai-scribe/prompts.py:1-184
- **Issue:** Hard-coded text; duplication risk when tweaking separators.
- **Recommendation:** Externalize to JSON/Markdown with versioning.
- **Effort:** Small | **Risk:** Low.

## 17. Hero shader component
- **Severity:** Major | **Confidence:** 70%
- **Evidence:** 275 LOC mixing GLSL, React state, animation throttling. citeaudit/hotspot-loc.txt:17site/src/components/Hero.jsx:1-200
- **Issue:** Custom shader logic complicates onboarding; accessible fallback limited.
- **Recommendation:** Replace with pre-rendered animation or simplify shader config.
- **Effort:** Medium | **Risk:** Low.

## 18. Clinical differentials JS
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 631 LOC data + logic for differential tool. citeaudit/hotspot-loc.txt:18site/public/apps/clinical_differentials.js:1-200
- **Issue:** Unstructured dataset with UI logic; no build step.
- **Recommendation:** Convert to structured JSON + Astro component.
- **Effort:** Small | **Risk:** Low.

## 19. Dermatopathology modern index (fixed variant)
- **Severity:** Major | **Confidence:** 60%
- **Evidence:** 1,180 LOC alternate markup kept alongside primary page. citeaudit/hotspot-loc.txt:19site/public/apps/dermatopathology-modern/index-fixed.html:1-200
- **Issue:** Hard to know which variant is authoritative.
- **Recommendation:** Remove redundant copy or auto-generate via build flag.
- **Effort:** Small | **Risk:** Low.

## 20. Chatbot Gemini adapter
- **Severity:** Minor | **Confidence:** 70%
- **Evidence:** 123 LOC mapping intents to Vertex AI requests. citeaudit/hotspot-loc.txt:20functions-backend/chatbot/gemini.js:1-118
- **Issue:** No retry/backoff; JSON parsing inline.
- **Recommendation:** Add resilient client wrapper and schema validation.
- **Effort:** Small | **Risk:** Medium.
