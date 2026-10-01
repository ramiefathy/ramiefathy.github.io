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

  async function openNavigator(page: Page, hash = ''): Promise<void> {
    await page.goto(`/apps/dermatopathology-modern/index-fixed.html${hash}`, { waitUntil: 'networkidle' })
    await expect(page.getByTestId('dx-network')).toBeVisible()
  }

  test('stabilized page opens on the network view with one node per diagnosis plus the pattern hub', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)

    await expect(page.locator('h1')).toContainText('Dermatopathology Navigator')
    await expect(page.locator('.cl-page-subtitle')).toContainText('Clinical Dermatopathology Reference')
    await expect(page.getByText('Modern Learning Experience')).toHaveCount(0)
    await expect(page.locator('.streak-badge')).toHaveCount(0)

    await expect(page.locator('[data-view="network"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-view="list"]')).toHaveAttribute('aria-pressed', 'false')

    // First pattern in the reference is "Regular acanthosis (Ko)" with three diagnoses.
    await expect(page.getByTestId('finding-title')).toHaveText('Regular acanthosis')
    await expect(page.locator('[data-testid="dx-network"] [data-node="dx"]')).toHaveCount(3)
    await expect(page.locator('[data-testid="dx-network"] [data-node="hub"]')).toHaveCount(1)

    runtime.assertClean()
  })

  test('selecting a network node shows its detail and starring updates the review tally', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)

    await expect(page.getByTestId('review-starred')).toHaveText('0')
    const bowen = page.locator('[data-testid="dx-network"] [data-node="dx"][data-name="Bowen disease"]')
    await bowen.locator('circle.dpn-node__dot').click()

    const detail = page.getByTestId('dx-detail')
    await expect(detail.locator('h3')).toHaveText('Bowen disease')
    await expect(detail).toContainText("'eyeliner' sign")
    await expect(bowen).toHaveAttribute('aria-pressed', 'true')

    await detail.getByRole('button', { name: /star/i }).click()
    await expect(page.getByTestId('review-starred')).toHaveText('1')

    // Keyboard selection works on graph nodes too.
    const psoriasis = page.locator('[data-testid="dx-network"] [data-node="dx"][data-name="Psoriasis"]')
    await psoriasis.focus()
    await page.keyboard.press('Enter')
    await expect(detail.locator('h3')).toHaveText('Psoriasis')

    runtime.assertClean()
  })

  test('diagnoses listed under other patterns link across the reference', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)

    const correlations = page.getByTestId('correlations')
    await expect(correlations).toContainText('Clinical Correlations')
    await correlations.getByRole('button', { name: /Psoriasis/ }).click()

    const detail = page.getByTestId('dx-detail')
    await expect(detail.locator('h3')).toHaveText('Psoriasis')
    const linked = detail.getByTestId('dx-also-in').getByRole('button')
    expect(await linked.count()).toBeGreaterThan(0)

    const target = (await linked.first().getAttribute('data-finding')) || ''
    await linked.first().click()
    await expect(page.getByTestId('finding-title')).not.toHaveText('Regular acanthosis')
    // The diagnosis stays selected after jumping to the linked pattern.
    await expect(detail.locator('h3')).toHaveText(/psoriasis/i)
    expect(decodeURIComponent(new URL(page.url()).hash)).toContain(target)

    runtime.assertClean()
  })

  test('pattern browser filters findings and switches the active pattern', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)

    const browser = page.getByTestId('finding-browser')
    await browser.getByRole('searchbox').fill('spongiosis')
    const options = browser.locator('[data-finding]')
    expect(await options.count()).toBeGreaterThan(0)
    for (const text of await options.allTextContents()) {
      expect(text.toLowerCase()).toContain('spongiosis')
    }

    await options.first().click()
    await expect(page.getByTestId('finding-title')).toContainText(/spongiosis/i)
    await expect(options.first()).toHaveAttribute('aria-current', 'true')

    runtime.assertClean()
  })

  test('command palette finds a diagnosis and opens it in its pattern', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)

    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: /search/i })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('combobox').fill('Trichilemmoma')
    await expect(dialog.getByRole('option').first()).toContainText('Trichilemmoma')
    await page.keyboard.press('Enter')

    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('dx-detail').locator('h3')).toHaveText(/Trichilemmoma/i)

    await page.keyboard.press('Control+k')
    await expect(page.getByRole('dialog', { name: /search/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /search/i })).toHaveCount(0)

    runtime.assertClean()
  })

  test('list and flashcard views render the same diagnoses', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)

    await page.locator('[data-view="list"]').click()
    await expect(page.locator('[data-testid="dx-list"] article')).toHaveCount(3)

    await page.locator('[data-view="flashcards"]').click()
    const deck = page.getByTestId('flashcards')
    await expect(deck).toContainText('1 / 3')
    await deck.getByRole('button', { name: /reveal/i }).click()
    await expect(page.getByTestId('review-revealed')).toHaveText('1 / 3')
    await deck.getByRole('button', { name: /next/i }).click()
    await expect(deck).toContainText('2 / 3')

    runtime.assertClean()
  })

  test('deep link restores pattern and diagnosis; mobile layout has no horizontal overflow', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await openNavigator(page, '#f=' + encodeURIComponent('Lobular proliferation (Ko)') + '&dx=' + encodeURIComponent('Poroma'))

    await expect(page.getByTestId('finding-title')).toHaveText('Lobular proliferation')
    await expect(page.getByTestId('dx-detail').locator('h3')).toHaveText('Poroma')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    runtime.assertClean()
  })

  test('a single-finger vertical swipe over the network scrolls the page on touch devices', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    const page = await context.newPage()
    await blockExternalRequests(page)
    const runtime = watchRuntime(page)
    await openNavigator(page, '#f=' + encodeURIComponent('Vesicles/Bullae (Comprehensive DDx)'))

    const svg = page.getByTestId('dx-network')
    await svg.scrollIntoViewIfNeeded()
    const box = await svg.boundingBox()
    if (!box) throw new Error('network svg has no bounding box')
    const before = await page.evaluate(() => window.scrollY)

    const cdp = await context.newCDPSession(page)
    const x = Math.round(box.x + box.width / 2)
    const startY = Math.round(box.y + box.height * 0.8)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] })
    for (let step = 1; step <= 10; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: startY - step * 30 }] })
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(300)

    const after = await page.evaluate(() => window.scrollY)
    expect(after - before).toBeGreaterThan(100)
    runtime.assertClean()
    await context.close()
  })

  test('list view lets keyboard users select a diagnosis and open its note editor', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page)
    await page.locator('[data-view="list"]').click()

    const select = page.getByTestId('dx-list').getByRole('button', { name: 'Bowen disease', exact: true })
    await select.focus()
    await expect(select).toBeFocused()
    await page.keyboard.press('Enter')

    const detail = page.getByTestId('dx-detail')
    await expect(detail.locator('h3')).toHaveText('Bowen disease')
    await expect(select).toHaveAttribute('aria-pressed', 'true')
    await detail.getByRole('button', { name: 'Add note' }).focus()
    await page.keyboard.press('Enter')
    await expect(detail.getByRole('textbox', { name: /note for bowen disease/i })).toBeFocused()

    runtime.assertClean()
  })

  for (const width of [320, 390, 1280]) {
    test(`every network label of a 31-diagnosis differential stays inside the graph at ${width}px`, async ({ page }) => {
      const runtime = watchRuntime(page)
      await page.setViewportSize({ width, height: 900 })
      await openNavigator(page, '#f=' + encodeURIComponent('Vesicles/Bullae (Comprehensive DDx)'))
      await expect(page.locator('[data-testid="dx-network"] [data-node="dx"]')).toHaveCount(31)

      const clipped = await page.evaluate(() => {
        const svg = document.querySelector('[data-testid="dx-network"]')
        if (!svg) return ['missing svg']
        const frame = svg.getBoundingClientRect()
        return Array.from(svg.querySelectorAll('.dpn-node__label'))
          .filter((label) => {
            const r = label.getBoundingClientRect()
            return r.left < frame.left - 1 || r.right > frame.right + 1 || r.top < frame.top - 1 || r.bottom > frame.bottom + 1
          })
          .map((label) => label.textContent)
      })
      expect(clipped).toEqual([])
      runtime.assertClean()
    })
  }

  const VESICLES = '#f=' + encodeURIComponent('Vesicles/Bullae (Comprehensive DDx)')
  const LONG_DX = 'Subcorneal pustular dermatosis (Sneddon-Wilkinson)'

  test('the network readout shows the complete name of the focused, hovered or selected diagnosis', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page, VESICLES)
    const readout = page.getByTestId('network-readout')
    await expect(readout).toContainText(/select a diagnosis/i)

    const node = page.locator(`[data-testid="dx-network"] [data-node="dx"][data-name="${LONG_DX}"]`)
    // The ring label is abbreviated; the readout must not be.
    await expect(node.locator('.dpn-node__label')).toHaveText(/…$/)

    await node.focus()
    await expect(readout).toContainText(LONG_DX)
    await expect(readout).toContainText(/also listed in \d+ other patterns?|only listed here in this reference/i)

    await page.locator('[data-testid="dx-network"] [data-node="dx"][data-name="Bullous pemphigoid"] circle.dpn-node__dot').click()
    await page.mouse.move(2, 2)
    await page.locator('h1').click()
    await expect(readout).toContainText('Bullous pemphigoid')
    await expect(readout).toContainText(/selected/i)

    runtime.assertClean()
  })

  test('readout text stays at a readable size when the dense graph is scaled down on a narrow phone', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 320, height: 800 })
    await openNavigator(page, VESICLES)
    const name = page.getByTestId('network-readout').locator('[data-readout-name]')
    const size = await name.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size).toBeGreaterThanOrEqual(16)
    runtime.assertClean()
  })

  test('expanded network mode hides side panels, keeps details in a drawer and exits with Escape', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page, VESICLES)
    const svg = page.getByTestId('dx-network')
    const before = (await svg.boundingBox())?.width ?? 0
    const truncatedBefore = await page.locator('.dpn-node__label', { hasText: '…' }).count()

    const toggle = page.getByRole('button', { name: /expand network/i })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    // Toolbar icons must not stretch and push the label outside its button.
    expect(await toggle.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
    await toggle.click()
    await expect(page.getByRole('button', { name: /exit expanded network/i })).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByTestId('finding-browser')).toBeHidden()
    await expect(page.getByTestId('correlations')).toBeHidden()
    await expect.poll(async () => (await svg.boundingBox())?.width ?? 0).toBeGreaterThan(before + 150)
    expect(await page.locator('.dpn-node__label', { hasText: '…' }).count()).toBeLessThan(truncatedBefore)

    await page.locator(`[data-testid="dx-network"] [data-node="dx"][data-name="${LONG_DX}"] circle.dpn-node__dot`).click()
    await expect(page.getByTestId('dx-detail').locator('h3')).toHaveText(LONG_DX)
    await expect(page.getByTestId('dx-detail')).toBeInViewport()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('finding-browser')).toBeVisible()
    await expect(page.getByTestId('correlations')).toBeVisible()
    await expect(page.getByRole('button', { name: /expand network/i })).toHaveAttribute('aria-pressed', 'false')

    runtime.assertClean()
  })

  test('on phones a full-name diagnosis list and the details sit directly under the network, synced both ways', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await openNavigator(page, VESICLES)

    const strip = page.getByTestId('dx-strip')
    await expect(strip).toBeVisible()
    await expect(strip.getByRole('button')).toHaveCount(31)
    await expect(strip.getByRole('button', { name: LONG_DX, exact: true })).toBeVisible()

    // List -> graph
    await strip.getByRole('button', { name: 'Pemphigus vulgaris', exact: true }).click()
    await expect(page.locator('[data-testid="dx-network"] [data-node="dx"][data-name="Pemphigus vulgaris"]')).toHaveAttribute('aria-pressed', 'true')
    const detail = page.getByTestId('dx-detail')
    await expect(detail.locator('h3')).toHaveText('Pemphigus vulgaris')
    // Details live inside the network stage, not at the bottom of the page.
    expect(await page.locator('.dpn-stage [data-testid="dx-detail"]').count()).toBe(1)
    await expect(page.getByRole('button', { name: /expand network/i })).toHaveCount(0)

    // Graph -> list
    await page.locator('[data-testid="dx-network"] [data-node="dx"][data-name="Bullous pemphigoid"] circle.dpn-node__dot').click()
    await expect(strip.getByRole('button', { name: 'Bullous pemphigoid', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(detail.locator('h3')).toHaveText('Bullous pemphigoid')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    runtime.assertClean()
  })

  for (const width of [390, 1280]) {
    test(`tap targets on the dense 31-diagnosis ring never overlap a neighbour at ${width}px`, async ({ page }) => {
      const runtime = watchRuntime(page)
      await page.setViewportSize({ width, height: 900 })
      await openNavigator(page, VESICLES)
      const overlaps = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('[data-testid="dx-network"] [data-node="dx"]')).map((g) => {
          const m = (g.getAttribute('transform') || '').match(/translate\(([-\d.]+),([-\d.]+)\)/)
          const hit = Math.max(...Array.from(g.querySelectorAll('circle')).filter((c) => !c.classList.contains('dpn-node__ring')).map((c) => Number(c.getAttribute('r'))))
          return { name: g.getAttribute('data-name'), x: Number(m?.[1]), y: Number(m?.[2]), hit }
        })
        const bad: string[] = []
        nodes.forEach((a, i) => {
          const b = nodes[(i + 1) % nodes.length]
          if (Math.hypot(a.x - b.x, a.y - b.y) < a.hit + b.hit - 0.01) bad.push(`${a.name} / ${b.name}`)
        })
        return bad
      })
      expect(overlaps).toEqual([])
      runtime.assertClean()
    })
  }

  test('desktop keeps details in the inspector and shows no phone diagnosis list', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNavigator(page, VESICLES)
    await expect(page.getByTestId('dx-strip')).toHaveCount(0)
    expect(await page.locator('.dpn-inspector [data-testid="dx-detail-empty"]').count()).toBe(1)
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
