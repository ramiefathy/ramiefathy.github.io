import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-immune-atlas/'

test.describe('Rheum–Derm Immune Atlas', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 390, height: 844 })
    await blockExternalRequests(page)
  })

  test('is listed in the public app catalog', async ({ page }) => {
    await page.goto('/apps', { waitUntil: 'domcontentloaded' })

    const app = page.getByRole('link', { name: /Rheum–Derm Immune Atlas/i })
    await expect(app).toBeVisible()
    await expect(app).toHaveAttribute('href', APP_ROUTE)
  })

  test('loads the self-contained atlas and preserves core interactions', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rheum–Derm Immune Atlas')
    await expect(page.getByRole('toolbar', { name: 'Page tools' })).toBeVisible()
    await expect(page.locator('.tab-btn')).toHaveCount(9)

    await page.getByRole('button', { name: 'Conditions', exact: true }).click()
    await expect(page.locator('#conditions')).toHaveClass(/active/)
    await expect(page.locator('#conditionArticle h2')).toBeVisible()

    await page.getByRole('button', { name: 'Teaching lab', exact: true }).click()
    await page.getByRole('button', { name: 'Start 10-question quiz' }).click()
    await expect(page.locator('#quizQuestion')).not.toBeEmpty()

    runtime.assertClean()
  })
})
