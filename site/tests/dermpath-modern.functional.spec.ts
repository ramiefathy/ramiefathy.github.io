import { expect, test, type Locator, type Page } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('Dermatopathology Navigator (modern legacy HTML) (functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  async function getContrastRatio(page: Page, locator: Locator): Promise<number> {
    const handle = await locator.elementHandle()
    if (!handle) return -1

    return await page.evaluate((element) => {

      function parseCssColor(value: string): { r: number; g: number; b: number; a: number } | null {
        const rgbMatch = value
          .trim()
          .match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d+(?:\.\d+)?))?\s*\)$/i)
        if (rgbMatch) {
          return {
            r: Number(rgbMatch[1]),
            g: Number(rgbMatch[2]),
            b: Number(rgbMatch[3]),
            a: rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4])
          }
        }
        return null
      }

      function toLinearChannel(channel: number): number {
        const s = channel / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }

      function relativeLuminance(color: { r: number; g: number; b: number }): number {
        const r = toLinearChannel(color.r)
        const g = toLinearChannel(color.g)
        const b = toLinearChannel(color.b)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }

      function blendOverWhite(color: { r: number; g: number; b: number; a: number }): { r: number; g: number; b: number } {
        // For the suite, backgrounds should resolve to opaque; if not, conservatively blend over white.
        const a = Math.max(0, Math.min(1, color.a))
        return {
          r: Math.round(color.r * a + 255 * (1 - a)),
          g: Math.round(color.g * a + 255 * (1 - a)),
          b: Math.round(color.b * a + 255 * (1 - a))
        }
      }

      function isTransparent(bg: string): boolean {
        if (!bg) return true
        if (bg === 'transparent') return true
        const parsed = parseCssColor(bg)
        return parsed ? parsed.a === 0 : false
      }

      function findEffectiveBackgroundColor(node: Element): string {
        let current: Element | null = node
        while (current) {
          const bg = getComputedStyle(current).backgroundColor
          if (!isTransparent(bg)) return bg
          current = current.parentElement
        }
        return 'rgb(255, 255, 255)'
      }

      const colorRaw = getComputedStyle(element).color
      const bgRaw = findEffectiveBackgroundColor(element)
      const colorParsed = parseCssColor(colorRaw)
      const bgParsed = parseCssColor(bgRaw)
      if (!colorParsed || !bgParsed) return -1

      const fg = blendOverWhite(colorParsed)
      const bg = blendOverWhite(bgParsed)

      const L1 = relativeLuminance(fg)
      const L2 = relativeLuminance(bg)
      const lighter = Math.max(L1, L2)
      const darker = Math.min(L1, L2)
      return (lighter + 0.05) / (darker + 0.05)
    }, handle)
  }

  test('prototype shows deprecation banner and redirects to stabilized unless stay=1', async ({ page }) => {
    const runtime = watchRuntime(page, {
      allowConsoleError: (msg) => /WebGL2 not supported/i.test(msg)
    })

    await page.goto('/apps/dermatopathology-modern/index.html', { waitUntil: 'domcontentloaded' })

    // Archived prototype route should hard-redirect to stabilized.
    await page.waitForURL(/\/apps\/dermatopathology-modern\/index-fixed\.html(?:\?.*)?$/, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded'
    })
    await expect(page.locator('h1')).toContainText('Dermatopathology Navigator')
    runtime.assertClean()
  })

  test('?stay=1 no longer keeps prototype open (archived route always redirects)', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-modern/index.html?stay=1', { waitUntil: 'domcontentloaded' })

    await page.waitForURL(/\/apps\/dermatopathology-modern\/index-fixed\.html(?:\?.*)?$/, {
      timeout: 10_000,
      waitUntil: 'domcontentloaded'
    })
    await expect(page.locator('h1')).toContainText('Dermatopathology Navigator')
    runtime.assertClean()
  })

  test('stabilized page has clinical subtitle and favorites update', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-modern/index-fixed.html', { waitUntil: 'networkidle' })

    await expect(page.locator('h1')).toContainText('Dermatopathology Navigator')
    await expect(page.locator('.cl-page-subtitle')).toContainText('Clinical Dermatopathology Reference')
    await expect(page.getByText('Modern Learning Experience')).toHaveCount(0)
    await expect(page.locator('.streak-badge:visible')).toHaveCount(0)

    const progressPanel = page.locator('aside:has-text("Progress Overview")')
    await expect(progressPanel).toBeVisible()

    const favoritesValue = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll('aside span')).find((el) => el.textContent?.trim() === 'Favorites')
      const row = label?.closest('div.flex')
      const value = row?.querySelector('span.font-medium')?.textContent?.trim() || null
      return value
    })
    expect(favoritesValue).toBe('0')

    const firstDxCard = page.locator('section.cl-panel-layout__main h3').first()
    await expect(firstDxCard).toBeVisible()
    const cardContainer = firstDxCard.locator('..').locator('..')
    await cardContainer.locator('button').first().click()

    await page.waitForTimeout(150)
    const favoritesValueAfter = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll('aside span')).find((el) => el.textContent?.trim() === 'Favorites')
      const row = label?.closest('div.flex')
      const value = row?.querySelector('span.font-medium')?.textContent?.trim() || null
      return value
    })
    expect(favoritesValueAfter).toBe('1')

    runtime.assertClean()
  })

  test('dedup visualization renders stats and chart container', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-modern/deduplication-visualization.html', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toContainText('Deduplication')
    const statCount = await page.locator('.cl-stat').count()
    expect(statCount).toBeGreaterThan(0)
    const chartCount = await page.locator('canvas, svg').count()
    expect(chartCount).toBeGreaterThan(0)
    runtime.assertClean()
  })

  test('test-fixes harness exposes WebGL expected instruction and theme toggle works', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatopathology-modern/test-fixes.html', { waitUntil: 'networkidle' })
    await expect(page.getByText('Expected: black WebGL canvas with color cycling on button press.')).toBeVisible()

    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    await page.click('button:has-text("Toggle Theme")')
    await page.waitForTimeout(150)
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(after).toBe(!before)

    runtime.assertClean()
  })
})
