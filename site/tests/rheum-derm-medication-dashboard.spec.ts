import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-medication-dashboard/'

test.describe('Rheum–Derm Therapeutics Field Guide', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1440, height: 1000 })
    await blockExternalRequests(page)
  })

  test('publishes the 60-monograph denominator and opens a complete monograph', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { level: 1, name: 'Cutaneous lupus / SLE' })).toBeVisible()
    await expect(page.getByText('Educational—not patient-specific prescribing.')).toBeVisible()

    await page.getByRole('button', { name: 'Drug index' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Drug index' })).toBeVisible()
    await expect(page.locator('.count-card')).toContainText('60')
    await expect(page.locator('.drug-card')).toHaveCount(60)

    await page.locator('.drug-card').first().click()
    await expect(page.locator('.drawer').getByRole('heading', { level: 2 })).toHaveText('Prednisone / glucocorticoids')
    await expect(page.locator('.drawer').getByRole('heading', { level: 3, name: 'Representative adult dosing' })).toBeVisible()
    await expect(page.locator('.drawer').getByRole('heading', { level: 3, name: 'Avoid / contraindications' })).toBeVisible()

    runtime.assertClean()
  })

  test('keeps navigation and the pipeline view usable at phone width', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await page.getByLabel('Choose condition or view').selectOption('pipeline')
    await expect(page.getByRole('heading', { level: 1, name: 'Near-term pipeline' })).toBeVisible()
    await expect(page.getByText('None of these rows is an approved treatment for the listed indication')).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      body: document.documentElement.scrollWidth
    }))
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)

    runtime.assertClean()
  })
})
