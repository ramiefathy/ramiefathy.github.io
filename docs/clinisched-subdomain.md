# Clinisched — Standalone Repo + Subdomain Hosting

Clinisched is intentionally **not** shipped from the main `ramiefathy.github.io` repository. It is hosted as a standalone application under a dedicated subdomain to keep the main site lightweight and to allow Clinisched to iterate independently.

## Canonical URLs

- **Canonical (public) URL:** `https://clinisched.ramiefathy.com/`
- **Source/deploy repo:** `ramiefathy/clinisched` (GitHub Pages + custom domain)

## Main Site Integration

The main site (`ramiefathy.com`) lists Clinisched in the apps catalog via:

- `site/src/data/apps.json` → Clinisched entry `href` + `preview` must remain `https://clinisched.ramiefathy.com/`

There is a Playwright regression test that helps prevent accidental removal or relinking:

- `site/tests/clinic-scheduler-pro.spec.ts`

Run locally:

```bash
npm --prefix site run test:e2e
```

## Legacy Path Compatibility (Cloudflare Redirect Rules)

Historically, the Clinic Scheduler Pro app was served from the main site under:

- `/apps/clinic-scheduler-pro/index.html`

After moving to the subdomain, the main repo no longer ships `site/public/apps/clinic-scheduler-pro/**`.

To prevent breaking old bookmarks/links, configure Cloudflare to redirect:

1) **Primary entrypoints**

- From: `https://ramiefathy.com/apps/clinic-scheduler-pro/index.html`
- To: `https://clinisched.ramiefathy.com/`
- Status: `301`
- Preserve query string: enabled

- From: `https://ramiefathy.com/apps/clinic-scheduler-pro/index-animated.html`
- To: `https://clinisched.ramiefathy.com/index-animated.html`
- Status: `301`
- Preserve query string: enabled

2) **Catch-all** (anything else under `/apps/clinic-scheduler-pro`)

- From: `https://ramiefathy.com/apps/clinic-scheduler-pro*`
- To: `https://clinisched.ramiefathy.com/`
- Status: `301`
- Preserve query string: enabled

Important: place the **specific entrypoint rules** above the catch-all rule.

## Verification Commands

```bash
curl -I -L https://ramiefathy.com/apps/clinic-scheduler-pro/index.html
curl -I -L https://ramiefathy.com/apps/clinic-scheduler-pro/index-animated.html
curl -I -L https://ramiefathy.com/apps/clinic-scheduler-pro/
curl -I https://clinisched.ramiefathy.com/
```

Expected:

- Old URLs return `301` to `clinisched.ramiefathy.com/...`
- Final destination returns `200`

## Notes

- If you later tighten security headers on the subdomain (e.g., `X-Frame-Options` or strict `Content-Security-Policy`), the main site’s iframe-based previews may stop working. The main “Visit the App” link will still work.
- Firebase Auth must allow `clinisched.ramiefathy.com` as an Authorized Domain, otherwise login can fail on the subdomain.
