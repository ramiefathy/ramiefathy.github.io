# AI Scribe Operational Runbook

_Last updated: September 25, 2025_

This runbook captures the operational procedures for the **AI Dermatology Scribe** websocket service (`services/ai-scribe`).

## Service Overview

- **Process:** `python app.py`
- **Port:** `8765` (configurable via `PORT` env var)
- **Protocol:** Secure WebSocket (TLS terminated at the proxy)
- **Dependencies:**
  - Google Gemini API (`GEMINI_API_KEY`)
  - Session state stored **in-memory per WebSocket connection** (restart clears sessions)
  - Clients must authenticate with either:
    - a JWT signed with `JWT_SIGNING_SECRET` (HS256), or
    - the legacy shared secret `SESSION_SECRET` (server will issue a short-lived JWT)
  - Browser clients should send the token via WebSocket subprotocol (`Sec-WebSocket-Protocol: ramie-auth.<base64url(token)>`)
  - `?token=` remains supported as a legacy fallback but is discouraged

## Configuration Checklist

| Variable | Description | Rotation Guidance |
|----------|-------------|-------------------|
| `GEMINI_API_KEY` | Required for all AI calls | Rotate every 90 days or sooner if leaked |
| `GEMINI_DEFAULT_MODEL` | Text generation model (default `models/gemini-2.0-flash-exp`) | Update when upgrading Gemini version |
| `GEMINI_VISION_MODEL` | Model used for image analysis | Same as above |
| `GEMINI_SUGGESTION_MODEL` | Model for realtime hints | Same as above |
| `SESSION_SECRET` | Shared authentication token | Rotate quarterly; coordinate with frontend release |
| `JWT_SIGNING_SECRET` | JWT signing/verifying secret (HS256) | Rotate with `SESSION_SECRET`; keep distinct when possible |
| `ALLOWED_ORIGINS` | CSV of permitted `Origin` headers | Update when adding new frontend host |

> **Tip:** Store secrets in Render/Heroku config (or your platform equivalent) and track them in the `docs/production-ready` orientation file when rotated.

## Health & Monitoring

### Health Check Endpoint

The server responds to `GET /` or `HEAD /` with `200 OK`. Configure your load balancer to probe every 30 seconds.

### Logging

- Structured via Python `logging` module (stdout)
- Key log messages:
  - `Client connected` – useful for tracing session load
  - `Rejected connection` – indicates invalid origin or token (monitor for abuse)
  - `Error during ...` – capture stack traces for Gemini/API issues

### Alerting

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Consecutive health check failures | 3 probes | Auto-restart via process manager, notify on-call |
| Authentication rejections | >10/minute | Investigate possible token misuse |
| Gemini API errors | >5/minute | Check Gemini status dashboard, fall back to manual note entry |

## Operational Procedures

### Deployment

1. Ensure `SESSION_SECRET` and Gemini keys are set in env.
2. Run regression command `npm run clinic:smoke` from repo root.
3. Deploy code (`git push` or platform-specific deploy).
4. Confirm health check passes and review logs for the first 5 minutes.

### Restart / Failover

- Restart command: `pkill -f app.py` followed by process manager restart (or trigger via hosting provider UI).
- If Gemini outage occurs:
  1. Notify clinicians via status page.
  2. Keep websocket available for transcript capture (responses will fallback to warnings).
  3. Once Gemini recovers, clear backlog by re-triggering `stop_finalize_recording` events if needed.

### Quarterly Failover Drill

1. **Announce window** in #ops 24 hours ahead; coordinate with a clinical tester to validate note generation post-drill.
2. **Simulate Gemini outage** by temporarily swapping `GEMINI_API_KEY` with a dummy value and restarting the service. Confirm clients receive the degraded-mode toast and no crashes occur.
3. **Rotate `SESSION_SECRET`** using `openssl rand -base64 48`, update hosting config, deploy frontend token issuer, and verify old tokens are rejected.
4. **Restore production configuration** (valid Gemini key + new secret) and run `npm run clinic:smoke` plus a manual websocket session to confirm recovery.
5. **Capture findings** in the production readiness tracker, noting timing, issues discovered, and remediation follow-ups.

### Secret Rotation

1. Generate new high-entropy secret (`openssl rand -base64 48`).
2. Update `SESSION_SECRET` in hosting platform.
3. Update frontend config (local storage token issuer) and release.
4. Restart websocket service to pick up new secret.
5. Announce brief downtime to clinicians.

### Incident Response Checklist

- **Authentication Failures:**
  - Verify `SESSION_SECRET` matches frontend
  - Check `ALLOWED_ORIGINS`
  - Inspect logs for IP patterns (possible abuse)

- **Gemini Errors:**
  - Review stack trace for rate limit vs. config issues
  - Validate API key and model IDs
  - If persistent, switch `GEMINI_DEFAULT_MODEL` to backup model (document in release notes)

- **Performance Degradation:**
  - Inspect `show realtime suggestions` logs – consider reducing suggestion frequency by increasing threshold in `app.py`
  - Use process manager metrics to scale horizontally (stateless service)

## Runbook History

- **2025-09-25:** Initial version authored by Codex – covers configuration, health checks, rotation, and incident response.
