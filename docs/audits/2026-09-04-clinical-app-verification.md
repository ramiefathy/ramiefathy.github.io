# Clinical-app audit: integration findings and verification

This supplements `2026-09-04-clinical-app-audit.md`. The clean review branch is
`audit/clinical-reference-safety-20260904`, PR #184. The earlier
`audit/clinical-apps-20260904` branch was isolated transfer/testing infrastructure;
its temporary workflows and encoded source-transfer files are not part of the PR.

## Findings from clean CI and browser traces

The first clean CI run rejected an incomplete optional-dependency lockfile.
Repair run `33937878617` used the repository's Node 22.12.0/npm 10.9.0, added the
missing `@emnapi/core` and `@emnapi/wasi-threads` entries, then proved a clean
`npm ci` and zero reported npm vulnerabilities. It did not disable the audit or
replace `npm ci` with an unlocked install.

CI run `33938021254`, head `48a02b64ee625236e3c8d06a136d59284785f866`, passed
283 unit tests, the production build, immutable/D&D build contracts, dependency
audit, and 29 backend tests with the actual provider package installed. Its expanded
Chromium suite passed 264 tests, failed one, and skipped none. The failure-injection
test's browser trace showed the root service worker fetching the real dataset,
bypassing `page.route`; it was not a demonstrated failure of the data validator.
The corrected injection test blocks workers only in that describe block and
asserts that the intended request was actually intercepted. Other suites retain
workers. A separate real-worker regression verifies that even an old seeded cache
cannot supply clinical data online or offline.

That investigation exposed a genuine safety defect: the root worker cached every
same-origin GET with stale-first behavior and deleted other apps' caches on
activation. It now caches only an explicit public-shell allowlist, uses network
first, excludes all app/research/data requests and authorization/query requests,
refuses to cache errors/private/redirected responses, and deletes only its own
older cache versions. Optional precache failure does not preserve the old worker.
Fifteen VM-based service-worker tests passed locally, bringing the unit suite to
298 tests in 37 files. Offline clinical reference availability is deliberately
not promised; stale clinical guidance must not masquerade as current network data.

The research page's static introduction now agrees with the dashboard's 100-image
and 10,200-repeated-evaluation denominator. Unsupported assertions of clinician
equivalence or a closing performance gap were removed; this fixed benchmark cannot
establish either conclusion.

## SDK and deployment boundary

The old backend used the deprecated `google-generativeai` SDK and defaulted to a
Gemini 2.0 experimental model. It now uses `google-genai==2.22.0`, explicit model
configuration, the modern asynchronous content/stream API, validated base64 image
parts, string-valued completion enums, exclusion of thought parts from clinical
text, and sync/async transport cleanup on success, failure, and cancellation.
An empty or known-retired model configuration fails before a provider request.
No replacement model is silently selected for an unvalidated clinical workflow.

The expanded backend suite includes real SDK response/part type construction and
mocked transport behavior. Live model availability, outputs, audio, camera,
production authentication, and patient-data permission remain untested. The
README now accurately describes process-memory encounter state rather than
claiming the server is stateless. Existing deployments must explicitly set and
validate `GEMINI_DEFAULT_MODEL`; this configuration requirement is intentional.

Primary implementation references:
- https://ai.google.dev/gemini-api/docs/libraries
- https://ai.google.dev/gemini-api/docs/deprecations
- https://googleapis.github.io/python-genai/
- https://pypi.org/project/google-genai/2.22.0/
- https://playwright.dev/docs/network#missing-network-events-and-service-workers

## Visual evidence and final receipts

The expanded hosted suite produced 48 route/scroll screenshots, plus two monitoring
screenshots embedded in the JSON report. Contact-sheet review covered the route
inventory; the monitoring desktop/mobile captures were inspected separately.
Screenshot capture is not a pixel-baseline comparison or a complete accessibility
audit, and testing a browser mock is not a live third-party integration test.

Final verified head, test counts, workflow URL, and any subsequent corrections are
posted in the PR discussion after inspecting CI results. These source notes do not
predeclare pending tests as passed. The original audit's per-app clinical-content
boundaries remain in effect: this is not certification of all monographs or
external applications.
