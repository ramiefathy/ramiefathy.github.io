import { test, expect } from '@playwright/test'

test.describe('Dermpath Kodachromes Board Review app', () => {
  test('should expose the app from the portfolio apps gallery', async ({ page }) => {
    await page.goto('/apps')
    await page.waitForLoadState('networkidle')

    const link = page.locator('a[href="/apps/dermpath-kodachromes/"]')
    await expect(link).toHaveCount(1)
    await expect(link).toContainText('Dermpath Kodachromes')
  })

  test('should serve the annotation-free deck at /apps/dermpath-kodachromes/ and redirect /apps/dermpath-board-review/', async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    const redirectResp = await page.goto('/apps/dermpath-board-review/')
    expect(redirectResp?.status()).toBe(200)
    await expect(page).toHaveURL(/\/apps\/dermpath-kodachromes\/$/)

    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/Dermpath Kodachromes/)
    await expect(page.locator('#pos')).toHaveText('1/529')

    // Advance to Case 001 blind histology slide
    await page.locator('#nextBtn').click()
    await expect(page.locator('#pos')).toHaveText('2/529')
    await expect(page.locator('.caselbl')).toHaveText('Case 001')

    const imgLoaded = await page.locator('.imgframe img').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)
    expect(imgLoaded).toBe(true)

    // Verify zero annotation boxes, ROI toggles, or labeled slides
    await expect(page.locator('svg.roisvg')).toHaveCount(0)
    await expect(page.locator('[data-action="toggle-regions"]')).toHaveCount(0)
    await expect(page.locator('[data-action="toggle-labels"]')).toHaveCount(0)
    await expect(page.locator('[data-action="toggle-edit-rois"]')).toHaveCount(0)

    // Verify zoom modal opens and closes cleanly via bottom-right Close FAB
    await page.locator('[data-action="open-zoom"]').click()
    await expect(page.locator('#zoomModal')).toHaveClass(/on/)
    await expect(page.locator('#zCloseFab')).toBeVisible()
    await page.locator('#zCloseFab').click()
    await expect(page.locator('#zoomModal')).not.toHaveClass(/on/)

    expect(pageErrors, 'browser page errors').toEqual([])
    expect(consoleErrors, 'browser console errors').toEqual([])
  })
})
