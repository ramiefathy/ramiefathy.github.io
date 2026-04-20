import { test } from '@playwright/test'
import path from 'node:path'

/**
 * Phase 7 final screenshot pass — captures production-served pages at desktop + mobile
 * for visual diff against pre-Phase-7 baseline. Disabled by default; enable with
 *
 *   PHASE7_SCREENSHOTS=1 npx playwright test phase7-screenshots.spec.ts
 *
 * Outputs to site/test-results/phase7/<runId>/.
 */
const ENABLED = process.env.PHASE7_SCREENSHOTS === '1'

const ROUTES = [
  '/', '/about', '/apps', '/research', '/research/dermoscopy-llm-dashboard',
  '/blog', '/contact', '/legacy', '/apps/mindmaps/alopecia',
  '/apps/MindMaps/CTCL/CTCLMindMaps.html'
]

test.describe('Phase 7 final screenshots', () => {
  test.skip(!ENABLED, 'opt-in via PHASE7_SCREENSHOTS=1')
  const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outRoot = path.join('test-results', 'phase7', runId)

  for (const route of ROUTES) {
    test(`desktop · ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(800)
      const slug = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
      await page.screenshot({ path: path.join(outRoot, `desktop-${slug}.png`), fullPage: true })
    })

    test(`mobile · ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(800)
      const slug = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
      await page.screenshot({ path: path.join(outRoot, `mobile-${slug}.png`), fullPage: true })
    })
  }
})
