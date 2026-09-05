# AI scribe deployment gates

The automated suite uses synthetic encounters and mocked provider responses. It
checks software contracts, not clinical output quality, live model availability,
privacy authorization, or permission to use the service for patient care.

## Configuration before starting the service

Install the pinned dependencies from `requirements.txt`. Configure
`GEMINI_API_KEY`, `GEMINI_DEFAULT_MODEL`, `SESSION_SECRET`,
`JWT_SIGNING_SECRET`, and `ALLOWED_ORIGINS` using deployment-managed secrets.
The two signing/session secrets should differ. Select a currently available model
that has been evaluated for the intended workflow; the application no longer
silently defaults to a retired Gemini 2.0 experimental model. Blank vision and
suggestion overrides inherit the explicit default.

## Synthetic-only live integration checks

Verify text generation and note/analysis separation, normal streaming completion,
provider rejection and truncation, disconnection during a stream, and image input
against the selected model and account. Confirm that incomplete output is not
saved as a completed note and that reset/disconnect cannot carry suggestions from
one encounter into another. Exercise microphone and camera permissions on the
actual target browsers; GitHub-hosted Chromium does not establish device support.

## Deployment and information handling

Use TLS for browser connections. Verify allowed origins, JWT expiry, invalid-token
rejection, and rate limiting through the actual proxy. Prefer the documented
WebSocket subprotocol authentication over legacy query-string credentials. Check
proxy and hosting logs as well as application logs for accidental content or token
capture. Confirm the applicable authorization and contractual controls before
transmitting any patient information; no compliance certification is implied.

Active sessions are process-local and are lost on restart. Multi-worker hosting
requires session affinity or a separately designed, secured session store. Test
restarts and reconnection rather than assuming stateless behavior.

## Release evidence

Record the deployed commit, dependency versions, selected model, test date, and
synthetic test results. Review `docs/audits/2026-09-04-clinical-app-audit.md` and
`docs/audits/2026-09-04-clinical-app-verification.md` from the repository root for
scope limitations. Successful CI does not replace these live deployment checks.
