import { expect, test } from '@playwright/test'
import { getAstroRoutes, getLegacyHtmlApps, getNotFoundRoute } from './inventory.js'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const legacyApps = getLegacyHtmlApps()
const astroRoutes = getAstroRoutes()
const notFoundRoute = getNotFoundRoute()

test.describe('inventory surface integrity (inventory-driven)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page)
    await blockExternalRequests(page)
  })

  for (const route of astroRoutes) {
    test(`Astro route renders: ${route}`, async ({ page }) => {
      const runtime = watchRuntime(page)
      // Some Astro routes (notably `/`) include iframes and other long-lived
      // network activity that can prevent `networkidle` from ever resolving.
      // For surface integrity we prefer deterministic readiness signals:
      // - DOMContentLoaded
      // - main landmark present
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main')).toBeVisible()
      // Give client-side code a moment to surface runtime errors.
      await page.waitForTimeout(250)
      runtime.assertClean()
    })
  }

  test(`Special route renders: ${notFoundRoute}`, async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(notFoundRoute, { waitUntil: 'networkidle' })
    await expect(page.locator('main')).toBeVisible()
    runtime.assertClean()
  })

  for (const entry of legacyApps) {
    test(`Legacy app renders: ${entry.route}`, async ({ page }) => {
      const runtime = watchRuntime(page)
      await page.goto(entry.route, { waitUntil: 'networkidle' })

      if (entry.redirectTo) {
        // Redirect entries should land on the mapped canonical route.
        await expect(page).toHaveURL(new RegExp(entry.redirectTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      } else {
        // Assert shell presence via its accessible toolbar landmark rather than a
        // specific wrapper class. This keeps the check robust even if a page
        // inlines shell markup or the wrapper structure changes.
        await expect(page.getByRole('toolbar', { name: 'Page tools' })).toBeVisible()
      }

      runtime.assertClean()
    })
  }
})
