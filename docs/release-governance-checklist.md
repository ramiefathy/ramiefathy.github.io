# Release Governance Checklist

_Last updated: September 25, 2025_

## 1. Pre-merge Gates

- [ ] CI `build-site` ✅ `npm run site:build`
- [ ] CI `clinic-smoke` ✅ `npm run clinic:smoke`
- [ ] CI `firebase-integration` ✅ emulator-backed FirebaseService suite
- [ ] CI `scheduler-e2e` ✅ Playwright emulator smoke
- [ ] CI `perf-guardrails` ✅ `npm run perf:run` thresholds green
- [ ] python compile: `python -m compileall services/ai-scribe`

## 2. Security & Data Integrity

- [ ] Run membership backfill (`npm run backfill:members`, then `npm run backfill:members:apply`)
- [ ] Deploy hardened Firestore rules (`npm run deploy:rules`)
- [ ] Confirm no `.env` secrets committed; keys rotated if compromised
- [ ] Validate Firestore indexes (`firebase firestore:indexes`)

## 3. Deployment Steps

1. **Firebase Functions**
   - [ ] `npm install --prefix functions-backend` (fresh)
   - [ ] `npm test --prefix functions-backend`
   - [ ] `firebase deploy --only functions`
2. **Astro Site / Scheduler Bundle**
   - [ ] `npm run clinic:scheduler:build`
   - [ ] `npm run site:build`
   - [ ] Deploy static assets (`netlify deploy`, `firebase hosting:channel:deploy`, or GitHub Pages sync)
3. **AI Scribe Service**
   - [ ] Confirm `services/ai-scribe/.env` has `SESSION_SECRET`, Gemini keys
   - [ ] Redeploy service (Docker/image or server restart)

## 4. Post-Deploy Verification

- [ ] Production login via email/password
- [ ] Institution create → member invite → join flow
- [ ] Calendar CRUD (attending/resident assignment) + auto-scheduler dry run
- [ ] Report exports (PDF/CSV) succeed
- [ ] AI Scribe websocket operational check (healthy handshake, failover path)
- [ ] Observe metrics dashboards / logs for 30 minutes

## 5. Communication & Rollback

- [ ] Release notes circulated (docs/20250925-production-readiness.md update)
- [ ] Incident contacts notified of maintenance window
- [ ] Rollback plan validated (previous deployment artifact accessible)
- [ ] Monitoring alerts enabled (Firestore, Functions, AI Scribe)

## 6. Sign-off

- [ ] Engineering lead approval
- [ ] Clinical stakeholder approval
- [ ] Security/data protection review complete

Document any deviations or temporary waivers in the production readiness tracker.
