import { expect, test, type Page } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

async function waitForSelectOptions(selector: string, page: Page): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null
      if (!el) return false
      return el.options.length > 1
    },
    selector,
    { timeout: 30_000 }
  )
}

test.describe('Dermatopathology Differentials (functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('defaults to primary tabs only and hides favorites badge at zero', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-differentials.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()

    // Sidebar controls should not be so large that placeholders/values truncate
    // within the fixed-width sidebar at desktop sizes.
    const controlFontSizes = await page.evaluate(() => {
      const search = document.querySelector('#finding-search-input') as HTMLInputElement | null
      const select = document.querySelector('#finding-selector') as HTMLSelectElement | null
      if (!search || !select) return null
      const searchSize = parseFloat(getComputedStyle(search).fontSize)
      const selectSize = parseFloat(getComputedStyle(select).fontSize)
      return { searchSize, selectSize }
    })
    expect(controlFontSizes).not.toBeNull()
    expect(controlFontSizes!.searchSize).toBeLessThanOrEqual(14.5)
    expect(controlFontSizes!.selectSize).toBeLessThanOrEqual(14.5)

    const visibleTabs = page.locator('#tab-nav [role="tab"]:visible')
    await expect(visibleTabs).toHaveCount(4)
    await expect(page.locator('#tab-nav [role="tab"][data-tier="advanced"]:visible')).toHaveCount(0)
    await expect(page.locator('#favorites-count')).toHaveCount(0)

    runtime.assertClean()
  })

  test('selecting a finding renders list content and favorites badge toggles', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-differentials.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()

    await waitForSelectOptions('#finding-selector', page)
    const select = page.locator('#finding-selector')
    const optionValues = await select.locator('option').evaluateAll((options) =>
      options.map((opt) => (opt as HTMLOptionElement).value).filter(Boolean)
    )
    expect(optionValues.length).toBeGreaterThan(0)
    await select.selectOption(optionValues[0])

    // After a selection, list view should render one or more diagnosis cards.
    const diagnosisCards = page.locator('.diagnosis-card')
    const diagnosisCount = await diagnosisCards.count()
    expect(diagnosisCount).toBeGreaterThan(0)

    const firstFavoriteButton = diagnosisCards.first().locator('button[data-action="favorite"]')
    await expect(firstFavoriteButton).toHaveCount(1)
    await firstFavoriteButton.click()
    await expect(page.locator('#favorites-count')).toHaveCount(1)

    // Toggle off should remove the badge entirely.
    await firstFavoriteButton.click()
    await expect(page.locator('#favorites-count')).toHaveCount(0)

    runtime.assertClean()
  })

  test('exports selected finding to PDF without bare module import failures', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-differentials.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()

    await waitForSelectOptions('#finding-selector', page)
    const select = page.locator('#finding-selector')
    const firstFinding = await select.locator('option').evaluateAll((options) =>
      options.map((opt) => (opt as HTMLOptionElement).value).filter(Boolean)[0]
    )
    expect(firstFinding).toBeTruthy()
    await select.selectOption(firstFinding)
    await expect(page.locator('.diagnosis-card').first()).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.locator('#export-pdf-btn').click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/_DDx\.pdf$/)
    runtime.assertClean()
  })
})
