import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

type MindmapScenario = {
  label: string
  route: string
  searchTerm: string
}

const mindmaps: MindmapScenario[] = [
  {
    label: 'CTCL',
    route: '/apps/MindMaps/CTCL/CTCLMindMaps.html',
    searchTerm: 'workup'
  },
  {
    label: 'Psoriasis',
    route: '/apps/MindMaps/Psoriasis/PsoriasisMindMaps.html',
    searchTerm: 'genetic'
  },
  {
    label: 'Alopecia',
    route: '/apps/MindMaps/Alopecia/AlopeciaMindMaps.html',
    searchTerm: 'history'
  }
]

test.describe('MindMaps legacy (functional)', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1365, height: 900 })
    await blockExternalRequests(page)
  })

  for (const scenario of mindmaps) {
    test(`${scenario.label}: renders nodes and supports search next/prev`, async ({ page }) => {
      const runtime = watchRuntime(page)
      await page.goto(scenario.route, { waitUntil: 'networkidle' })

      await expect(page.locator('.legacy-shell')).toBeVisible()
      await expect(page.locator('#mind-map-container')).toBeVisible()
      await expect(page.locator('#mind-map-container svg')).toHaveCount(1)

      const nodes = page.locator('.nodes-group .node')
      const nodeCount = await nodes.count()
      expect(nodeCount, 'Expected at least 1 rendered node').toBeGreaterThan(0)

      const search = page.locator('#search-input')
      await expect(search).toBeVisible()
      await search.fill(scenario.searchTerm)
      const results = page.locator('#search-results-container .search-result-item')
      await expect(results.first()).toBeVisible()

      await expect(page.locator('#search-next')).toBeVisible()
      await expect(page.locator('#search-prev')).toBeVisible()

      const beforeValue = await search.inputValue()
      await page.click('#search-next')
      await expect(search).not.toHaveValue(beforeValue)

      // Basic zoom/fit wiring (do not assert exact transform values).
      await page.click('#zoom-in')
      await page.click('#fit-screen')

      runtime.assertClean()
    })
  }
})
