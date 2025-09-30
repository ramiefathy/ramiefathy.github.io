# Dependency Audit

## JavaScript / Node

### Root (`package.json`)
| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| firebase | ^10.13.1 | Client SDK for legacy apps | Only used by static CDN apps; consider removing from root once all apps bundle their own runtime. citepackage.json:11-60 |
| @babel/cli / core / preset-react | ^7.28.x | Builds Clinic Scheduler Pro bundle | Can be replaced by Vite/ESBuild (already used indirectly by Astro) to unify toolchain. citepackage.json:11-44 |

### Astro Site (`site/package.json`)
| Package | Weight Consideration | Risk | Recommendation |
|---------|---------------------|------|----------------|
| @paper-design/shaders(-react) | ~400 KB per bundle | Rarely updated; increases bundle size & WebGL complexity | Inline generated gradient or pre-rendered assets to drop dependency. citesite/package.json:15-41site/src/components/Hero.jsx:1-200 |
| d3, html-to-image, jspdf, file-saver | Heavy WASM/DOM packages | Loaded client-side for mind maps export | Split into async chunks; evaluate server-side prerender or static exports. citesite/package.json:15-31site/src/apps/mindmaps/MindMapApp.tsx:1-200 |
| framer-motion | Reimported via CDN for Clinic Scheduler Pro | Duplicate delivery path (npm + CDN) | Prefer single bundler-generated build. citesite/package.json:15-31site/public/apps/clinic-scheduler-pro/index.html:13-73 |
| firebase-tools | ^13.8.0 dev dependency | 300+ MB install | Only needed for emulator runs; add conditional install or use `npx` on CI. citesite/package.json:33-41 |
| Vitest / Playwright | Present but not executed in CI | Risk of rot | Wire into pipelines and ensure tests import actual modules. citesite/package.json:33-41.github/workflows/ci.yml:20-49 |

### Firebase Functions (`functions-backend/package.json`)
| Package | Version | Notes |
|---------|---------|-------|
| @google-cloud/vertexai | ^1.10.0 | Heavy (~11 MB) but required for chatbot; ensure service account scopes minimal. citefunctions-backend/package.json:18-29functions-backend/chatbot/gemini.js:1-118 |
| firebase-admin @13.5.0 / firebase-functions @6.4.0 | Current major | Acceptable; watch for Node 20 compat releases. citefunctions-backend/package.json:18-29 |
| date-fns, pdfkit, node-cron | Used in scheduling + reports | `pdfkit` adds native fonts; evaluate Cloud Run alternative if binary size matters. citefunctions-backend/index.js:47-549 |
| @sendgrid/mail + nodemailer | Dual email clients | Consider standardising on SendGrid to reduce surface (nodemailer fallback implies SMTP secrets). citefunctions-backend/src/config/email.js:6-70 |
| Dev deps (mocha, sinon) | 0 behaviour coverage | Remove or replace after emulator tests land. citefunctions-backend/test/index.test.js:45-199 |

### AI Scribe (`services/ai-scribe/requirements.txt`)
| Package | Version | Notes |
|---------|---------|-------|
| websockets | latest | OK; ensure security patches tracked. citeservices/ai-scribe/requirements.txt:1-3 |
| google-generativeai | Latest major | No pinning → breaking API risk; pin to `~=0.x` and monitor release notes. citeservices/ai-scribe/requirements.txt:1-3services/ai-scribe/gemini_service.py:9-64 |
| python-dotenv | Loads `.env` | Already minimal. citeservices/ai-scribe/config.py:5-34 |

## Browser CDN Dependencies
- `Clinic Scheduler Pro` imports React, date-fns, Recharts, PapaParse, lucide icons, Tailwind, and framer-motion at runtime from `esm.sh`/CDNs. None are SRI pinned, so upstream changes auto-deploy to production. citesite/public/apps/clinic-scheduler-pro/index.html:13-148
- Google Fonts are fetched live for each visit. Package locally or via CSS `@font-face` in Astro build. citesite/public/apps/clinic-scheduler-pro/index.html:8-12

## Consolidation Opportunities
| Candidate | Effort | Impact | Rationale |
|-----------|--------|--------|-----------|
| Remove `/apps` duplicates | S | H | Migration script exists; eliminates 42 duplicate groups and ~1.7 MB history. citeapps/README.md:13-88audit/duplicate-report.txt:1-78scripts/migrate-apps-to-site.sh:42-170 |
| Replace CDN import map with Vite build | M | H | Use Astro/Vite pipeline to emit ESM bundles; reduces cold-start latency and supply-chain risk. citesite/public/apps/clinic-scheduler-pro/index.html:13-148site/package.json:5-41 |
| Drop `@paper-design/shaders(-react)` | M | M | Replace dynamic shader with pre-rendered SVG/PNG; improves accessibility and reduces bundle size. citesite/src/components/Hero.jsx:1-190site/package.json:15-31 |
| Standardise email delivery on SendGrid | S | M | Remove SMTP fallback to avoid credential drift and simplify secrets. citefunctions-backend/src/config/email.js:10-58 |
| Pin Gemini & Vertex AI libraries | S | M | Both SDKs auto-upgrade; lock versions to avoid silent API shifts. citeservices/ai-scribe/requirements.txt:1-3functions-backend/package.json:18-29 |

## License / Supply Chain Notes
- All Node packages inherit permissive licenses (MIT/Apache/BSD) typical for Firebase/React ecosystems; confirm SendGrid/Tailwind license compliance during bundling.
- CDN usage bypasses lockfiles; once bundling lands, enforce `npm audit`/`yarn audit` or Snyk scans pre-build to gate CVEs. citesite/public/apps/clinic-scheduler-pro/index.html:13-148.github/workflows/ci.yml:20-34

Prioritise eliminating runtime CDN dependencies and unifying build tooling—the largest risk/maintenance gains come from owning the compiled artifacts.
