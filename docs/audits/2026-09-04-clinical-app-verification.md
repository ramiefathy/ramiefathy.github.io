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


## Follow-up automated-review disposition

All nine initial CodeRabbit findings were checked against source, not accepted as
instructions. The reset-order finding was reproduced conceptually with a provider
that returns a stale result while suppressing task cancellation: invalidation now
precedes the await on reset, superseded suggestion requests, and disconnect. The
new regression exercises the actual WebSocket handler for all three paths rather
than checking only the standalone suggestion function.

The evidence validator now builds a unique, canonical model/arm aggregate map and
rejects duplicated, orphaned, missing, or inconsistent rows. It also rejects
model/arm inventory duplicates and numeric/string arm aliases and verifies the
aggregate accuracy against the binary image vector. Negative tests assert their
specific failure message and derive vector lengths from the actual denominator.

Already-sanitized generation errors retain their useful configuration/validation
message, while arbitrary provider exceptions remain generic. The optional clear
button is null-guarded. All new risk flags have specific descriptions/icons, and
the accessible name always retains the visible risk label. JSDOM teardown now runs
in `afterEach`, including when an assertion fails. The historical local SDK import
shim is explicitly distinguished from the reproducible, actual-SDK CI path.

The iPLEDGE date finding did not require changing the clinical data: the entry's
cautions already name June 16, 2026, and the FDA reference label already includes
that dated implementation-delay notice. FDA's live source was rechecked and a
regression now explicitly requires that source date in the reference label.

The expanded local unit suite passes 307 tests in 37 files. New browser and
backend regressions are not counted as passed here until hosted receipts confirm
them. CodeRabbit reviewed earlier revisions; later review requests hit the
account's rate limit. Copilot review did not execute because of its quota limit.
Those limitations must not be described as independent approval of the final head.


## Queued-response encounter boundary

An additional adversarial check found that cancellation alone cannot retract a
response already queued on the connection. The client now fences clinical replies
as soon as it requests reset, uses a unique local reset identifier, and accepts
clinical output again only after the server acknowledges that exact reset (or an
acknowledgment establishes a fresh replacement connection). Earlier reset
acknowledgments cannot release a later reset. Events from superseded WebSockets are
ignored. This also prevents an in-flight sequential generation from repopulating a
newly cleared client before the backend reaches its queued reset command.

The backend echoes the bounded reset identifier and invalidates old work before
acknowledging. Legacy clients can still omit the identifier; the new client needs
the updated backend acknowledgment protocol. Deploy the frontend and service
together. An older backend cannot release the new client's safety fence, so the
client deliberately does not silently accept potentially cross-encounter output.
New browser tests exercise this boundary with a synthetic WebSocket transport;
this does not claim live model or production networking validation.


## 2026-09-07 follow-up

A second adversarial pass over PR #184 produced the following changes. Each
behavioral fix was written test-first; clinical text changes are attributed to
the sources already cited in the record or to a newly added guideline DOI.

- **Scribe reset fence liveness (high).** The client fence that drops queued
  clinical replies until a reset is acknowledged also dropped `error` replies,
  including the rate limiter's answer to `start_new_session`, so a rate-limited
  reset silently fenced the encounter forever. The fence is now armed only after
  the reset was actually sent; a non-area `error` during the fence releases it,
  discards provisional output and tells the user to start a new session again; a
  10-second acknowledgment timeout does the same; the timer is cancelled on
  acknowledgment or a fresh connection; and `connectWebSocket` closes a
  superseded CONNECTING socket instead of orphaning it. Server-side,
  `start_new_session` is exempt from the per-connection rate limiter because it
  performs no provider work. Browser regressions cover error release, timeout
  release, timer cancellation, unsent resets and socket replacement; a backend
  test proves the exemption after the limiter has engaged.
- **iPLEDGE time bomb (high).** The isotretinoin record asserted a present-tense
  "as of September 4, 2026" implementation status that would silently become
  wrong. It now makes only dated statements attributed to FDA (February 2026
  approval; June 16, 2026 announcement of the November 15, 2026 delay) and tells
  the reader to confirm the currently enforced program rules. The regression
  asserts the dated form and the absence of "as of" wording.
- **Print CSS (medium).** `.hero p { display:none }` also hid the clinical
  safety notice's paragraphs in print; an explicit print rule restores them and a
  stylesheet test parses the print blocks.
- **Stream validator (medium).** Trailing candidate-less, text-less chunks
  (usage metadata / keep-alive) are tolerated only after a normal STOP; post-STOP
  text or a non-STOP finish reason still fails, as does a candidate-less chunk
  before STOP.
- **Model override (medium).** A client `modelName` is forwarded only when it is
  in `GEMINI_ALLOWED_MODELS` (default: the default model alone); otherwise the
  server-configured model for that operation is used and the rejection is logged
  by class, never by value. A blank `GEMINI_DEFAULT_MODEL` is now a startup
  `RuntimeError`, mirroring `SESSION_SECRET`.
- **Dermoscopy evidence contract (medium).** `modelSummary` and `armSummary`
  rows must equal the sums of the reconciled per-pair aggregates, and arm
  identifiers accept only integers or exact canonical decimal strings (no
  booleans, arrays or padded strings).
- **Clinical record corrections (medium).** Ten records were corrected and each
  carries `safetyReview` dated 2026-09-07: ustekinumab (invented laboratory
  schedule and liver-enzyme hold removed; label TB, hypersensitivity, RPLS and
  noninfectious pneumonia guidance), IVIG (aseptic meningitis syndrome, TRALI,
  hemolysis, hyperproteinemia/pseudohyponatremia; infection badge replaced by
  thrombosis and renal badges), mycophenolate (boxed warning and REMS flags with
  contraception/testing text), methotrexate (explicit once-weekly dosing and the
  fatal daily-dosing error), baricitinib (atopic dermatitis annotated as not
  FDA-approved), hydroxychloroquine (SLE indication; AAO 2025 real-weight and
  under-400 mg/day severe-obesity ceiling, PMID 41232611), cyclosporine (AAD 2020
  blood-pressure framing replaces an unsourced 160/90 rule; US label 1-year
  psoriasis limit; guideline DOI added), dupilumab family (AAD 2024 guideline DOI
  replaces a trade-press URL; prurigo nodularis added), TNF inhibitors
  (`monitoringFrequency` is now `individualized`, a new labeled category) and the
  IL-17 class card (boxed-warning and REMS badge tooltips scoped to brodalumab via
  per-record `warningFlagNotes`). The dataset `safetyRevision` is 2026-09-07; the
  original dataset date is unchanged.
- **Validator tightening (low).** The dataset validator rejects a null
  `safetyReview`, empty `conditions`, review dates in the future and
  `relativeWeeks` outside 0..520; reference chips are built by a DOM-free helper
  that escapes labels and uses the validated URL's `href`.
- **Stale help text (low).** Legacy app help steps described Theme and Reset
  controls the shell does not have; they now describe Help and Reload (a page
  reload that deletes nothing), and a policy test greps every legacy HTML app for
  the retired wording.
- **CI (low).** The dependency audit gate is now
  `npm audit --audit-level=high --omit=dev`: still fail-closed for high/critical
  advisories in the shipped dependency graph, but dev-only tooling advisories no
  longer block merges (they remain in the recorded JSON evidence). Pinned action
  SHAs carry their resolved version tags as comments (`setup-node` v4.4.0,
  `upload-artifact` v4.6.2); `setup-python@v5` is unchanged.

Browser and backend suites were run locally against a synthetic transport and
mocked provider; this follow-up does not add live-model, production
authentication or patient-data validation.
