# KSA Sovereign Credit Analytics - Private Subdomain Hosting

KSA Sovereign Credit Analytics is intentionally **not** shipped from the main `ramiefathy.github.io` repository. The main site only links to the protected app entrypoint. The dashboard should run as its own Docker/Postgres service and be exposed through Cloudflare Access.

This setup is designed to avoid new paid resources. Do not enable paid Cloudflare features, do not buy market data through this repo, and stop if any Cloudflare screen asks for an upgrade or paid add-on.

## Canonical URLs

- **Canonical protected URL:** `https://ksa-credit.ramiefathy.com/`
- **Dashboard source directory:** `/Users/ramiefathy/Downloads/ksa-sovereign-credit-analytics-completed`
- **Main site source:** `site/src/data/apps.json`
- **Access model:** Cloudflare Access in front of the subdomain; no app-level auth in v1

## Main Site Integration

The public `ramiefathy.com` site lists the dashboard in the apps catalog via:

- `site/src/data/apps.json` -> `ksa-sovereign-credit-analytics`
- `site/public/assets/apps/ksa-credit-preview.svg` -> static preview image
- `docs/site-test-inventory.md` -> canonical external app inventory

The preview image is static on purpose. The main site must not iframe or scrape the protected dashboard because the app may display licensed market data after you configure feeds.

## No-Cost Deployment Shape

Use existing Cloudflare account capabilities only:

- Cloudflare DNS for `ksa-credit.ramiefathy.com`
- Cloudflare Tunnel from a machine you already control
- Cloudflare Access policy allowing only your chosen identity/provider
- Local Docker Compose for the dashboard and Postgres

Expected flow:

```text
Browser -> Cloudflare Access -> Cloudflare Tunnel -> local Docker service -> Postgres volume
```

Recommended local origin:

```text
http://localhost:3000
```

## Cloudflare Access And Tunnel Checklist

1. Run the dashboard locally on a machine you already control.
2. Confirm the app is reachable locally at `http://localhost:3000`.
3. Create a Cloudflare Tunnel for `ksa-credit.ramiefathy.com`.
4. Route `https://ksa-credit.ramiefathy.com/` to `http://localhost:3000`.
5. Create a Cloudflare Access application for `ksa-credit.ramiefathy.com`.
6. Add an allow policy for only the identities you approve.
7. Confirm unauthenticated/incognito access is blocked by Cloudflare Access.
8. Confirm authenticated access reaches the dashboard.

Do not expose the service directly on the public internet. If the tunnel is unavailable, the app should be inaccessible rather than bypassing Access.

## Dashboard Runtime Notes

Keep secrets and licensed data out of the website repository:

- Do not commit `.env` files.
- Do not commit licensed bond/CDS/vendor exports.
- Do not commit provider API keys or bearer tokens.
- Use local environment variables or a private deployment secret store.
- Keep Postgres volumes and backups outside the public website repo.

You will independently configure:

- Live KSA Eurobond bid/ask/yield feeds
- Live CDS spreads
- Bloomberg, LSEG, ICE, Markit, or similar licensed data feeds

The website integration does not require those feeds to be present.

## Suggested Local Smoke Test

From the dashboard repo:

```bash
docker compose up --build
curl -f http://localhost:3000/api/health
curl -I http://localhost:3000/
```

From any browser after Access is configured:

```text
https://ksa-credit.ramiefathy.com/
```

Expected:

- Incognito or unauthorized user sees a Cloudflare Access block/login flow.
- Authorized user sees the dashboard.
- `ramiefathy.com/apps` links out to `https://ksa-credit.ramiefathy.com/`.

## Verification Commands

```bash
curl -I https://ramiefathy.com/apps
curl -I https://ksa-credit.ramiefathy.com/
```

Expected:

- `ramiefathy.com/apps` returns `200`.
- `ksa-credit.ramiefathy.com` returns Cloudflare Access behavior until authenticated, not the raw origin.

## Cost Controls

- Use the existing Cloudflare account and free Cloudflare Access/Tunnel capabilities only.
- Do not provision managed Postgres, paid Workers, paid R2, paid Logpush, paid Argo, or paid market-data services for this integration.
- Do not store licensed market data in the public website repository.
- If a future production deployment needs paid infrastructure, make that a separate explicit approval step.
