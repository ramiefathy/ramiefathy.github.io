import { test, expect } from '@playwright/test'

test.describe('Diloti app', () => {
  test('should expose the app from the portfolio apps gallery', async ({ page }) => {
    await page.goto('/apps')
    await page.waitForLoadState('networkidle')

    const dilotiLink = page.locator('a[href="/apps/diloti/"]')
    await expect(dilotiLink).toHaveCount(1)
    await expect(dilotiLink).toContainText('Diloti')
  })

  test('should serve the interactive guide at the canonical site route', async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    const response = await page.goto('/apps/diloti/')
    await page.waitForLoadState('networkidle')

    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle('Diloti Table Guide')
    await expect(page.getByRole('heading', { name: 'Diloti', exact: true })).toBeVisible()
    await expect(page.locator('#dealTable .card')).not.toHaveCount(0)
    await page.locator('#zLaunchBtn').click()
    await expect(page.getByRole('dialog', { name: 'Diloti game' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Diloti game' })).toBeHidden()

    expect(pageErrors, 'browser page errors').toEqual([])
    expect(consoleErrors, 'browser console errors').toEqual([])
  })
})
