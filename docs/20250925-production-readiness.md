# Production Readiness Checklist – September 25, 2025

## Prioritized Tasks

1. **Backfill Secure Membership Records**  
   - Migrate all institutions to ensure `/institutions/{id}/members/{uid}` documents exist before deploying hardened security rules.  
   - Verify no legacy user relies solely on the legacy `members` array.
   - Use `npm run backfill:members` (dry) then `npm run backfill:members:apply` prior to rule deployment.

2. **Automated Deployment & Smoke Verification**  
   - Create a script/CI job that deploys Firestore rules, redeploys critical Cloud Functions, seeds test data, and runs end-to-end workflow smoke tests (auth → institution join → CRUD → scheduling/conflict detection → export).

3. **Scale Validation**  
   - Load-test the scheduler UI and callable functions (`autoSchedule`, `chatAssistant`, `generateSchedulePDF`) with representative production data volumes.

4. **AI Scribe Operational Runbook**  
   - Document and rehearse health checks, secret rotation, Gemini outages, and restart procedures for the websocket service.

5. **Right-Size Firestore Listeners**  
   - Introduce pagination or contextual filtering for `attendings`, `residents`, and `assignments` listeners to prevent loading entire collections in the browser.

6. **Regression Test Suite**  
   - Add automated unit/integration tests (with Firebase emulators) covering validation utilities, scheduling flows, conflict detection, export logic, and Cloud Functions.

7. **CI Build & Lint Gates**  
   - Ensure CI runs `npm run clinic:scheduler:build`, Firebase emulator tests, and `python -m compileall services/ai-scribe` before acceptance.

8. **Dependency Pinning & Security Scans**  
   - Lock versions in `services/ai-scribe/requirements.txt` and `functions-backend/package.json`, commit lockfiles, and add `npm audit`/`pip-audit` steps to CI.

9. **Observability & Alerting**  
   - Add structured logging, enable monitoring (Firebase Crashlytics/Analytics or equivalent), and configure alert thresholds for errors, latency, and quota usage.

10. **Disaster Recovery & Backups**  
    - Validate `restoreFromBackup`, document retention schedules, and automate snapshot creation with recovery drills.

11. **Documentation & Ops Playbooks**  
    - Update setup/launch docs with accurate secrets management, Firebase provisioning, deployment steps, and rollback guidance for scheduler and AI Scribe services.

12. **Data Integrity Audits**  
    - Script checks for orphaned assignments, inconsistent role data, and stale rules to ensure data health prior to launch.

13. **Performance & Accessibility Polish**  
    - Lazy-load heavy dashboard components, confirm accessibility (focus/ARIA), and ensure responsive interactions across the scheduling UI.

14. **Frontend Maintainability**  
    - Refactor the 7,500-line `src/main.jsx` into feature modules and shared components to keep core functionality manageable.

15. **Release Governance**  
    - Enforce Conventional Commit linting, branch protections, release tagging, and post-launch monitoring checklists.
    - Release governance checklist documented in `docs/release-governance-checklist.md`; enable commit lint gating next.

16. **Deferred Security Enhancements**  
    - Once prioritized again, replace `Math.random()` invite codes with cryptographically strong IDs and rate-limit redemption.

## Developer Updates

_Add your name, date, tasks touched, and summary of work here._

- **Codex (assistant)** — _2025-09-25_
  - Task(s): Backfill script scaffolding; created smoke-test aggregate command.
  - Notes: Added `functions-backend/scripts/backfill-members.js` for legacy membership migration and `npm run clinic:smoke` to bundle build/tests.
- **Codex (assistant)** — _2025-09-25 (update 2)_
  - Task(s): Drafted AI Scribe operational runbook.
  - Notes: Added `docs/ai-scribe-operational-runbook.md` covering health checks, rotation, and incident response.
- **Codex (assistant)** — _2025-09-25 (update 3)_
  - Task(s): Scoped assignment listener to calendar range.
  - Notes: Updated `firebaseService.listenToAssignments` to accept date filters and bound Schedule Calendar queries to the active view window.
- **Codex (assistant)** — _2025-09-25 (update 4)_
  - Task(s): Load/regression planning and CI smoke integration.
  - Notes: Ran membership backfill, added GitHub Actions `clinic-smoke` job, documented `docs/load-test-plan.md` and `docs/regression-test-expansion.md`, and appended failover drill steps to the AI Scribe runbook.
- **Codex (assistant)** — _2025-09-25 (update 5)_
  - Task(s): Implemented load-test harness and regression scaffolding.
  - Notes: Added `tests/perf` suite (seed + scenarios S1–S4) with results captured in `tests/perf/results/latest.json`, established Vitest unit runner, integration/E2E stubs, and ensured `clinic:smoke` runs unit tests.
- **Codex (assistant)** — _2025-09-25 (update 6)_
  - Task(s): Load harness thresholds & reporting refresh.
  - Notes: Added `tests/perf/config.js` guardrails, taught `tests/perf/run-all.js` to fail on threshold breaches, refreshed `docs/load-test-plan.md`, and captured latest perf outputs.
- **Codex (assistant)** — _2025-09-25 (update 7)_
  - Task(s): CI automation for emulator E2E + perf guardrails, release governance doc.
  - Notes: Wired Playwright smoke (`scheduler-e2e`) and `perf-guardrails` jobs into CI, published `docs/release-governance-checklist.md`, and linked guardrail expectations across docs.
- **Codex (assistant)** — _2025-09-25 (update 8)_
  - Task(s): Production ops scripts and checklist updates.
  - Notes: Added npm scripts for membership backfill / rules deploy, migrated release checklist to /docs, and documented usage across readiness materials.
- **Name** — _YYYY-MM-DD_
  - Task(s):
  - Notes:

- **Name** — _YYYY-MM-DD_
  - Task(s):
  - Notes:
