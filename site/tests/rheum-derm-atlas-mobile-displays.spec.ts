import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-immune-atlas/'

async function openMobileExplorer(page: import('@playwright/test').Page, width = 390) {
  await setDeterministicUi(page, { width, height: 844 })
  await blockExternalRequests(page)
  await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
  await page.locator('#mobileSectionSelect').selectOption('network')
}

test.describe('Rheum–Derm Atlas mobile display system', () => {
  test('pins every Explorer asset to one coherent deployed release version', async ({ request }) => {
    const response = await request.get(`${APP_ROUTE}index.html`)
    expect(response.ok()).toBe(true)
    const document = await response.text()
    const versions = [...document.matchAll(/explorer\/(?:systems-explorer(?:-shell)?|alternative-views)\.(?:css|js)\?v=([a-z0-9-]+)/g)].map(match => match[1])
    expect(versions).toHaveLength(5)
    expect(new Set(versions).size).toBe(1)
  })

  test('offers every atlas destination through a stable mobile section switcher', async ({ page }) => {
    await setDeterministicUi(page, { width: 320, height: 720 })
    await blockExternalRequests(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    const switcher = page.locator('#mobileSectionSelect')
    await expect(switcher).toBeVisible()
    await expect(switcher.locator('option')).toHaveCount(11)
    await switcher.selectOption('manifestationMap')
    await expect(page.locator('#manifestationMap')).toHaveClass(/active/)
    await expect(page).toHaveURL(/#manifestationMap$/)
    const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width)
  })

  test('keeps every atlas destination inside a 320px page viewport', async ({ page }) => {
    const runtime = watchRuntime(page)
    await setDeterministicUi(page, { width: 320, height: 720 })
    await blockExternalRequests(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    const destinations = ['dashboard', 'conditions', 'pathways', 'medications', 'effects', 'manifestationMap', 'signalCoverage', 'phenotypeMaps', 'network', 'teaching', 'sources']
    for (const destination of destinations) {
      await page.locator('#mobileSectionSelect').selectOption(destination)
      await page.waitForFunction(section => document.documentElement.dataset.atlasSectionReady === section, destination)
      const geometry = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }))
      expect(geometry.page, destination).toBeLessThanOrEqual(geometry.viewport)
    }

    runtime.assertClean()
  })

  test('keeps all seven display choices visible in a compact touch-safe index', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openMobileExplorer(page, 320)

    const tabs = page.getByRole('tablist', { name: 'Network representation' }).getByRole('tab')
    await expect(tabs).toHaveCount(7)
    const geometry = await page.locator('.representation-switch').evaluate(element => {
      const style = getComputedStyle(element)
      const buttons = [...element.querySelectorAll('button')].map(button => button.getBoundingClientRect())
      return {
        columns: style.gridTemplateColumns.split(' ').length,
        minimumTarget: Math.min(...buttons.map(rect => rect.height)),
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      }
    })
    expect(geometry.columns).toBe(3)
    expect(geometry.minimumTarget).toBeGreaterThanOrEqual(44)
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth)

    runtime.assertClean()
  })

  test('provides a compact free-space control surface and precise entity navigator', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openMobileExplorer(page)

    await expect(page.locator('#networkAdvancedControls')).not.toHaveAttribute('open', '')
    await expect(page.locator('#networkMobileNavigator')).toBeVisible()
    const entityOptions = page.locator('#networkMobileEntity option')
    expect(await entityOptions.count()).toBeGreaterThan(1)
    await page.locator('#networkMobileEntity').selectOption({ index: 1 })
    await page.locator('#networkMobileInspect').click()
    await expect(page.locator('#nodeInfo h4')).not.toHaveText('Network ready')

    const geometry = await page.locator('#network3d').evaluate(canvas => {
      const shell = canvas.closest('.network-shell')!
      return {
        canvasWidth: canvas.getBoundingClientRect().width,
        shellWidth: shell.getBoundingClientRect().width,
        touchAction: getComputedStyle(canvas).touchAction,
        preset: canvas.getAttribute('data-view-preset'),
        zoom: Number(canvas.getAttribute('data-view-zoom')),
      }
    })
    expect(geometry.canvasWidth).toBeLessThanOrEqual(geometry.shellWidth)
    expect(geometry.touchAction).toBe('none')
    expect(geometry.preset).toBe('front')
    expect(geometry.zoom).toBeLessThanOrEqual(0.35)

    runtime.assertClean()
  })

  test('turns the provenance triptych into a named three-facet mobile journey', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openMobileExplorer(page)
    await page.getByRole('tab', { name: 'Provenance triptych', exact: true }).click()

    await expect(page.locator('#triptychPanControls')).toBeVisible()
    await expect(page.locator('#triptychPanStatus')).toContainText('Facet 1 of 3')
    await expect(page.locator('.triptych-svg-shell > .triptych-headings')).toHaveCount(1)
    const before = await page.locator('.triptych-svg-shell').evaluate(element => element.scrollLeft)
    await page.locator('#triptychPanNext').click()
    const after = await page.locator('.triptych-svg-shell').evaluate(element => element.scrollLeft)
    expect(after).toBeGreaterThan(before)
    await expect(page.locator('#triptychPanStatus')).toContainText('Facet 2 of 3')

    runtime.assertClean()
  })

  test('uses mobile-native projections and inspector-first reading for comparison displays', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openMobileExplorer(page)

    const displays = [
      { tab: 'Mechanism lanes', svg: '#mechanismLanesSvg', projection: 'stacked-lanes', panel: '#mechanismLanesPanel' },
      { tab: 'Bipartite projection', svg: '#bipartiteSvg', projection: 'stacked-bipartite', panel: '#bipartitePanel' },
      { tab: 'Difference lens', svg: '#differenceLensSvg', projection: 'compact-grid', panel: '#differenceLensPanel' },
      { tab: 'Parallel sets', svg: '#parallelSetsSvg', projection: 'stacked-chains', panel: '#parallelSetsPanel' },
    ]

    for (const display of displays) {
      await page.getByRole('tab', { name: display.tab, exact: true }).click()
      await expect(page.locator(display.svg)).toHaveAttribute('data-mobile-projection', display.projection)
      const geometry = await page.locator(display.panel).evaluate(panel => {
        const shell = panel.querySelector<HTMLElement>('.alternative-viz-shell')!
        const svg = shell.querySelector<SVGElement>('svg')!
        const inspector = panel.querySelector<HTMLElement>('.alternative-inspector')!
        return {
          localOverflow: shell.scrollWidth - shell.clientWidth,
          svgWidth: svg.getBoundingClientRect().width,
          shellWidth: shell.getBoundingClientRect().width,
          inspectorBeforeVisual: inspector.getBoundingClientRect().top < shell.getBoundingClientRect().top,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
        }
      })
      expect(geometry.localOverflow).toBeLessThanOrEqual(1)
      expect(geometry.svgWidth).toBeLessThanOrEqual(geometry.shellWidth + 1)
      expect(geometry.inspectorBeforeVisual).toBe(true)
      expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth)
    }

    runtime.assertClean()
  })

  test('renders comparison records as labeled mobile cards without losing the table semantics', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openMobileExplorer(page)

    for (const tab of ['Mechanism lanes', 'Bipartite projection', 'Difference lens', 'Parallel sets']) {
      await page.getByRole('tab', { name: tab, exact: true }).click()
      const table = page.getByRole('tabpanel').filter({ visible: true }).locator('table[data-mobile-table="cards"]')
      await expect(table).toHaveCount(1)
      const cellLabels = await table.locator('tbody td').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-label')?.trim() || ''))
      expect(cellLabels.length).toBeGreaterThan(0)
      expect(cellLabels.every(Boolean)).toBe(true)
      const width = await table.evaluate(element => ({ table: element.scrollWidth, shell: element.parentElement!.clientWidth }))
      expect(width.table).toBeLessThanOrEqual(width.shell + 1)
    }

    runtime.assertClean()
  })

  test('fits the coverage overview and adds precise local navigation to the complete slice', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openMobileExplorer(page)
    await page.getByRole('tab', { name: 'Coverage volume', exact: true }).click()

    await expect(page.locator('#coverageVolumeSvg')).toHaveAttribute('data-mobile-projection', 'fit-overview')
    const overview = await page.locator('.volume-overview').evaluate(shell => ({
      overflow: shell.scrollWidth - shell.clientWidth,
      svg: shell.querySelector('svg')!.getBoundingClientRect().width,
      shell: shell.getBoundingClientRect().width,
    }))
    expect(overview.overflow).toBeLessThanOrEqual(1)
    expect(overview.svg).toBeLessThanOrEqual(overview.shell + 1)

    await expect(page.locator('#coverageSlicePanControls')).toBeVisible()
    const before = await page.locator('#coverageSliceShell').evaluate(element => element.scrollLeft)
    await page.locator('#coverageSlicePanNext').click()
    const after = await page.locator('#coverageSliceShell').evaluate(element => element.scrollLeft)
    expect(after).toBeGreaterThan(before)
    await expect(page.locator('#coverageSlicePanStatus')).not.toHaveText('Column group 1 of 1')

    const pageGeometry = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }))
    expect(pageGeometry.page).toBeLessThanOrEqual(pageGeometry.viewport)

    runtime.assertClean()
  })

  test('does not infer a unique relationship from an unknown or filtered counterpart', async ({ page }) => {
    await openMobileExplorer(page)

    const states = await page.evaluate(() => {
      const compare = (window as any).derivedComparison
      const present = { state: 'direct', value: 4, rows: [{ id: 'direct-row' }], conflict: false }
      const zero = { state: 'explicit-zero', value: 0, rows: [{ id: 'zero-row' }], conflict: false }
      const unknown = { state: 'unknown', value: null, rows: [], conflict: false }
      const filtered = { state: 'filtered', underlyingState: 'direct', value: null, rows: [{ id: 'filtered-row' }], conflict: false }
      return {
        explicitAbsence: compare(present, zero, 'a-only').state,
        unknownCounterpart: compare(present, unknown, 'a-only').state,
        filteredCounterpart: compare(present, filtered, 'a-only').state,
      }
    })

    expect(states.explicitAbsence).toBe('derived')
    expect(states.unknownCounterpart).toBe('unknown')
    expect(states.filteredCounterpart).toBe('filtered')
  })

  test('preserves unresolved relationship states in treatment coverage overlap', async ({ page }) => {
    await openMobileExplorer(page)

    const states = await page.evaluate(() => {
      const overlap = (window as any).coverageOverlapState
      return {
        presentAndZero: overlap({ state: 'direct' }, { state: 'explicit-zero' }).state,
        presentAndUnknown: overlap({ state: 'direct' }, { state: 'unknown' }).state,
        filteredAndZero: overlap({ state: 'filtered', underlyingState: 'direct' }, { state: 'explicit-zero' }).state,
        unavailableAndZero: overlap({ state: 'structurally-unavailable' }, { state: 'explicit-zero' }).state,
        bothZero: overlap({ state: 'explicit-zero' }, { state: 'explicit-zero' }).state,
      }
    })

    expect(states).toEqual({
      presentAndZero: 'a-only',
      presentAndUnknown: 'unknown',
      filteredAndZero: 'filtered',
      unavailableAndZero: 'structurally-unavailable',
      bothZero: 'explicit-zero',
    })
  })

  test('keeps missing heatmap and radar values explicitly unknown on mobile', async ({ page }) => {
    const runtime = watchRuntime(page)
    await setDeterministicUi(page, { width: 390, height: 844 })
    await blockExternalRequests(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await expect(page.locator('#heatmapMobileList')).toBeVisible()
    await expect(page.locator('#heatmapMobileList [data-state="unknown"]').first()).toContainText('Unknown')
    await expect(page.locator('#radarMobileList')).toBeVisible()
    await expect(page.locator('#radarMobileDenominator')).toContainText(/mapped of 14 canonical axes/)
    await expect(page.locator('#radarMobileList [data-state="unknown"]').first()).toContainText('Unknown')

    runtime.assertClean()
  })

  test('stratifies evidence grades by construct instead of pooling unlike rows', async ({ page }) => {
    await setDeterministicUi(page, { width: 390, height: 844 })
    await blockExternalRequests(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    const construct = page.locator('#evidenceConstruct')
    await expect(construct).toBeVisible()
    await expect(construct.locator('option')).toHaveCount(3)
    await expect(page.locator('#evidenceConstructLabel')).toHaveText('Pathway rows')
    await construct.selectOption('benefits')
    await expect(page.locator('#evidenceConstructLabel')).toHaveText('Condition–benefit rows')
    await expect(page.locator('#evidenceN')).toHaveText('143')
    await expect(page.locator('#evidenceLegend')).toContainText('Grade A')
    await construct.selectOption('mechanisms')
    await expect(page.locator('#evidenceConstructLabel')).toHaveText('Medication-mechanism rows')
    await expect(page.locator('#evidenceN')).toHaveText('49')
  })

  test('keeps the shared tooltip readable and inside the viewport in light theme', async ({ page }) => {
    await setDeterministicUi(page, { width: 320, height: 720 })
    await blockExternalRequests(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
    await page.locator('#themeBtn').click()
    await page.evaluate(() => (window as any).tip('<b>Source-backed relationship</b><br>Direct evidence with provenance and a deliberately long limitation note.', innerWidth - 2, innerHeight - 2))

    const metrics = await page.locator('#tooltip').evaluate(element => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      const rgb = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
      const luminance = (channels: number[]) => {
        const linear = channels.map(channel => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
      }
      const foreground = luminance(rgb(style.color))
      const background = luminance(rgb(style.backgroundColor))
      return {
        contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
      }
    })

    expect(metrics.contrast).toBeGreaterThanOrEqual(4.5)
    expect(metrics.left).toBeGreaterThanOrEqual(8)
    expect(metrics.top).toBeGreaterThanOrEqual(8)
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth - 8)
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight - 8)
  })

  test('turns the core research tables into complete labeled records at narrow widths', async ({ page }) => {
    await setDeterministicUi(page, { width: 390, height: 844 })
    await blockExternalRequests(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    for (const tableId of ['#pathTable', '#medTable', '#effectTable', '#manifestLinkTable', '#antibodyMatrix']) {
      const table = page.locator(tableId)
      await expect(table).toHaveAttribute('data-mobile-table', 'cards')
      const cellLabels = await table.locator('tbody td').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-label')?.trim() || ''))
      expect(cellLabels.length).toBeGreaterThan(0)
      expect(cellLabels.every(Boolean)).toBe(true)
      const geometry = await table.evaluate(element => ({ table: element.scrollWidth, shell: element.parentElement!.clientWidth }))
      expect(geometry.table).toBeLessThanOrEqual(geometry.shell + 1)
    }
  })
})
