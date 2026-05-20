import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('Scribe UI enhancements harness (functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('harness identity label exists and command palette opens via Ctrl/Cmd+K', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatology-scribe/test-ui-enhancements.html', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { level: 1, name: 'UI Enhancements Demo' })).toBeVisible()
    await expect(page.getByText('Internal test harness for UI enhancement features.')).toBeVisible()

    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.down(modifier)
    await page.keyboard.press('k')
    await page.keyboard.up(modifier)
    await expect(page.locator('.command-palette-overlay')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.command-palette-overlay')).toHaveCount(0)

    runtime.assertClean()
  })
})
