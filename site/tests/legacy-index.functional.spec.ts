import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('legacy apps index (functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page)
    await blockExternalRequests(page)
  })

  test('shell help dialog renders help steps', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/legacy/index.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()

    await page.click('.legacy-shell__action[data-action="help"]')
    await expect(page.locator('#legacy-shell-help')).toHaveAttribute('aria-hidden', 'false')
    await expect(page.locator('.legacy-shell__help-steps')).toBeVisible()
    await expect(page.locator('.legacy-shell__help-steps')).toContainText('Pick a tool')

    runtime.assertClean()
  })

  test('renders at least one item per category and keeps canonical links', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/legacy/index.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()

    const categories = [
      { label: 'Clinical tools', expectedHeading: 'Clinical' },
      { label: 'Mind maps', expectedHeading: 'Mind maps' },
      { label: 'PDF utilities', expectedHeading: 'PDF utilities' },
      { label: 'Dermatopathology', expectedHeading: 'Dermatopathology' },
      { label: 'External apps', expectedHeading: 'External' }
    ]

    for (const category of categories) {
      const section = page.locator(`section.apps-section[aria-label="${category.label}"]`)
      await expect(section, `Missing section ${category.label}`).toHaveCount(1)
      await expect(section.locator('h2')).toContainText(category.expectedHeading)
      const itemCount = await section.locator('article.apps-item').count()
      expect(itemCount, `Expected at least 1 app entry under ${category.label}`).toBeGreaterThan(0)
    }

    const pdfStudioLink = page.getByRole('link', { name: 'Open PDF Studio' })
    await expect(pdfStudioLink).toHaveAttribute('href', '/apps/pdf-studio.html')
    await pdfStudioLink.click()
    await expect(page).toHaveURL(/\/apps\/pdf-studio\.html(?:\?.*)?$/)
    await expect(page.locator('#pdf-studio-nav')).toBeVisible()
    await page.goBack({ waitUntil: 'networkidle' })

    // External apps are links-out (not shipped by this repo).
    const clinisched = page.getByRole('link', { name: 'Open Clinisched' })
    const skinoculars = page.getByRole('link', { name: 'Open Skinoculars' })
    await expect(clinisched).toHaveAttribute('href', 'https://clinisched.ramiefathy.com/')
    await expect(skinoculars).toHaveAttribute('href', 'https://skinoculars.ramiefathy.com/')

    await expect(page.locator('footer')).toContainText('© 2026')
    runtime.assertClean()
  })
})
