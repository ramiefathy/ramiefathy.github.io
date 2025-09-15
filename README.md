# Dr. Ramie Fathy — Modern Website

Modernized site powered by Vite + React + TypeScript and deployed on Netlify. Legacy RMarkdown pages and libraries have been removed. Interactive apps remain accessible under `/apps/` while React rewrites are added progressively.

🌐 Live: https://ramiefathy.github.io

## Tech Stack

- Frontend: React 19 + TypeScript, Vite 6
- UI: MUI 7 + Tailwind (compiled)
- Routing: React Router 6
- Backend: Netlify Functions (Node 20) using Google Generative AI
- Testing: Vitest + React Testing Library

## Structure

```
.
├── index.html                 # Vite entry
├── netlify.toml               # Build, headers, redirects, functions
├── src/
│   ├── App.tsx                # App shell + theme
│   ├── main.tsx               # Router
│   ├── index.css              # Tailwind entry
│   ├── theme.ts               # MUI theme builder
│   ├── data/                  # Static data (apps list, etc.)
│   ├── components/            # Header/Footer
│   └── pages/
│       ├── HomePage.tsx
│       ├── AboutPage.tsx
│       └── apps/DermaScribePage.tsx
├── netlify/functions/         # Serverless endpoints
│   ├── finalize.js            # Create note/analysis from transcript
│   └── image-analyze.js       # Describe dermatology images
├── apps/                      # Legacy apps (kept public)
├── assets/public/             # Public assets (docs, images)
└── tests/                     # Vitest tests
```

## Develop

```bash
npm i
npm run dev
```

## Build & Deploy (Netlify)

- Build: `npm run build` (Vite → `dist/`)
- Netlify builds via `netlify.toml` (`command = vite build`, `publish = dist`)
- SPA fallback and security headers configured

## Environment Variables (Netlify)

- `GEMINI_API_KEY` (required)
- `GEMINI_DEFAULT_MODEL` (optional, defaults to `models/gemini-2.0-flash-exp`)
- `GEMINI_VISION_MODEL` (optional)

Do not commit secrets. Client-exposed values must be prefixed `VITE_`.

## Notes

- RMarkdown outputs and `site_libs/` have been removed from the main branch. If any binary remnants remain (e.g., `*_files/` PNGs), remove them with `git rm` in a follow-up commit.
- The legacy Python `server/` backend has been removed; Netlify Functions are the supported backend.

## Testing

```bash
npm run test
```

## License

MIT
