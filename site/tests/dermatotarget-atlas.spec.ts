import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/dermatotarget-atlas/'

test.describe('DermatoTarget Atlas dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1440, height: 900 })
    await blockExternalRequests(page)
  })

  test('loads from the deployed static app path with bundled data', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await expect(page.locator('h1')).toHaveText('DermatoTarget Atlas')
    await expect(page.getByRole('toolbar', { name: 'Page tools' })).toBeVisible()
    await expect(page.locator('.stat')).toHaveCount(6)
    await expect(page.getByText(/Target.disease pairs/)).toBeVisible()
    await expect(page.getByText('Cached API calls')).toBeVisible()

    runtime.assertClean()
  })

  test('preserves disease context when opening multi-disease shortlist targets', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(`${APP_ROUTE}#/shortlists?c=near_field`, { waitUntil: 'networkidle' })

    const atopicIl2ra = page
      .locator('table.data tbody tr')
      .filter({ hasText: 'Atopic dermatitis' })
      .filter({ hasText: 'IL2RA' })
      .first()

    await expect(atopicIl2ra).toBeVisible()
    await expect(atopicIl2ra.locator('a.gene')).toHaveAttribute('href', '#/target/IL2RA?d=atopic_dermatitis')
    await atopicIl2ra.click()
    await expect(page).toHaveURL(/#\/target\/IL2RA\?d=atopic_dermatitis$/)
    await expect(page.locator('h2', { hasText: /Score decomposition.*Atopic dermatitis/ })).toBeVisible()

    runtime.assertClean()
  })

  test('renders the virtualized drug table and publication assets', async ({ page, request }) => {
    const runtime = watchRuntime(page)
    await page.goto(`${APP_ROUTE}#/drugs`, { waitUntil: 'networkidle' })

    await expect(page.locator('.vrow').first()).toBeVisible()
    await expect.poll(async () => page.locator('.vrow').count()).toBeGreaterThan(0)

    await page.goto(`${APP_ROUTE}#/media`, { waitUntil: 'networkidle' })
    await expect(page.locator('.figure-card')).toHaveCount(10)
    await expect(page.locator('.figure-card img').first()).toHaveJSProperty('complete', true)

    const pdf = await request.get(`${APP_ROUTE}publication_pdf/DermatoTarget_Atlas_publication_package_2026-06-03.pdf`)
    expect(pdf.ok()).toBe(true)
    expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF')

    runtime.assertClean()
  })
})
