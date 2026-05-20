import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('WoundCare archive (functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('shows archive framing and TOC navigates to headings', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/WoundCareWebpages.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-shell')).toBeVisible()
    await expect(page.locator('.cl-archive-banner')).toBeVisible()

    const tocLinks = page.locator('#generated-toc a')
    const linkCount = await tocLinks.count()
    expect(linkCount).toBeGreaterThan(0)

    const firstLink = tocLinks.first()
    const href = await firstLink.getAttribute('href')
    expect(href).toBeTruthy()
    await firstLink.click()

    await page.waitForTimeout(150)
    const hash = await page.evaluate(() => window.location.hash)
    expect(hash.length).toBeGreaterThan(1)

    // Best-effort: the anchor target should be scrolled into view (and not pinned under the shell).
    const inView = await page.evaluate(() => {
      const target = document.querySelector(window.location.hash) as HTMLElement | null
      const shell = document.querySelector('.legacy-shell') as HTMLElement | null
      if (!target || !shell) return false
      const rect = target.getBoundingClientRect()
      const shellRect = shell.getBoundingClientRect()
      return rect.top >= shellRect.bottom
    })
    expect(inView).toBe(true)

    const codeBlockCount = await page.locator('pre code').count()
    expect(codeBlockCount).toBeGreaterThan(0)

    runtime.assertClean()
  })
})
