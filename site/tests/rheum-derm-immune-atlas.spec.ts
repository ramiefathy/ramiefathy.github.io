import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-immune-atlas/'

test.describe('Rheum–Derm Immune Atlas', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 390, height: 844 })
    await blockExternalRequests(page)
  })

  test('is listed in the public app catalog', async ({ page }) => {
    await page.goto('/apps', { waitUntil: 'domcontentloaded' })

    const app = page.getByRole('link', { name: /Rheum–Derm Immune Atlas/i })
    await expect(app).toBeVisible()
    await expect(app).toHaveAttribute('href', APP_ROUTE)
  })

  test('loads the self-contained atlas and preserves core interactions', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rheum–Derm Immune Atlas')
    await expect(page.getByRole('toolbar', { name: 'Page tools' })).toBeVisible()
    await expect(page.locator('.tab-btn')).toHaveCount(11)

    await page.getByRole('button', { name: 'Conditions', exact: true }).click()
    await expect(page.locator('#conditions')).toHaveClass(/active/)
    await expect(page.locator('#conditionArticle h2')).toBeVisible()

    await page.getByRole('button', { name: 'Teaching lab', exact: true }).click()
    await page.getByRole('button', { name: 'Start 10-question quiz' }).click()
    await expect(page.locator('#quizQuestion')).not.toBeEmpty()

    runtime.assertClean()
  })

  test('maps JAK-STAT wiring and makes combination coverage boundaries explicit', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Signal coverage', exact: true }).click()
    await expect(page.locator('#signalCoverage')).toHaveClass(/active/)
    await expect(page.locator('#signalRows .signal-route')).toHaveCount(10)
    await expect(page.locator('#signalRows')).toContainText('IFN-α / IFN-β')
    await expect(page.locator('#signalRows')).toContainText('IFNAR1 / IFNAR2')
    await expect(page.locator('#signalRows')).toContainText('JAK1 + TYK2')
    await expect(page.locator('#signalRows')).toContainText('STAT1 + STAT2 + IRF9')

    await page.locator('#coverageDrugA').selectOption('upadacitinib')
    await page.locator('#coverageDrugB').selectOption('deucravacitinib')
    await expect(page.locator('#coverageSummary')).toContainText('combined molecular target model')
    await expect(page.locator('#coverageMatrix')).toContainText('Outside declared target model')
    await expect(page.locator('#coverageMatrix')).toContainText('Unknown / context-dependent')
    await expect(page.locator('#coverageMatrix')).toContainText('IL-23')
    await expect(page.locator('#coverageMatrix')).toContainText('Type I interferon')

    runtime.assertClean()
  })

  test('compares two agents across all canonical pathways without combining magnitudes', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Signal coverage', exact: true }).click()
    await page.locator('#coverageDrugA').selectOption('upadacitinib')
    await page.locator('#coverageDrugB').selectOption('deucravacitinib')
    await page.getByRole('tab', { name: 'Coverage lanes' }).click()

    await expect(page.locator('#coverageLanePanel')).toBeVisible()
    await expect(page.locator('#coverageLaneGrid .coverage-column-head')).toHaveCount(27)
    await expect(page.locator('#coverageLaneGrid .coverage-agent-lane')).toHaveCount(2)
    await expect(page.locator('#coverageLaneDenominator')).toContainText('27 canonical pathways')
    await expect(page.locator('#coverageOverlapRow')).toBeVisible()
    expect(await page.locator('#coverageLaneGrid .coverage-lane-mark.direct').count()).toBeGreaterThan(0)
    expect(await page.locator('#coverageOverlapRow .coverage-overlap-mark.both').count()).toBeGreaterThan(0)
    await expect(page.locator('#coverageLaneBoundary')).toContainText('No combined magnitude')
    await expect(page.locator('#coverageLaneBoundary')).toContainText('no synergy')

    runtime.assertClean()
  })

  test('compares conditions with an explicit denominator and exposes phenotype endotypes', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Phenotype maps', exact: true }).click()
    await expect(page.locator('#phenotypeMaps')).toHaveClass(/active/)
    await expect(page.locator('#antibodyMatrix')).toContainText('Anti-MDA5')
    await expect(page.locator('#antibodyMatrix')).toContainText('Rapidly progressive ILD')
    await expect(page.locator('#antibodyMatrix')).toContainText('Anti-TIF1γ')
    await expect(page.locator('#antibodyCaveat')).toContainText('assay')
    await expect(page.locator('#subtypeCondition option')).toHaveCount(18)

    await page.locator('#compareConditionA').selectOption('dm')
    await page.locator('#compareConditionB').selectOption('sle')
    await expect(page.locator('#comparisonDenominator')).toContainText('present')
    await expect(page.locator('#comparisonDenominator')).toContainText('unmapped')
    await expect(page.locator('#comparisonStateLegend [data-state]')).toHaveCount(5)
    await expect(page.locator('#comparisonMatrix')).toHaveAttribute('aria-label', /orthographic comparison matrix/i)

    runtime.assertClean()
  })

  test('switches between five pairwise presets and a complete cohort ledger', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Phenotype maps', exact: true }).click()

    await expect(page.getByRole('tab', { name: 'Pairwise' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#comparePreset option')).toHaveCount(5)
    await page.locator('#comparePreset').selectOption('treatment-pathway')
    await expect(page.locator('#compareMedicationA')).toBeVisible()
    await expect(page.locator('#comparisonDenominator')).toContainText('possible treatment–pathway cells')

    await page.getByRole('tab', { name: 'Cohort ledger' }).click()
    await expect(page.getByRole('tab', { name: 'Cohort ledger' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#cohortLedgerPanel')).toBeVisible()
    await expect(page.locator('#cohortStack .cohort-slab')).toHaveCount(3)
    await expect(page.locator('#cohortDenominator')).toContainText('18 conditions')
    await expect(page.locator('#cohortDenominator')).toContainText('27 pathways')
    await expect(page.locator('#cohortInspector')).toContainText('Select a cell')

    await page.getByRole('tab', { name: 'Treatments', exact: true }).click()
    await expect(page.locator('.cohort-slab[data-cohort-facet="medications"]')).toHaveClass(/active/)
    await expect(page.locator('#cohortDenominator')).toContainText('49 treatments')

    runtime.assertClean()
  })

  test('keeps the cohort ledger face-on and locally scrollable on a narrow screen', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Phenotype maps', exact: true }).click()
    await page.getByRole('tab', { name: 'Cohort ledger' }).click()

    await expect(page.locator('.cohort-slab.active')).toBeVisible()
    await expect(page.locator('.cohort-slab:not(.active)').first()).toBeHidden()
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      body: document.documentElement.scrollWidth,
      localClient: document.querySelector('.cohort-canvas-shell')?.clientWidth ?? 0,
      localScroll: document.querySelector('.cohort-canvas-shell')?.scrollWidth ?? 0
    }))
    expect(layout.body).toBeLessThanOrEqual(layout.viewport)
    expect(layout.localScroll).toBeGreaterThan(layout.localClient)

    runtime.assertClean()
  })

  test('uses the restrained clinical-editorial dark theme', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('body')).toHaveCSS('background-image', 'none')
    await expect(page.locator('.hero-main')).toHaveCSS('background-image', 'none')
    await expect(page.locator('.hero-main')).toHaveCSS('box-shadow', 'none')
    await expect(page.locator('.panel').first()).toHaveCSS('border-radius', '6px')
    await expect(page.locator('.tab-btn.active')).toHaveCSS('border-bottom-color', 'rgb(230, 159, 0)')

    await page.getByRole('button', { name: '3D systems explorer', exact: true }).click()
    await expect(page.locator('#network3d')).toBeVisible()

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('body')).toHaveCSS('background-image', 'none')

    runtime.assertClean()
  })

  test('publishes a closed relational contract with deterministic denominators and five states', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })

    const contract = await page.evaluate(() => {
      const atlas = (window as typeof window & {
        __ATLAS_V5__?: {
          schemaVersion: string
          manifest: {
            conditionIds: string[]
            medicationIds: string[]
            pathwayIds: string[]
            featureIds: string[]
            orderingSha256: string
          }
          validation: { ok: boolean; errors: string[] }
          relations: Array<{ origin: string; refs: string[] }>
          resolveCell: (rows: unknown[], threshold: string) => { state: string }
        }
      }).__ATLAS_V5__

      if (!atlas) return null
      const direct = { id: 'd', baseState: 'present', origin: 'direct', grade: 'B', strength: 2 }
      const derived = { id: 'r', baseState: 'present', origin: 'derived', grade: 'B', strength: 2 }
      const zero = { id: 'z', baseState: 'explicit-zero', origin: 'direct', grade: 'B', strength: 0 }
      return {
        schemaVersion: atlas.schemaVersion,
        counts: {
          conditions: atlas.manifest.conditionIds.length,
          medications: atlas.manifest.medicationIds.length,
          pathways: atlas.manifest.pathwayIds.length,
          features: atlas.manifest.featureIds.length,
          relations: atlas.relations.length,
        },
        hash: atlas.manifest.orderingSha256,
        validation: atlas.validation,
        states: [
          atlas.resolveCell([direct], 'B').state,
          atlas.resolveCell([zero], 'B').state,
          atlas.resolveCell([direct], 'A').state,
          atlas.resolveCell([], 'B').state,
          atlas.resolveCell([derived], 'B').state,
        ],
        everyRelationHasRefs: atlas.relations.every(row => row.refs.length > 0),
      }
    })

    expect(contract).not.toBeNull()
    expect(contract?.schemaVersion).toBe('5.0')
    expect(contract?.counts.conditions).toBe(18)
    expect(contract?.counts.medications).toBe(49)
    expect(contract?.counts.pathways).toBeGreaterThan(20)
    expect(contract?.counts.features).toBeGreaterThan(100)
    expect(contract?.counts.relations).toBeGreaterThan(300)
    expect(contract?.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(contract?.validation).toEqual({ ok: true, errors: [] })
    expect(contract?.states).toEqual(['direct', 'explicit-zero', 'filtered', 'unknown', 'derived'])
    expect(contract?.everyRelationHasRefs).toBe(true)

    runtime.assertClean()
  })
})
