# Skinoculars — Standalone Repo + Subdomain Hosting

Skinoculars is intentionally **not** shipped from the main `ramiefathy.github.io` repository. It is hosted as a standalone application under a dedicated subdomain to keep the main site lightweight and to allow Skinoculars to iterate independently.

## Canonical URLs

- **Canonical (public) URL:** `https://skinoculars.ramiefathy.com/`
- **Source/deploy repo:** `ramiefathy/Skinoculars` (GitHub Pages + custom domain)

## Main Site Integration

The main site (`ramiefathy.com`) lists Skinoculars in the apps catalog via:

- `site/src/data/apps.json` → Skinoculars entry `href` + `preview` must remain `https://skinoculars.ramiefathy.com/`

There is a Playwright regression test that helps prevent accidental removal or relinking:

- `site/tests/skinoculars.spec.ts`

Run locally:

```bash
npm --prefix site run test:e2e
```

## Legacy Path Compatibility (Cloudflare Redirect Rules)

Historically, Skinoculars was served from the main site under:

- `/apps/Skinoculars/dist/index.html`

After moving Skinoculars to the subdomain, the main repo no longer ships `site/public/apps/Skinoculars/**`.

To prevent breaking old bookmarks/links, Cloudflare is configured to redirect:

1) **Dist paths** (preserve remainder of path)

- From: `https://ramiefathy.com/apps/Skinoculars/dist/*`
- To: `https://skinoculars.ramiefathy.com/${1}`
- Status: `301`
- Preserve query string: enabled

2) **Catch-all** (anything else under `/apps/Skinoculars`)

- From: `https://ramiefathy.com/apps/Skinoculars*`
- To: `https://skinoculars.ramiefathy.com/`
- Status: `301`
- Preserve query string: enabled

Important: place the **dist** rule above the catch-all rule.

## Verification Commands

```bash
curl -I -L https://ramiefathy.com/apps/Skinoculars/dist/index.html
curl -I -L https://ramiefathy.com/apps/Skinoculars/
curl -I https://skinoculars.ramiefathy.com/
```

Expected:

- Old URLs return `301` to `skinoculars.ramiefathy.com/...`
- Final destination returns `200`

## Notes

- If you later tighten security headers on the subdomain (e.g., `X-Frame-Options` or strict `Content-Security-Policy`), the main site’s “Quick Demo” iframe preview may stop working. The main “Visit the App” link will still work.
