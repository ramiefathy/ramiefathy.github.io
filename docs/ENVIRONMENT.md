Environment & Deployment Guide

1) Netlify Environment Variables
- GEMINI_API_KEY: Required for DermaScribe functions.
- GEMINI_DEFAULT_MODEL (optional): e.g., models/gemini-2.0-flash-exp
- GEMINI_VISION_MODEL (optional): e.g., models/gemini-2.0-flash-exp
- GEMINI_SUGGESTION_MODEL (optional): e.g., models/gemini-2.0-flash-exp

2) Build Settings
- Build command: vite build
- Publish directory: dist
- Node version: 20

3) Functions
- Location: netlify/functions
- Bundler: esbuild (configured in netlify.toml)
- External modules: google-generativeai, @netlify/blobs

4) Local Development
```bash
npm i
npm run dev    # http://localhost:5173
npm run test   # Vitest unit tests
```

5) Security Headers (CSP)
- Default (/*): strict, self-only connections.
- SPA (/index.html): strict CSP for the React app.
- Legacy apps (/apps/*): temporarily allow CDN scripts/styles (Tailwind CDN, Google Fonts, jsDelivr, cdnjs) while we migrate. Remove once all apps are bundled locally.

6) DermaScribe Endpoints
- /.netlify/functions/finalize        (POST)
- /.netlify/functions/suggestions     (GET, SSE)
- /.netlify/functions/image-analyze   (POST)
- /.netlify/functions/refine          (POST)
- /.netlify/functions/discuss         (POST)

7) Ingestion (Planned & Partially Implemented)
- Scheduled functions to harvest PubMed/Europe PMC metadata into Netlify Blobs.
- Viewer at /apps/research (fetches /.netlify/functions/research-list).

8) Troubleshooting
- 403/CSP errors on legacy pages: check the /apps/* CSP header block in netlify.toml.
- 500 on functions: verify env vars in Netlify UI; inspect function logs in Netlify.
- SSE not streaming: ensure connect-src 'self'; verify no proxies block EventSource.

