# Regression Test Expansion Plan

_Last updated: September 25, 2025_

## Goals

1. Provide automated coverage for the core scheduling workflow (auth → institution load → CRUD → conflict detection → export).
2. Execute Firebase emulator-based tests for Cloud Functions, covering success and failure modes.
3. Establish smoke, integration, and end-to-end tiers that can run in CI and pre-release environments.

## Test Matrix

| Tier | Scope | Tooling | Cadence |
|------|-------|---------|---------|
| Unit | Validation utilities, React helpers, conflict detection pure functions | Vitest + React Testing Library | On every PR |
| Integration | FirebaseService methods, Cloud Functions callable flows via emulators | Jest/Vitest with Firebase Emulator Suite | Nightly + PR |
| E2E | Browser scheduling actions, invite redemption, exports | Playwright against emulator-backed stack | Release candidates |

## Action Items

1. **Unit Tests**
   - Set up Vitest config under `apps/clinic-scheduler-pro/`.
   - Cover `ValidationUtils`, `ConflictDetection`, and `ExportUtils` modules.

2. **Firebase Integration Tests**
   - Create `tests/integration/firebase-service.test.ts` hitting the emulator.
   - Add GitHub Action service containers to start Firestore/Auth emulators.

3. **Playwright E2E**
   - Build fixture that seeds emulator data, launches `npm run site:dev`, exercises drag-drop scheduling, observe toasts.

4. **Reporting**
   - Publish coverage summary to GitHub Actions (Codecov or summary artifact).
   - Update `docs/20250925-production-readiness.md` with coverage percentages once established.

## Dependencies

- Ensure emulator configs (`firebase.json`, firestore.rules`) match production security posture.
- Provide anonymized fixture data for automation to consume.

