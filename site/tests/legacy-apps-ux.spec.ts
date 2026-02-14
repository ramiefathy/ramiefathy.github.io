import { expect, test } from '@playwright/test'
import { getLegacyHtmlAppRoutes } from './inventory.js'

const interactivePages = getLegacyHtmlAppRoutes()

test.describe('legacy app UX modernization baseline', () => {
  for (const path of interactivePages) {
    test(`${path} renders legacy shell and keyboard focus affordances`, async ({ page }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      const requestFailures: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('requestfailed', (request) => {
        const url = request.url()
        if (url.startsWith('http://127.0.0.1:4321/')) {
          requestFailures.push(`${request.method()} ${url} :: ${request.failure()?.errorText || 'unknown'}`)
        }
      })

      await page.goto(path, { waitUntil: 'networkidle' })
      await expect(page.locator('.legacy-shell')).toBeVisible()
      await expect(page.locator('.legacy-shell__action[data-action="help"]')).toBeVisible()

      await page.keyboard.press('Tab')
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() || '')
      expect(focusedTag.length).toBeGreaterThan(0)

      expect(consoleErrors).toEqual([])
      expect(pageErrors).toEqual([])
      expect(requestFailures).toEqual([])
    })
  }

  test('mindmap search supports next/previous result navigation and details panel', async ({ page }) => {
    await page.goto('/apps/MindMaps/CTCL/CTCLMindMaps.html', { waitUntil: 'networkidle' })
    await page.fill('#search-input', 'treatment')
    await page.waitForTimeout(500)
    await expect(page.locator('#search-next')).toBeVisible()
    await expect(page.locator('#search-prev')).toBeVisible()
    await page.click('#search-next')
    await expect(page.locator('#selected-node-title')).not.toHaveText('Select a node')
  })

  test('pdf merger shows preflight before merge action', async ({ page }) => {
    await page.goto('/apps/PDF%20Merger.html', { waitUntil: 'networkidle' })
    await expect(page.locator('#preflight-summary')).toBeVisible()
    await expect(page.locator('#preflight-summary')).toContainText('Choose at least')
  })

  test('scribe surfaces autosave recovery banner confidence', async ({ page }) => {
    await page.addInitScript(() => {
      const snapshot = JSON.stringify({
        id: 991,
        type: 'autosave',
        timestamp: new Date().toISOString(),
        transcript: 'Recovered transcript text'
      })
      localStorage.setItem('legacy_recovery_seed', snapshot)
    })
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })
    await expect(page.locator('#recovery-banner')).toBeVisible()
    await expect(page.locator('#recovery-banner')).toContainText('Recovered from')
  })

  test('scribe default theme uses shared legacy background tokens', async ({ page }) => {
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })
    const backgroundColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(backgroundColor).toBe('rgb(240, 253, 250)')
  })
})
