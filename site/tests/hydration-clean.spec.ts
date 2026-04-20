import { expect, test } from '@playwright/test'

/**
 * Hydration cleanliness check (Phase 7C Atlas hardening).
 *
 * Asserts that no React "Invalid hook call" or hydration mismatch warnings
 * fire on key pages. Catches regressions where a future change reintroduces
 * a duplicate React install or a server/client style divergence.
 *
 * Filters out Vite HMR WebSocket errors which are dev-server-only and not
 * a production concern.
 */

const PAGES_TO_CHECK = ['/', '/about', '/research/dermoscopy-llm-dashboard', '/apps/mindmaps/alopecia']

const CRITICAL_PATTERNS: RegExp[] = [
  /Invalid hook call/,
  /An error occurred during hydration/,
  /Hydration failed because/,
  /Text content did not match/,
  /Prop `[^`]+` did not match/,
]

for (const path of PAGES_TO_CHECK) {
  test(`${path} hydrates cleanly (no React warnings)`, async ({ page }) => {
    const offenders: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (CRITICAL_PATTERNS.some((re) => re.test(text))) {
        offenders.push(`[${msg.type()}] ${text}`)
      }
    })
    page.on('pageerror', (err) => {
      const text = err.message
      if (CRITICAL_PATTERNS.some((re) => re.test(text))) {
        offenders.push(`[pageerror] ${text}`)
      }
    })

    await page.goto(path, { waitUntil: 'networkidle' })
    // Wait one tick for any post-hydration warnings
    await page.waitForTimeout(500)

    expect(offenders, `${path} should not surface React hydration warnings:\n${offenders.join('\n')}`).toEqual([])
  })
}
