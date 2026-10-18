import { expect, test } from '@playwright/test'
import { blockExternalRequests } from './helpers/network.js'

const atlasPath = '/apps/rheum-derm-immune-atlas/'

async function openAtlas(page: import('@playwright/test').Page, suffix = '') {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await blockExternalRequests(page)
  await page.goto(`${atlasPath}${suffix}#network`)
  await page.waitForLoadState('networkidle')
  await page.locator('html[data-atlas-p2-ready="true"]').waitFor()
  return errors
}

test.describe('Rheum–Derm Atlas P1/P2 governed interface', () => {
  test('P0, P1, and P2 contracts remain valid together', async ({ page }) => {
    const errors = await openAtlas(page)
    const result = await page.evaluate(() => ({
      p0: (window as any).__ATLAS_P0__?.validate(),
      p1: (window as any).__ATLAS_P1__?.validate(),
      p2: (window as any).__ATLAS_P2__?.validate(),
      relations: (window as any).__ATLAS_P1__?.relations?.length,
    }))
    expect(result.p0?.ok, result.p0?.errors?.join('\n')).toBe(true)
    expect(result.p1?.ok, result.p1?.errors?.join('\n')).toBe(true)
    expect(result.p2?.ok, result.p2?.errors?.join('\n')).toBe(true)
    expect(result.relations).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })

  test('defaults to a provenance-first 2D task and keeps all seven representations reachable', async ({ page }) => {
    await openAtlas(page)
    await expect(page.locator('#atlasTaskNavigation')).toBeVisible()
    await expect(page.locator('[data-atlas-task="explain"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('#triptychTab')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#triptychPanel')).toBeVisible()

    const tabs = page.locator('.representation-switch [role="tab"]')
    await expect(tabs).toHaveCount(7)
    for (let index = 0; index < 7; index += 1) {
      await tabs.nth(index).click()
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('task navigation maps clinical questions to appropriate representations', async ({ page }) => {
    await openAtlas(page)
    const expectations: Array<[string, string]> = [
      ['explain', 'triptych'],
      ['compare', 'lanes'],
      ['treatments', 'bipartite'],
      ['audit', 'triptych'],
      ['explore3d', 'free'],
    ]
    for (const [task, representation] of expectations) {
      await page.locator(`[data-atlas-task="${task}"]`).click()
      await expect(page.locator(`[data-network-representation="${representation}"]`)).toHaveAttribute('aria-selected', 'true')
      await expect(page.locator(`[data-atlas-task="${task}"]`)).toHaveAttribute('aria-pressed', 'true')
    }
  })

  test('3D exposes epistemic denominators and a simplified non-quantitative grammar', async ({ page }) => {
    await openAtlas(page, '?task=explore3d&rep=free')
    await expect(page.locator('#networkEpistemicDenominator')).toBeVisible()
    await expect(page.locator('#networkEpistemicDenominator')).toContainText('Filtered eligible')
    await expect(page.locator('#networkEpistemicDenominator')).toContainText('Unknown')
    await expect(page.locator('#networkEpistemicDenominator')).toContainText('Structurally unavailable')
    await expect(page.locator('#networkEpistemicDenominator')).toContainText('Canonical background')
    await expect(page.locator('#atlasSimpleGrammar')).toContainText('Node size is not comparable across entity classes')
    await expect(page.locator('html')).toHaveAttribute('data-atlas-visual-grammar', 'simple')

    const counts = await page.evaluate(() => (window as any).__ATLAS_P2__.denominators())
    expect(counts.total).toBeGreaterThan(0)
    expect(counts.present + counts.explicitZero + counts.unknown + counts.unavailable).toBeGreaterThan(0)
  })

  test('grouped search supports keyboard navigation and discloses hidden labels', async ({ page }) => {
    await openAtlas(page, '?task=explore3d&rep=free')
    const search = page.locator('#networkSearch')
    await expect(search).toHaveAttribute('role', 'combobox')
    await search.fill('dermatomyositis')
    await expect(page.locator('#networkSearchResults')).toBeVisible()
    await expect(page.locator('#networkSearchResults [role="group"]')).toHaveCount(1)
    await search.press('ArrowDown')
    await expect(page.locator('#networkSearchResults [role="option"][aria-selected="true"]')).toHaveCount(1)
    await search.press('Enter')
    await expect(page.locator('#networkCondition')).toHaveValue('dm')

    await expect(page.locator('#networkLabelDisclosure')).toBeVisible()
    await expect(page.locator('#networkLabelDisclosureCount')).toContainText('disclosed')
    await page.locator('#networkVisibleEntitiesButton').click()
    await expect(page.locator('#networkVisibleEntities')).toBeVisible()
  })

  test('expanded provenance inspector renders independent dimensions and conflicts', async ({ page }) => {
    await openAtlas(page, '?task=audit&rep=triptych')
    const relation = await page.evaluate(() => {
      const row = (window as any).__ATLAS_P1__.relations.find((item: any) => item.manifestation || item.feature) || (window as any).__ATLAS_P1__.relations[0]
      ;(window as any).__ATLAS_P1__.registerConflict(row.relationshipId, ['TEST-CONFLICT-REF'], 'Conflicting evidence test fixture.')
      ;(window as any).__ATLAS_P2__.selectRelation(row.relationshipId)
      return row.relationshipId
    })
    await expect(page.locator('#networkProvenanceInspector')).toHaveClass(/has-relation/)
    await expect(page.locator('#networkProvenanceInspectorHeading')).toContainText(relation)
    for (const dimension of ['Availability', 'Visibility', 'Provenance', 'Evidence', 'Causality', 'Endotype scope', 'Tissue scope', 'Curation']) {
      await expect(page.locator('#networkProvenanceDimensions')).toContainText(dimension)
    }
    await expect(page.locator('#networkProvenanceDimensions')).toContainText('mixed')
    await expect(page.locator('#networkProvenanceDimensions')).toContainText('contested')
    await expect(page.locator('#networkProvenanceSources')).toContainText('TEST-CONFLICT-REF')
  })

  test('URLs reproduce task, representation, filters, camera, and comparison state', async ({ page }) => {
    await openAtlas(page)
    await page.locator('[data-atlas-task="compare"]').click()
    await page.locator('#mechanismLanesConditionA').selectOption('dm')
    await page.locator('#mechanismLanesConditionB').selectOption('sle')
    await page.waitForTimeout(180)
    const url = new URL(page.url())
    expect(url.searchParams.get('task')).toBe('compare')
    expect(url.searchParams.get('rep')).toBe('lanes')
    expect(url.searchParams.get('compareA')).toBe('dm')
    expect(url.searchParams.get('compareB')).toBe('sle')

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.locator('html[data-atlas-p2-ready="true"]').waitFor()
    await expect(page.locator('[data-atlas-task="compare"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('#mechanismLanesTab')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#mechanismLanesConditionA')).toHaveValue('dm')
    await expect(page.locator('#mechanismLanesConditionB')).toHaveValue('sle')
  })

  test('exports only the current governed filtered evidence set', async ({ page }) => {
    await openAtlas(page, '?task=explore3d&rep=free&evidence=B&density=focused')
    const expected = await page.evaluate(() => (window as any).__ATLAS_P2__.visibleSubset().length)
    expect(expected).toBeGreaterThan(0)
    const downloadPromise = page.waitForEvent('download')
    await page.locator('#networkExportVisibleJson').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^rheum-derm-atlas-filtered-.*\.json$/)
    const path = await download.path()
    expect(path).toBeTruthy()
    const payload = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(path!, 'utf8')))
    expect(payload.schema).toBe('rheum-derm-atlas-filtered-evidence-v2')
    expect(payload.count).toBe(expected)
    expect(payload.relationships).toHaveLength(expected)
    expect(payload.view.rep).toBe('free')
  })

  test('provides assistive-technology semantics and non-drag controls', async ({ page }) => {
    await openAtlas(page, '?task=explore3d&rep=free')
    await expect(page.locator('#network3d')).toHaveAttribute('role', 'region')
    await expect(page.locator('#network3d')).not.toHaveAttribute('role', 'application')
    await expect(page.locator('#networkNonDragControls [data-p2-control]')).toHaveCount(8)
    await page.locator('[data-p2-control="zoom-in"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#networkSelectionStatus')).toContainText('zoom in')
    await expect(page.locator('#relationshipModelGuide')).toBeVisible()
    await page.locator('#relationshipModelGuide summary').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.relationship-model-grid')).toBeVisible()
  })
})

test('touch/mobile defaults to provenance and preserves target size and reflow', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  const errors = await openAtlas(page)
  await expect(page.locator('#triptychTab')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#triptychPanel')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-atlas-mobile-provenance-default', 'true')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  const sizes = await page.locator('.atlas-task-card:visible, .network-share-controls .btn:visible').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }))
  expect(sizes.length).toBeGreaterThan(0)
  sizes.forEach(size => expect(Math.min(size.width, size.height)).toBeGreaterThanOrEqual(44))

  await page.locator('[data-atlas-task="explore3d"]').tap()
  await expect(page.locator('#freeSpacePanel')).toBeVisible()
  await page.locator('[data-p2-control="pan-right"]').tap()
  await expect(page.locator('#networkSelectionStatus')).toContainText('pan right')
  expect(errors).toEqual([])
  await context.close()
})
