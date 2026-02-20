import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('Dermatology Scribe landing (UI-only functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1365, height: 900 })
    await blockExternalRequests(page)
  })

  test('landing loads without injected overlays and preserves mode-first hierarchy', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1_500)

    await expect(page.locator('#landingPage')).toBeVisible()
    await expect(page.locator('#ramieCommandInput')).toBeVisible()
    await expect(page.getByText('Skip to notes')).toHaveCount(0)
    await expect(page.getByText('Skip to controls')).toHaveCount(0)
    await expect(page.locator('.quick-actions-bar')).toHaveCount(0)
    await expect(page.locator('.theme-toggle-button')).toHaveCount(0)
    await expect(page.locator('.focus-mode-controls')).toHaveCount(0)

    const hierarchy = await page.evaluate(() => {
      const modeGrid = document.querySelector('.ramie-quick-actions')
      const connectionSettings = document.querySelector('#connectionSettings')
      if (!modeGrid || !connectionSettings) return null
      const pos = modeGrid.compareDocumentPosition(connectionSettings)
      return Boolean(pos & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(hierarchy).toBe(true)

    // Hover-only animation budget: there should be no running animations on load.
    // Use no-preference here so we catch accidental default motion.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const running = await page.evaluate(() => document.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)
    expect(running).toBe(0)

    runtime.assertClean()
  })

  test('mode cards navigate into chat/transcription/sessions surfaces (offline-safe)', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })

    await page.click('#startChatModeCard')
    await expect(page.locator('#mainApp')).toBeVisible()
    await expect(page.locator('#chatView')).toBeVisible()

    await page.click('#backToHomeBtn')
    await expect(page.locator('#landingPage')).toBeVisible()

    await page.click('#startTranscriptionModeCard')
    await expect(page.locator('#transcriptionView')).toBeVisible()

    await page.click('#backToHomeBtn')
    await page.click('#viewSavedSessionsCard')
    await expect(page.locator('#sessionsModal')).toBeVisible()
    await expect(page.locator('#sessionsModal')).toContainText('Saved Sessions')
    await page.click('#sessionsModal [data-action="close-modal"]')
    await expect(page.locator('#sessionsModal')).toHaveCount(0)

    runtime.assertClean()
  })
})
