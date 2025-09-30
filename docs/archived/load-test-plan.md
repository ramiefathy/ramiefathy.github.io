# Clinic Scheduler Pro Load Test Plan

_Last updated: September 25, 2025_

## Objectives

1. Validate that realtime scheduling remains responsive (<150 ms Firestore commit latency, <500 ms UI update) under peak institutional load.
2. Confirm auto-scheduler, chat assistant, and export Cloud Functions stay within 95th percentile execution times outlined below.
3. Establish capacity thresholds and fallbacks (scaling rules, read/write quotas) prior to production launch.

## Test Scenarios

| Scenario | Description | Target Scale | Success Criteria |
|----------|-------------|--------------|------------------|
| S1 – Calendar Surge | 40 concurrent schedulers modifying a single institution’s calendar (drag/drop, create/delete). | 12 k assignment docs, 150 attendings, 220 residents. | UI latency <500 ms, Firestore reads <10k/min, no listener crashes. |
| S2 – Auto-Schedule Burst | Queue 25 autoSchedule invocations in parallel with varying date windows. | 6-week windows, 3k candidate slots each. | Each function completes <25 s, error rate <1%. |
| S3 – Chat Assistant Load | Simulate 10 concurrent chatbot conversations with a 5 s cadence. | 150 history tokens average. | Response time <4 s, rate limit not exceeded. |
| S4 – Export Spike | Generate overlapping PDF/CSV exports while scheduler updates occur. | 20 simultaneous exports. | PDFs generated <30 s, no data corruption. |

## Tooling

- **Firebase Emulator Suite** orchestrated via `npm run perf:run`, which launches Firestore locally and executes scripted scenarios in `tests/perf/`.
- **Node-based load harness** (`tests/perf/run-all.js`) driving high-concurrency Firestore mutations, callable invocations, and export routines.
- **CLI reporting** that writes consolidated metrics to `tests/perf/results/latest.json` and enforces guardrails defined in `tests/perf/config.js`.

## Data Seeding

1. Use `npx firebase emulators:exec --only firestore 'node tests/perf/seed-large-institution.js'` to create the large dataset locally.
2. Import anonymized production-like CSVs for attendings/residents via existing import flows when validating on staging data.

## Metrics & Instrumentation

- Collect Firestore metrics (reads/writes/latency) via emulator logs and production console when staged.
- Instrument front-end with `performance.mark` around listener updates; capture via Playwright traces when exercising UI scenarios.
- Enable Cloud Function logging for autoSchedule/chatAssistant/generateSchedulePDF to record execution time + memory.
- Enforce duration guardrails with `tests/perf/config.js`; scenario runs failing thresholds will exit non-zero in CI.
- CI `perf-guardrails` job executes `npm run perf:run` on every push/PR to catch regressions early.

## Acceptance Criteria

- No request exceeds published limits; if thresholds are crossed, document required scaling (Firestore sharding, queue throttling).
- Document any manual interventions required and convert to automation tickets.

## Deliverables

- Test harness scripts committed under `tests/perf/`.
- Runbook entry summarizing outcomes, bottlenecks, and mitigation steps.
- Updated `docs/20250925-production-readiness.md` with measured capacity and follow-up tasks.

## Latest Run (September 25, 2025)

Captured via `npm run perf:run` with thresholds enforced from `tests/perf/config.js`:

| Scenario | Duration (ms) | Threshold (ms) | Status | Notes |
|----------|---------------|----------------|--------|-------|
| S1 – Calendar Surge | 5,050 | 20,000 | ✅ | 40 concurrent writers updating 2,000 assignment notes |
| S2 – Auto-Schedule Burst | 1,262 | 7,500 | ✅ | 10 callable autoSchedule runs over staggered 3-week windows |
| S3 – Chat Assistant Load (simulated) | 435 | 500 | ✅ | Inserts 10 conversations × 20 messages into chat session collections |
| S4 – Export Spike | 853 | 3,000 | ✅ | 20 simulated exports reading 10k assignments aggregate |
| Functions – Callable & HTTP Metrics | 579 | 2,000 | ✅ | Measures autoSchedule, calculateAnalytics, and generateSchedulePDF execution |

Raw JSON output (including threshold metadata) is stored in `tests/perf/results/latest.json`.
