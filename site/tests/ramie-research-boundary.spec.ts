import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const route = '/apps/dermatology-scribe/index.html'
const ACK_KEY = 'ramie.research-boundary-ack.v1'

test.describe('RAMIE feature-rich research prototype boundary', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('keeps all major capabilities while displaying the public-demo boundary', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(route, { waitUntil: 'networkidle' })

    const boundary = page.locator('#ramie-research-boundary')
    await expect(boundary).toBeVisible()
    await expect(boundary).toContainText('Research prototype')
    await expect(boundary).toContainText(/public demo not approved for protected health information/i)
    await expect(boundary).toContainText(/configured backend and model provider/i)
    await expect(page.locator('#ramie-destination-value')).toHaveText('Not configured')
    await expect(page.locator('#ramie-boundary-state')).toContainText('Review required before transmission')

    for (const capability of [
      'Start new conversation',
      'Begin transcription',
      'Resume session',
      'Differential Diagnosis',
      'Management Plan',
      'Clinical SOAP Note'
    ]) {
      await expect(page.locator('body')).toContainText(capability)
    }

    runtime.assertClean()
  })

  test('blocks the first transmission-capable action until the user reviews and acknowledges the data flow', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(route, { waitUntil: 'networkidle' })

    await page.locator('#startTranscriptionModeCard').click()
    const dialog = page.locator('#ramie-research-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(/Do not enter protected health information/i)
    await expect(dialog).toContainText('Microphone audio and transcript text')
    await expect(dialog).toContainText(/clinician must verify every output/i)
    await expect(page.locator('#mainApp')).toHaveClass(/hidden/)

    const continueButton = dialog.getByRole('button', { name: 'Acknowledge for this session' })
    await expect(continueButton).toBeDisabled()
    await dialog.getByRole('checkbox').check()
    await expect(continueButton).toBeEnabled()
    await continueButton.click()

    await expect(dialog).toBeHidden()
    expect(await page.evaluate((key) => sessionStorage.getItem(key), ACK_KEY)).toBe('true')
    await expect(page.locator('#ramie-boundary-state')).toContainText('Data flow reviewed for this session')

    runtime.assertClean()
  })

  test('shows only the destination origin, never token or query material', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.addInitScript(() => {
      localStorage.setItem('dermascribe.websocketUrl', 'wss://scribe.example.test/socket?token=must-not-render&tenant=alpha')
      localStorage.setItem('dermascribe.sessionToken', 'super-secret-session-token')
    })
    await page.goto(route, { waitUntil: 'networkidle' })

    await expect(page.locator('#ramie-destination-value')).toHaveText('wss://scribe.example.test')
    await expect(page.locator('body')).not.toContainText('must-not-render')
    await expect(page.locator('body')).not.toContainText('super-secret-session-token')

    await page.getByRole('button', { name: 'Review data flow' }).click()
    await expect(page.locator('#ramie-dialog-destination')).toHaveText('wss://scribe.example.test')
    await expect(page.locator('#ramie-dialog-security')).toContainText(/Encrypted WebSocket transport requested/i)

    runtime.assertClean()
  })

  test('rejects insecure ws transport from an HTTPS page without removing the feature', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dermascribe.websocketUrl', 'ws://insecure.example.test/socket')
      localStorage.setItem('dermascribe.sessionToken', 'placeholder-token')
    })
    await page.goto(route, { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      Object.defineProperty(window.location, 'protocol', { value: 'https:', configurable: true })
    }).catch(() => {})

    await page.locator('#startChatModeCard').click()
    const dialog = page.locator('#ramie-research-dialog')
    await dialog.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: 'Acknowledge for this session' }).click()

    if (await page.evaluate(() => location.protocol === 'https:')) {
      await expect(page.locator('#ramie-research-dialog-error')).toContainText(/Configure wss:\/\//i)
      await expect(dialog).toBeVisible()
    } else {
      await expect(page.locator('#ramie-dialog-security')).toContainText(/controlled local development/i)
    }
  })

  test('requires a new acknowledgment when connection settings change', async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' })

    await page.evaluate(() => {
      window.RamieResearchBoundary.open()
    })
    const dialog = page.locator('#ramie-research-dialog')
    await dialog.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: 'Acknowledge for this session' }).click()
    expect(await page.evaluate(() => window.RamieResearchBoundary.isAcknowledged())).toBe(true)

    await page.locator('#websocketUrlInput').fill('wss://changed.example.test/socket')
    expect(await page.evaluate(() => window.RamieResearchBoundary.isAcknowledged())).toBe(false)
    await expect(page.locator('#ramie-boundary-state')).toContainText('Review required before transmission')
  })
})

declare global {
  interface Window {
    RamieResearchBoundary: {
      isAcknowledged: () => boolean
      clearAcknowledgment: () => void
      getDestination: () => string
      open: () => void
    }
  }
}
