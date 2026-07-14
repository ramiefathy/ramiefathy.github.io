import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-immune-atlas/'

async function openExplorer(page: import('@playwright/test').Page) {
  await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '3D systems explorer', exact: true }).click()
}

test.describe('Rheum–Derm Atlas alternative representations', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('publishes every representation as a first-class accessible tab', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)

    const representations = page.getByRole('tablist', { name: 'Network representation' })
    await expect(representations.getByRole('tab')).toHaveCount(7)
    for (const name of [
      'Free-space',
      'Provenance triptych',
      'Mechanism lanes',
      'Bipartite projection',
      'Difference lens',
      'Parallel sets',
      'Coverage volume',
    ]) {
      await expect(representations.getByRole('tab', { name, exact: true })).toBeVisible()
    }
    const tabPanelNames = await representations.getByRole('tab').evaluateAll(tabs => tabs.map(tab => {
      const panel = document.getElementById(tab.getAttribute('aria-controls') || '')
      return {
        tabId: tab.id,
        panelLabel: panel?.getAttribute('aria-labelledby'),
      }
    }))
    expect(tabPanelNames.every(pair => pair.tabId && pair.panelLabel === pair.tabId)).toBe(true)

    runtime.assertClean()
  })

  test('compares fixed-coordinate mechanism lanes with inspectable state and a visible table', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Mechanism lanes', exact: true }).click()

    await expect(page.locator('#mechanismLanesPanel')).toBeVisible()
    await expect(page.locator('#mechanismLanesSvg')).toHaveAttribute('role', 'group')
    await expect(page.locator('#mechanismLanesSvg [data-alt-mark]')).toHaveCount(108)
    await expect(page.locator('#mechanismLanesSvg [data-alt-mark]').first()).toHaveAttribute('role', 'button')
    await expect(page.locator('#mechanismLanesDenominator')).toContainText('54 source coordinates')
    await expect(page.locator('#mechanismLanesLegend')).toContainText('Structurally unavailable')
    await expect(page.locator('#mechanismLanesTable')).toBeVisible()
    await page.locator('#mechanismLanesSvg [data-alt-mark][tabindex="0"]').press('Enter')
    await expect(page.locator('#mechanismLanesInspector')).toContainText(/Direct|Derived|Explicit zero|Unknown|Filtered/)

    runtime.assertClean()
  })

  test('supports keyboard inspection in the bipartite projection', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Bipartite projection', exact: true }).click()

    await expect(page.locator('#bipartitePanel')).toBeVisible()
    await expect(page.locator('#bipartiteEntity')).not.toHaveValue('all')
    await expect(page.locator('#bipartiteEntity option[value="all"]')).toHaveText('All entities')
    expect(await page.locator('#bipartiteSvg [data-bipartite-link]').count()).toBeGreaterThan(0)
    await expect(page.locator('#bipartiteTable')).toBeVisible()
    const firstMark = page.locator('#bipartiteSvg [data-alt-mark][tabindex="0"]')
    await firstMark.press('ArrowDown')
    await page.locator('#bipartiteSvg [data-alt-mark][tabindex="0"]').press('Enter')
    await expect(page.locator('#bipartiteInspector')).toContainText(/Source|Evidence|State/)
    await expect(page.locator('#bipartiteSvg [data-bipartite-link].selected')).toHaveCount(1)
    expect(await page.locator('#bipartiteSvg [data-bipartite-link].context-muted').count()).toBeGreaterThan(0)

    await page.locator('#bipartiteSourceType').selectOption('medication')
    await expect(page.locator('#bipartiteEntity')).not.toHaveValue('all')
    expect(await page.locator('#bipartiteSvg [data-bipartite-link]').count()).toBeGreaterThan(0)
    await page.locator('#bipartiteEntity').selectOption('all')
    expect(await page.locator('#bipartiteSvg [data-bipartite-link]').count()).toBeGreaterThan(0)

    runtime.assertClean()
  })

  test('renders the complete fixed-coordinate difference lens without color-only state', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Difference lens', exact: true }).click()

    await expect(page.locator('#differenceLensPanel')).toBeVisible()
    await expect(page.locator('#differenceLensSvg [data-difference-cell]')).toHaveCount(27)
    await expect(page.locator('#differenceLensLegend')).toContainText('Shared')
    await expect(page.locator('#differenceLensLegend')).toContainText('only')
    await expect(page.locator('#differenceLensLegend')).toContainText('Structurally unavailable')
    await expect(page.locator('#differenceLensTable')).toBeVisible()
    const states = await page.locator('#differenceLensSvg [data-difference-cell]').evaluateAll(nodes =>
      [...new Set(nodes.map(node => node.getAttribute('data-comparison-state')))]
    )
    expect(states.length).toBeGreaterThan(1)
    const unsupportedUniqueClaims = await page.locator('#differenceLensSvg [data-comparison-state="a-only"], #differenceLensSvg [data-comparison-state="b-only"]').evaluateAll(nodes =>
      nodes.filter(node => !node.getAttribute('aria-label')?.includes('Explicit zero')).length
    )
    expect(unsupportedUniqueClaims).toBe(0)

    runtime.assertClean()
  })

  test('traces source-backed context-to-pathway-to-endpoint chains in parallel sets', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Parallel sets', exact: true }).click()

    await expect(page.locator('#parallelSetsPanel')).toBeVisible()
    expect(await page.locator('#parallelSetsSvg [data-parallel-link]').count()).toBeGreaterThan(0)
    await expect(page.locator('#parallelSetsSvg [data-origin="direct"]').first()).toBeVisible()
    await expect(page.locator('#parallelSetsTable')).toBeVisible()
    await page.locator('#parallelSetsSvg [data-alt-mark][tabindex="0"]').press('Enter')
    await expect(page.locator('#parallelSetsInspector')).toContainText(/Context|Pathway|Endpoint|Evidence/)

    await page.locator('#parallelRightFacet').selectOption('feature')
    await expect(page.locator('#parallelSetsTable')).toBeVisible()
    await expect(page.locator('#parallelSetsDenominator')).toContainText(/features|supported chains/)

    runtime.assertClean()
  })

  test('offers a sparse three-axis coverage volume and all orthogonal slices', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Coverage volume', exact: true }).click()

    await expect(page.locator('#coverageVolumePanel')).toBeVisible()
    await expect(page.locator('#coverageVolumeSvg')).toContainText('Conditions')
    await expect(page.locator('#coverageVolumeSvg')).toContainText('Pathways')
    await expect(page.locator('#coverageVolumeSvg')).toContainText('Treatments')
    expect(await page.locator('#coverageVolumeSvg [data-volume-point]').count()).toBeGreaterThan(0)
    await expect(page.locator('#coverageVolumeDenominator')).toContainText('23814 three-class coordinates')
    await expect(page.locator('#coverageVolumeDenominator')).toContainText('61 derived')
    await expect(page.locator('#coverageVolumeDenominator')).toContainText('67 filtered')
    await expect(page.locator('#coverageVolumeDenominator')).toContainText('23686 unknown')
    await page.locator('#coverageVolumeEvidence').selectOption('D')
    await expect(page.locator('#coverageVolumeDenominator')).toContainText('2 explicit zero')
    await page.locator('#coverageVolumeEvidence').selectOption('B')
    await expect(page.locator('#coverageSliceGrid [data-volume-cell]')).toHaveCount(1323)
    await page.locator('#coverageSliceGrid [data-volume-cell][tabindex="0"]').press('Enter')
    await expect(page.locator('#coverageVolumeInspector')).toContainText(/Component states|Derivation rule/)
    await page.locator('#coverageSliceAxis').selectOption('pathway')
    await expect(page.locator('#coverageSliceGrid [data-volume-cell]')).toHaveCount(882)
    await page.locator('#coverageSliceAxis').selectOption('treatment')
    await expect(page.locator('#coverageSliceGrid [data-volume-cell]')).toHaveCount(486)
    await expect(page.locator('#coverageVolumeTable')).toBeVisible()

    runtime.assertClean()
  })

  test('keeps fixed coordinates and state counts deterministic across repeated renders', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Difference lens', exact: true }).click()

    const differenceSignature = async () => page.locator('#differenceLensSvg [data-difference-cell]').evaluateAll(nodes =>
      nodes.map(node => `${node.getAttribute('data-comparison-state')}|${node.getAttribute('aria-label')}`)
    )
    const before = await differenceSignature()
    await page.getByRole('tab', { name: 'Free-space', exact: true }).click()
    await page.getByRole('tab', { name: 'Difference lens', exact: true }).click()
    expect(await differenceSignature()).toEqual(before)

    await page.getByRole('tab', { name: 'Coverage volume', exact: true }).click()
    const stateCounts = await page.locator('#coverageSliceGrid [data-volume-cell]').evaluateAll(nodes =>
      nodes.reduce<Record<string, number>>((counts, node) => {
        const state = [...node.classList].find(name => ['derived', 'explicit-zero', 'filtered', 'unknown', 'structurally-unavailable'].includes(name)) || 'missing'
        counts[state] = (counts[state] || 0) + 1
        return counts
      }, {})
    )
    expect(Object.values(stateCounts).reduce((sum, count) => sum + count, 0)).toBe(1323)
    expect(stateCounts.missing || 0).toBe(0)

    runtime.assertClean()
  })

  test('synchronizes condition-scoped alternative controls before rerender', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openExplorer(page)
    await page.getByRole('tab', { name: 'Bipartite projection', exact: true }).click()

    const target = await page.locator('#networkCondition option').nth(1).getAttribute('value')
    expect(target).toBeTruthy()
    await page.locator('#networkCondition').evaluate((select, value) => {
      const conditionSelect = select as HTMLSelectElement
      conditionSelect.value = value
      conditionSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }, target!)
    await expect(page.locator('#bipartiteEntity')).toHaveValue(target!)

    await page.getByRole('tab', { name: 'Coverage volume', exact: true }).click()
    await expect(page.locator('#coverageSliceAxis')).toHaveValue('condition')
    await expect(page.locator('#coverageSliceEntity')).toHaveValue(target!)

    runtime.assertClean()
  })

  test('keeps every representation reachable and contained at 390 px', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await openExplorer(page)

    for (const name of ['Mechanism lanes', 'Bipartite projection', 'Difference lens', 'Parallel sets', 'Coverage volume']) {
      await page.getByRole('tab', { name, exact: true }).click()
      await expect(page.getByRole('tabpanel').filter({ visible: true })).toHaveCount(1)
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, body: document.documentElement.scrollWidth }))
      expect(geometry.body).toBeLessThanOrEqual(geometry.viewport)
    }

    runtime.assertClean()
  })
})
