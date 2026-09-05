import { expect, test, type Page } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-immune-atlas/'

type RGB = { r: number; g: number; b: number; a?: number }

function parseColor(value: string): RGB {
  const match = value.match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+(\d+(?:\.\d+)?))?\)/)
  if (!match) throw new Error(`Unsupported computed color: ${value}`)
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) }
}

function luminance({ r, g, b }: RGB): number {
  const channel = (value: number) => {
    const unit = value / 255
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: RGB, b: RGB): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

async function openAtlas(page: Page, theme: 'light' | 'dark', viewport: { width: number; height: number }) {
  await setDeterministicUi(page, viewport)
  await blockExternalRequests(page)
  await page.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
  await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}

async function hoverHeatCell(page: Page, state: 'mapped' | 'unknown') {
  const cell = await page.evaluate(`(() => {
    const cell = heatCells.find(entry => entry.state === '${state}');
    if (!cell) throw new Error('No ${state} heat cell');
    return { x: cell.x + cell.w / 2, y: cell.y + cell.h / 2 };
  })()`)
  await page.locator('#heatmap').hover({ position: cell as { x: number; y: number } })
  await expect(page.locator('#tooltip')).toHaveClass(/show/)
}

async function openFreeSpace(page: Page, theme: 'light' | 'dark' = 'dark', viewport = { width: 1440, height: 1050 }) {
  await openAtlas(page, theme, viewport)
  if (viewport.width <= 760) await page.locator('#mobileSectionSelect').selectOption('network')
  else await page.locator('.tab-btn[data-tab="network"]').click()
  await page.locator('#freeSpaceTab').click()
    await expect(page.locator('#network3d')).toBeVisible()
}

async function connectedLabelState(page: Page) {
  return page.locator('#networkFocusLabels [data-connected-node-id]').evaluateAll(elements => {
    const canvas = document.querySelector<HTMLCanvasElement>('#network3d')!.getBoundingClientRect()
    return elements.map(element => {
      const rect = element.getBoundingClientRect()
      return {
        id: element.getAttribute('data-connected-node-id')!,
        direction: element.getAttribute('data-direction')!,
        nodeX: Number(element.getAttribute('data-node-x')),
        nodeY: Number(element.getAttribute('data-node-y')),
        left: rect.left - canvas.left,
        top: rect.top - canvas.top,
        right: rect.right - canvas.left,
        bottom: rect.bottom - canvas.top,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      }
    })
  })
}

async function scanVisibleContrast(page: Page) {
  return page.evaluate(() => {
    type Color = { r: number; g: number; b: number; a: number }
    const parse = (value: string): Color | null => {
      const match = value.match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+(\d+(?:\.\d+)?))?\)/)
      return match ? { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) } : null
    }
    const blend = (top: Color, bottom: Color): Color => {
      const alpha = top.a + bottom.a * (1 - top.a)
      if (!alpha) return { r: 0, g: 0, b: 0, a: 0 }
      return {
        r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
        g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
        b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
        a: alpha,
      }
    }
    const effectiveBackground = (element: Element | null): Color => {
      const base = document.documentElement.dataset.theme === 'light' ? { r: 242, g: 240, b: 233, a: 1 } : { r: 16, g: 19, b: 16, a: 1 }
      const chain: Element[] = []
      for (let current = element; current; current = current.parentElement) chain.unshift(current)
      return chain.reduce((background, current) => {
        const parsed = parse(getComputedStyle(current).backgroundColor)
        return parsed && parsed.a ? blend(parsed, background) : background
      }, base)
    }
    const lum = (color: Color) => {
      const channel = (value: number) => {
        const unit = value / 255
        return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
    }
    const ratio = (a: Color, b: Color) => {
      const values = [lum(a), lum(b)].sort((x, y) => y - x)
      return (values[0] + 0.05) / (values[1] + 0.05)
    }
    const visible = (element: HTMLElement | SVGElement) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
    }
    const failures: Array<{ role: string; text: string; ratio: number; required: number; foreground: string; background: string }> = []
    const selectors = 'h1,h2,h3,h4,h5,h6,p,span,small,b,strong,a,button,label,summary,td,th,li,dt,dd,text,.eyebrow,.muted,.panel-sub'
    for (const element of document.querySelectorAll<HTMLElement | SVGElement>(selectors)) {
      if (!visible(element) || element.closest('#tooltip:not(.show)')) continue
      const directText = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent || '').join(' ').replace(/\s+/g, ' ').trim()
      if (!directText) continue
      const style = getComputedStyle(element)
      const rawForeground = element instanceof SVGTextElement ? style.fill : style.color
      const foreground = parse(rawForeground)
      if (!foreground) continue
      const background = effectiveBackground(element)
      const size = Number.parseFloat(style.fontSize)
      const weight = Number.parseInt(style.fontWeight, 10) || 400
      const required = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5
      const actual = ratio(foreground, background)
      if (actual + 0.01 < required) failures.push({ role: element.tagName.toLowerCase(), text: directText.slice(0, 80), ratio: actual, required, foreground: rawForeground, background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})` })
    }
    const boundarySelectors = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[role="tab"],.panel,.table-shell,.network-shell,.network-relation'
    for (const element of document.querySelectorAll<HTMLElement>(boundarySelectors)) {
      if (!visible(element)) continue
      const style = getComputedStyle(element)
      if (style.borderTopStyle === 'none' || Number.parseFloat(style.borderTopWidth) < 1) continue
      const border = parse(style.borderTopColor)
      if (!border) continue
      const adjacent = effectiveBackground(element.parentElement)
      const actual = ratio(border, adjacent)
      if (actual + 0.01 < 3) failures.push({ role: 'boundary', text: (element.getAttribute('aria-label') || element.textContent || element.id).replace(/\s+/g, ' ').trim().slice(0, 80), ratio: actual, required: 3, foreground: style.borderTopColor, background: `rgb(${Math.round(adjacent.r)}, ${Math.round(adjacent.g)}, ${Math.round(adjacent.b)})` })
    }
    return failures
  })
}

test.describe('Atlas contrast and graph interaction contracts', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1050 }]) {
      for (const state of ['mapped', 'unknown'] as const) {
        test(`${theme} ${viewport.width}px real ${state} intensity tooltip is opaque and exceeds its contrast floors`, async ({ page }) => {
          const runtime = watchRuntime(page)
          await openAtlas(page, theme, viewport)
          await hoverHeatCell(page, state)

          const result = await page.locator('#tooltip').evaluate(element => {
            const root = getComputedStyle(element)
            const descendants = [...element.querySelectorAll('*')].filter(child => (child.textContent || '').trim()).map(child => {
              const style = getComputedStyle(child)
              return { tag: child.tagName.toLowerCase(), color: style.color, text: (child.textContent || '').trim() }
            })
            const rect = element.getBoundingClientRect()
            return {
              background: root.backgroundColor,
              border: root.borderTopColor,
              opacity: root.opacity,
              rootColor: root.color,
              descendants,
              rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
              viewport: { width: innerWidth, height: innerHeight },
            }
          })

          expect(result.background).toBe('rgb(23, 27, 23)')
          expect(result.opacity).toBe('1')
          const surface = parseColor(result.background)
          expect(contrast(parseColor(result.rootColor), surface)).toBeGreaterThanOrEqual(7)
          for (const item of result.descendants) {
            const threshold = item.tag === 'small' ? 4.5 : 7
            expect(contrast(parseColor(item.color), surface), `${item.tag}: ${item.text}`).toBeGreaterThanOrEqual(threshold)
          }
          expect(contrast(parseColor(result.border), surface)).toBeGreaterThanOrEqual(3)
          expect(result.rect.left).toBeGreaterThanOrEqual(8)
          expect(result.rect.top).toBeGreaterThanOrEqual(8)
          expect(result.rect.right).toBeLessThanOrEqual(result.viewport.width - 8)
          expect(result.rect.bottom).toBeLessThanOrEqual(result.viewport.height - 8)
          runtime.assertClean()
        })
      }
    }
  }

  test('every heatmap value and condition color has a measured 4.5:1 canvas ink pair in both themes', async ({ page }) => {
    await openAtlas(page, 'dark', { width: 1440, height: 1050 })
    for (const theme of ['dark', 'light'] as const) {
      if (theme === 'light') await page.getByRole('button', { name: 'Toggle theme' }).click()
      const pairs = await page.evaluate(() => {
        const api = (window as any).atlasHeatmapPalette
        if (!api) throw new Error('atlasHeatmapPalette is not exposed')
        return api.auditPairs()
      })
      const conditionCount = await page.evaluate(() => (window as any).__ATLAS_P0__.data.conditions.length)
      expect(pairs).toHaveLength(conditionCount * 5)
      for (const pair of pairs) {
        expect(pair.ratio, `${theme} ${pair.conditionId} value ${pair.value}: ${pair.fill} / ${pair.ink}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  test('graph canvas semantic palette preserves boundaries, labels, focus, and evidence levels in both themes', async ({ page }) => {
    await openFreeSpace(page)
    for (const theme of ['dark', 'light'] as const) {
      if (theme === 'light') await page.getByRole('button', { name: 'Toggle theme' }).click()
      const rows = await page.evaluate(() => (window as any).atlasGraphPalette.audit())
      expect(rows.length).toBeGreaterThan(30)
      for (const row of rows) {
        const minimum = row.minimum || (row.role.startsWith('edge-') ? 3 : 4.5)
        expect(row.ratio, `${theme} ${row.role}: ${row.foreground} / ${row.background}`).toBeGreaterThanOrEqual(minimum)
      }
    }
  })

  for (const theme of ['light', 'dark'] as const) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1050 }]) {
      test(`${theme} ${viewport.width}px Atlas-wide visible DOM and SVG contrast sweep is clean by destination and representation`, async ({ page }) => {
        test.setTimeout(120_000)
        await openAtlas(page, theme, viewport)
        const sections = await page.locator('#mobileSectionSelect option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value))
        const strata: Array<{ stratum: string; failures: Awaited<ReturnType<typeof scanVisibleContrast>> }> = []
        for (const section of sections) {
          await page.evaluate(id => (window as any).gotoTab(id), section)
          await expect(page.locator(`#${section}`)).toHaveClass(/active/)
          const failures = await scanVisibleContrast(page)
          if (failures.length) strata.push({ stratum: `destination:${section}`, failures })
        }
        await page.evaluate(() => (window as any).gotoTab('network'))
        const representations = await page.locator('[data-network-representation]').evaluateAll(buttons => buttons.map(button => ({ id: (button as HTMLElement).dataset.networkRepresentation!, name: button.textContent!.trim() })))
        for (const representation of representations) {
          await page.getByRole('tab', { name: representation.name, exact: true }).click()
          const failures = await scanVisibleContrast(page)
          if (failures.length) strata.push({ stratum: `representation:${representation.id}`, failures })
        }
        expect(strata, JSON.stringify(strata, null, 2)).toEqual([])
      })
    }
  }

  test('condition selection exposes every drawable highlighted neighbor as a stable interactive label', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openFreeSpace(page)
    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))

    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', 'm:psa:Plaque psoriasis')
    const selectedCanvas = page.locator('#network3d')
    const connectedCount = Number(await selectedCanvas.getAttribute('data-connected-node-count'))
    const highlightedCount = Number(await selectedCanvas.getAttribute('data-highlighted-edge-count'))
    expect(connectedCount).toBeGreaterThan(0)
    expect(highlightedCount).toBe(connectedCount)
    const labels = page.locator('#networkFocusLabels [data-connected-node-id]')
    await expect(labels).toHaveCount(connectedCount)
    const membership = await labels.evaluateAll(elements => elements.map(element => element.getAttribute('data-connected-node-id')))
    expect(new Set(membership).size).toBe(connectedCount)
    const geometry = await connectedLabelState(page)
    for (const label of geometry) {
      expect(label.direction).toMatch(/^(incoming|outgoing|both)$/)
      expect(label.left, label.id).toBeGreaterThanOrEqual(0)
      expect(label.top, label.id).toBeGreaterThanOrEqual(0)
      expect(label.right, label.id).toBeLessThanOrEqual(label.canvasWidth)
      expect(label.bottom, label.id).toBeLessThanOrEqual(label.canvasHeight)
      expect(label.nodeX, label.id).toBeGreaterThanOrEqual(0)
      expect(label.nodeX, label.id).toBeLessThanOrEqual(label.canvasWidth)
      expect(label.nodeY, label.id).toBeGreaterThanOrEqual(0)
      expect(label.nodeY, label.id).toBeLessThanOrEqual(label.canvasHeight)
    }
    await expect(page.locator('#networkSelectionStatus')).toContainText(`${connectedCount} visible connected nodes`)
    runtime.assertClean()
  })

  test('unified high-degree hub preserves all connected labels through view and filter changes', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openFreeSpace(page)
    await page.getByRole('button', { name: 'Unified cross-condition atlas' }).click()
    await page.evaluate(() => (window as any).focusNodeById('um:cutaneous'))

    const labels = page.locator('#networkFocusLabels [data-connected-node-id]')
    const initialCount = Number(await page.locator('#network3d').getAttribute('data-connected-node-count'))
    expect(initialCount).toBeGreaterThan(0)
    await expect(labels).toHaveCount(initialCount)
    const truncation = await labels.evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.getAttribute('data-connected-node-id')))
    expect(truncation, 'desktop connected labels must display their complete node names').toEqual([])
    const selectedTruncated = await page.locator('#networkFocusLabels [data-selected-label-id]').evaluate(element => element.scrollWidth > element.clientWidth + 1)
    expect(selectedTruncated, 'the locked node label must display its complete name').toBe(false)
    const selectedOverlap = await page.evaluate(() => {
      const selected = document.querySelector<HTMLElement>('#networkFocusLabels [data-selected-label-id]')!.getBoundingClientRect()
      return [...document.querySelectorAll<HTMLElement>('#networkFocusLabels [data-connected-node-id]')].filter(element => {
        const rect = element.getBoundingClientRect()
        return selected.left < rect.right && selected.right > rect.left && selected.top < rect.bottom && selected.bottom > rect.top
      }).map(element => element.dataset.connectedNodeId)
    })
    expect(selectedOverlap, 'the selected-node badge must not be obscured by connected labels').toEqual([])
    const beforeMembership = await labels.evaluateAll(elements => elements.map(element => element.getAttribute('data-connected-node-id')).sort())
    const before = await connectedLabelState(page)
    await page.getByRole('button', { name: 'Layer side' }).click()
    const afterMembership = await labels.evaluateAll(elements => elements.map(element => element.getAttribute('data-connected-node-id')).sort())
    const after = await connectedLabelState(page)
    expect(afterMembership).toEqual(beforeMembership)
    expect(after).not.toEqual(before)

    const canvas = page.locator('#network3d')
    const box = (await canvas.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.56, box.y + box.height * 0.54, { steps: 3 })
    await page.mouse.up()
    await page.keyboard.down('Shift')
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.60, box.y + box.height * 0.58, { steps: 3 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await canvas.hover()
    await page.mouse.wheel(0, -180)
    await page.setViewportSize({ width: 1200, height: 900 })
    const transformed = await connectedLabelState(page)
    expect(transformed.map(item => item.id).sort()).toEqual(beforeMembership)
    expect(transformed.map(item => `${item.nodeX}|${item.nodeY}`)).not.toEqual(after.map(item => `${item.nodeX}|${item.nodeY}`))
    for (const label of transformed) {
      expect(label.left, label.id).toBeGreaterThanOrEqual(0)
      expect(label.top, label.id).toBeGreaterThanOrEqual(0)
      expect(label.right, label.id).toBeLessThanOrEqual(label.canvasWidth)
      expect(label.bottom, label.id).toBeLessThanOrEqual(label.canvasHeight)
    }

    await page.locator('#networkEvidence').selectOption('A')
    await page.locator('#networkAdvancedControls summary').click()
    await page.locator('#networkEdgeFamily').selectOption('pathogenesis')
    const filteredCount = Number(await page.locator('#network3d').getAttribute('data-connected-node-count'))
    await expect(labels).toHaveCount(filteredCount)
    runtime.assertClean()
  })

  test('Shift+click selects only the exact highlighted neighbor and preserves graph filters', async ({ page }) => {
    await openFreeSpace(page)
    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    await page.locator('#networkEvidence').selectOption('C')
    await page.locator('#networkDensity').selectOption('expanded')
    const target = page.locator('#networkFocusLabels [data-connected-node-id]').first()
    const targetId = await target.getAttribute('data-connected-node-id')
    const coordinate = await target.evaluate(element => ({ x: Number(element.getAttribute('data-node-x')), y: Number(element.getAttribute('data-node-y')) }))

    await page.locator('#network3d').click({ position: coordinate, modifiers: ['Shift'] })
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', targetId!)
    await expect(page.locator('#networkEvidence')).toHaveValue('C')
    await expect(page.locator('#networkDensity')).toHaveValue('expanded')
  })

  test('normal click still selects an in-bounds node visible in the unselected default graph', async ({ page }) => {
    await openFreeSpace(page)
    const target = await page.evaluate(`(() => {
      clearNetworkSelection();
      const rect = document.querySelector('#network3d').getBoundingClientRect();
      const candidates = networkNodes
        .filter(node => node.visible)
        .map(transformed)
        .filter(node => node.sx >= 24 && node.sy >= 24 && node.sx <= rect.width - 24 && node.sy <= rect.height - 24);
      if (!candidates.length) throw new Error('No visible in-bounds node is available for direct-click verification');
      const scored = candidates.map(node => {
        const separation = Math.min(...candidates.filter(other => other.id !== node.id).map(other => Math.hypot(other.sx - node.sx, other.sy - node.sy)), Number.POSITIVE_INFINITY);
        return { node, separation };
      }).sort((a, b) => b.separation - a.separation || b.node.z2 - a.node.z2 || a.node.id.localeCompare(b.node.id));
      const node = scored[0].node;
      return { id: node.id, x: node.sx, y: node.sy };
    })()`) as { id: string; x: number; y: number }
    await page.locator('#network3d').click({ position: { x: target.x, y: target.y } })
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', target.id)
  })

  test('drag and Shift-drag beyond five pixels never activate or clear the locked selection', async ({ page }) => {
    await openFreeSpace(page)
    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    const canvas = page.locator('#network3d')
    const box = (await canvas.boundingBox())!

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 20, { steps: 3 })
    await page.mouse.up()
    await expect(canvas).toHaveAttribute('data-selected-node-id', 'm:psa:Plaque psoriasis')

    await page.keyboard.down('Shift')
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 50, { steps: 3 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await expect(canvas).toHaveAttribute('data-selected-node-id', 'm:psa:Plaque psoriasis')
  })

  test('label, touch tray, inspector, Escape, and live status expose equivalent exact selection', async ({ page }) => {
    await openFreeSpace(page, 'light', { width: 390, height: 844 })
    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    const projectedLabel = page.locator('#networkFocusLabels [data-connected-node-id]').first()
    const targetId = await projectedLabel.getAttribute('data-connected-node-id')
    await projectedLabel.click()
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', targetId!)

    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    const tray = page.locator(`#networkConnectedTray [data-connected-node-id="${targetId}"]`)
    await expect(tray).toBeVisible()
    await expect(tray).toHaveCSS('min-height', '44px')
    await tray.click()
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', targetId!)

    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    const inspector = page.locator(`#networkRelations [data-node="${targetId}"]`).first()
    await expect(inspector).toBeVisible()
    await inspector.click()
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', targetId!)

    await page.locator('#network3d').focus()
    await page.keyboard.press('Escape')
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', '')
    await expect(page.locator('#networkSelectionStatus')).toContainText('Selection cleared')
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }))
    expect(geometry.page).toBeLessThanOrEqual(geometry.viewport)
  })

  test('320px focus, reduced-motion, and overflow contracts remain usable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openFreeSpace(page, 'dark', { width: 320, height: 720 })
    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    const trayButtons = page.locator('#networkConnectedTray [data-connected-node-id]')
    const trayCount = await trayButtons.count()
    expect(trayCount).toBe(Number(await page.locator('#network3d').getAttribute('data-connected-node-count')))
    expect(trayCount).toBeGreaterThan(0)
    for (const size of await trayButtons.evaluateAll(elements => elements.map(element => getComputedStyle(element).minHeight))) expect(Number.parseFloat(size)).toBeGreaterThanOrEqual(44)
    await page.locator('#network3d').focus()
    await expect(page.locator('#network3d')).toHaveCSS('outline-style', 'none')
    const focusShadow = await page.locator('#network3d').evaluate(element => getComputedStyle(element).boxShadow)
    expect(focusShadow).not.toBe('none')
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }))
    expect(geometry.page).toBeLessThanOrEqual(geometry.viewport)
  })
})

test.describe('Atlas connected-node touch contract', () => {
  test.use({ hasTouch: true })

  test('a touch tap on a projected label selects the exact connected node', async ({ page }) => {
    await openFreeSpace(page, 'light', { width: 390, height: 844 })
    await page.evaluate(() => (window as any).focusNodeById('m:psa:Plaque psoriasis'))
    const labels = page.locator('#networkFocusLabels [data-connected-node-id]')
    const labelCount = await labels.count()
    expect(labelCount).toBe(Number(await page.locator('#network3d').getAttribute('data-connected-node-count')))
    expect(labelCount).toBeGreaterThan(0)
    const target = labels.first()
    const targetId = await target.getAttribute('data-connected-node-id')
    await target.tap()
    await expect(page.locator('#network3d')).toHaveAttribute('data-selected-node-id', targetId!)
  })
})
