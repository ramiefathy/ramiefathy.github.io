import { expect, test } from '@playwright/test'
import { captureDownload } from './helpers/downloads.js'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('Biologic Monitoring Dashboard (functional)', () => {
  test.use({ acceptDownloads: true })

  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('quick search filters results and reset restores baseline', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/biologic-monitoring-dashboard/index.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()

    const cards = page.locator('#results article.entry-card')
    const initialCount = await cards.count()
    expect(initialCount).toBeGreaterThan(0)

    const firstHeading = (await cards.first().locator('h2').innerText()).trim()
    const firstToken = firstHeading.split(/\s+/)[0]?.trim() || ''
    expect(firstToken.length).toBeGreaterThanOrEqual(2)
    const escapedToken = firstToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const tokenPattern = new RegExp(escapedToken, 'i')

    await page.fill('#search-input', firstToken)
    if (initialCount > 1) {
      await expect.poll(async () => cards.count(), { timeout: 10_000 }).toBeLessThan(initialCount)
    }

    const filteredCount = await cards.count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
    await expect(page.locator('#results')).toContainText(tokenPattern, { timeout: 10_000 })

    await page.click('#reset-filters')
    await expect.poll(async () => cards.count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(initialCount)

    runtime.assertClean()
  })

  test('category toggles and view switch work, and CSV export downloads', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/biologic-monitoring-dashboard/index.html', { waitUntil: 'networkidle' })

    const cards = page.locator('#results article.entry-card')
    const baselineCount = await cards.count()
    expect(baselineCount).toBeGreaterThan(0)

    const conventionalButton = page.locator('.category-btn[data-category="Conventional"]')
    await expect(conventionalButton).toBeVisible()
    await expect(conventionalButton).toHaveClass(/is-active/)
    await conventionalButton.click()
    await expect(conventionalButton).not.toHaveClass(/is-active/)
    await conventionalButton.click()
    await expect(conventionalButton).toHaveClass(/is-active/)

    await page.click('#view-toggle')
    await expect(page.locator('body')).toHaveAttribute('data-view', 'table')
    await expect(page.locator('table.entry-table')).toBeVisible()

    await captureDownload(
      page,
      async () => {
        await page.click('#export-csv')
      },
      {
        expectedFilename: /biologic-monitoring-dashboard\.csv$/i,
        minBytes: 50,
        textMustContain: '"Name","Category"'
      }
    )

    runtime.assertClean()
  })

  test('renders a shared empty state when filters produce no results', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/biologic-monitoring-dashboard/index.html', { waitUntil: 'networkidle' })
    await page.fill('#search-input', 'zzzzzz-not-a-real-regimen')
    await page.waitForTimeout(250)
    await expect(page.locator('#results .cl-empty-state')).toBeVisible()
    await expect(page.locator('#results .cl-empty-state__help')).toHaveCount(1)
    runtime.assertClean()
  })

  test('favorite control is icon-sized and clearly labeled (no oversized "Save" text)', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/biologic-monitoring-dashboard/index.html', { waitUntil: 'networkidle' })

    const favoriteBtn = page.locator('.favorite-btn').first()
    await expect(favoriteBtn).toBeVisible()
    await expect(favoriteBtn).toHaveAttribute('aria-label', /favorite/i)
    await expect(favoriteBtn).toHaveAttribute('title', /favorite/i)

    // The button should be icon-only (or icon-first) rather than cramped visible text like "Save".
    const iconWrapper = favoriteBtn.locator('.icon-btn__icon')
    await expect(iconWrapper).toHaveCount(1)
    await expect(iconWrapper).toHaveText('')
    await expect(favoriteBtn.locator('svg')).toHaveCount(1)

    const dimensions = await favoriteBtn.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return { width: Math.round(rect.width), height: Math.round(rect.height) }
    })
    expect(dimensions.width).toBeGreaterThanOrEqual(32)
    expect(dimensions.height).toBeGreaterThanOrEqual(32)

    runtime.assertClean()
  })
})
