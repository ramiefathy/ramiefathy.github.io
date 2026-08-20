import { expect, test, type Page } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-immune-atlas/'

async function openAtlas(page: Page, viewport = { width: 1440, height: 1050 }) {
  await setDeterministicUi(page, viewport)
  await blockExternalRequests(page)
  await page.addInitScript(() => localStorage.setItem('rd-theme', 'dark'))
  await page.goto(APP_ROUTE, { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('data-atlas-p0-remediation', /2026-08-03-p0/)
}

async function openNetwork(page: Page, viewport = { width: 1440, height: 1050 }) {
  await openAtlas(page, viewport)
  if (viewport.width <= 760) await page.locator('#mobileSectionSelect').selectOption('network')
  else await page.locator('.tab-btn[data-tab="network"]').click()
  await expect(page.locator('#network3d')).toBeVisible()
}

test.describe('Rheum–Derm Atlas P0 scientific-integrity remediation', () => {
  test('fails closed to reviewed phenotype links and preserves an auditable quarantine', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openAtlas(page)

    const audit = await page.evaluate(() => {
      const win = window as any
      const api = win.__ATLAS_P0__
      const data = api?.data
      const prohibited = [
        ['ra_skin', 'Palmar erythema'],
        ['sjogren', 'Fatigue/pain'],
        ['aps', 'Thrombocytopenia'],
        ['schnitzler', 'Monoclonal IgM (usually)'],
      ]
      const featureDomains = Object.fromEntries(
        ['Rheumatoid nodules', 'Palpable purpura', 'Sensorineural hearing loss', 'Calcinosis', 'Catastrophic APS']
          .map(label => [label, data.featureEntities.find((feature: any) => feature.label === label)?.domainKey])
      )
      return {
        validation: api?.validate(),
        conditions: data.conditions.map((condition: any) => condition.id),
        vasculitisEndotypes: api?.vasculitisEndotypes,
        counts: {
          default: api?.defaultLinks.length,
          exploratory: api?.exploratoryLinks.length,
          rejected: api?.rejectedLinks.length,
          rejectedEffects: api?.rejectedEffects.length,
          active: api?.activeLinks.length,
        },
        rejectedEffectsRegistry: Array.isArray(api?.rejectedEffects),
        effectAccounting: api?.data.meta.vasculitisEndotypeContract,
        rejectedEffectsHaveReasons: api?.rejectedEffects.every((effect: any) => Boolean(effect.rejectionReason)),
        genericSpanViolations: api?.defaultLinks.filter((link: any) => {
          const span = String(link.sourceSpan || '').toLowerCase()
          return (link.manifestation === 'Leg ulcers' && span.includes('oral ulcers')) ||
            (link.manifestation === 'Palpable purpura' && span.includes('retiform purpura')) ||
            (link.manifestation === 'Evanescent salmon rash' && span.includes('urticaria-like rash'))
        }).map((link: any) => ({ manifestation: link.manifestation, sourceSpan: link.sourceSpan })),
        defaultOrigins: [...new Set(api?.defaultLinks.map((link: any) => link.relationOrigin))],
        everyDefaultLinkClosed: api?.defaultLinks.every((link: any) =>
          !link.supportingMedication &&
          (link.relationOrigin === 'source-explicit' ? Boolean(link.sourceSpan) : Boolean(link.curatorDecision))
        ),
        prohibitedActive: prohibited.filter(([condition, manifestation]) =>
          api?.defaultLinks.some((link: any) => link.condition === condition && link.manifestation === manifestation)
        ),
        rejectionReasons: api?.rejectedLinks.filter((link: any) => prohibited.some(([condition, manifestation]) => link.condition === condition && link.manifestation === manifestation)).map((link: any) => link.rejectionReason),
        featureDomains,
        canonicalRulesActive: api?.canonicalRuleCount ?? -1,
        canonicalDefault: document.documentElement.dataset.atlasCanonicalBackground,
        exploratoryDefault: document.documentElement.dataset.atlasExploratoryMappings,
      }
    })

    expect(audit.validation).toEqual({ ok: true, errors: [] })
    expect(audit.conditions).toHaveLength(21)
    expect(audit.conditions).not.toContain('vasculitis')
    expect(audit.vasculitisEndotypes).toEqual(['aav', 'egpa', 'gca', 'immune_complex_vasculitis'])
    expect(audit.counts.default).toBeGreaterThan(40)
    expect(audit.counts.exploratory).toBeGreaterThan(0)
    expect(audit.counts.rejected).toBeGreaterThan(0)
    expect(audit.counts.rejectedEffects).toBe(audit.effectAccounting.rejectedTreatmentEffects)
    expect(audit.rejectedEffectsRegistry).toBe(true)
    expect(audit.rejectedEffectsHaveReasons).toBe(true)
    expect(audit.effectAccounting.treatmentEffectAccountingComplete).toBe(true)
    expect(audit.effectAccounting.acceptedSourceTreatmentEffects + audit.effectAccounting.rejectedTreatmentEffects).toBe(audit.effectAccounting.sourceTreatmentEffects)
    expect(audit.genericSpanViolations).toEqual([])
    expect(audit.counts.active).toBe(audit.counts.default)
    expect(audit.defaultOrigins.sort()).toEqual(['curator-confirmed', 'source-explicit'])
    expect(audit.everyDefaultLinkClosed).toBe(true)
    expect(audit.prohibitedActive).toEqual([])
    expect(audit.rejectionReasons.length).toBeGreaterThanOrEqual(4)
    expect(audit.rejectionReasons.every(Boolean)).toBe(true)
    expect(audit.featureDomains).toEqual({
      'Rheumatoid nodules': 'granulomatous_necrobiotic',
      'Palpable purpura': 'purpuric_vascular',
      'Sensorineural hearing loss': 'otologic',
      Calcinosis: 'calcification',
      'Catastrophic APS': 'thromboinflammatory_crisis',
    })
    expect(audit.canonicalRulesActive).toBe(0)
    expect(audit.canonicalDefault).toBe('false')
    expect(audit.exploratoryDefault).toBe('false')
    runtime.assertClean()
  })

  test('splits vasculitis into non-propagating endotype contexts', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openAtlas(page)

    const scopes = await page.evaluate(() => {
      const data = (window as any).__ATLAS_P0__.data
      const byCondition = Object.fromEntries(['aav', 'egpa', 'gca', 'immune_complex_vasculitis'].map(condition => [condition, {
        pathwayFamilies: data.pathways.filter((pathway: any) => pathway.condition === condition).map((pathway: any) => pathway.family),
        effects: data.effects.filter((effect: any) => effect.condition === condition).map((effect: any) => effect.med),
        links: data.defaultManifestationLinks.filter((link: any) => link.condition === condition).map((link: any) => link.manifestation),
      }]))
      return byCondition
    })

    expect(scopes.aav.pathwayFamilies).toContain('ANCA / neutrophil')
    expect(scopes.aav.effects).toContain('avacopan')
    expect(scopes.aav.effects).not.toContain('mepo')
    expect(scopes.egpa.pathwayFamilies).toContain('Eosinophilic')
    expect(scopes.egpa.effects).toEqual(expect.arrayContaining(['mepo', 'benra', 'systemic_gc']))
    expect(scopes.egpa.links).toContain('Asthma/eosinophilia')
    expect(scopes.egpa.links).not.toContain('Cranial ischemia')
    expect(scopes.gca.pathwayFamilies).toContain('IL-6 / arterial wall')
    expect(scopes.gca.effects).toEqual(expect.arrayContaining(['tociliz', 'jaki', 'systemic_gc']))
    expect(scopes.immune_complex_vasculitis.pathwayFamilies).toContain('Immune complex')
    expect(scopes.immune_complex_vasculitis.effects).toContain('dapsone')
    runtime.assertClean()
  })

  test('uses reviewed-versus-exploratory relationship language throughout the manifestation workbench', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openAtlas(page)
    await page.evaluate(() => (window as any).gotoTab('manifestationMap'))

    await expect(page.locator('#manifestTableMode option')).toHaveText([
      'All relationship types',
      'Source-explicit',
      'Curator-confirmed',
    ])
    await expect(page.locator('#manifestTableMode')).not.toContainText('Directly named')
    await expect(page.locator('#manifestTableMode')).not.toContainText('Therapeutically triangulated')
    await expect(page.locator('#manifestMatrixLegend')).toContainText('Source-explicit / curator-confirmed')
    await expect(page.locator('#manifestMatrixLegend')).toContainText('Domain / lexical hypothesis')
    await expect(page.locator('#manifestMatrixLegend')).toContainText('Therapy-informed hypothesis')
    await expect(page.locator('#manifestCellInfo')).toContainText('exact source span or documented curator decision')

    await page.evaluate(() => (window as any).__ATLAS_P0__.setExploratoryMappings(true))
    await expect(page.locator('#manifestTableMode option')).toHaveText([
      'All relationship types',
      'Source-explicit',
      'Curator-confirmed',
      'Domain-level hypothesis',
      'Therapy-informed hypothesis',
      'Lexical hypothesis',
    ])
    await page.locator('#manifestTableMode').selectOption('Therapy-informed hypothesis')
    await expect(page.locator('#manifestLinkStatus')).toContainText('mapped pairs')

    await page.evaluate(() => (window as any).__ATLAS_P0__.setExploratoryMappings(false))
    await expect(page.locator('#manifestTableMode')).toHaveValue('')
    await expect(page.locator('#manifestTableMode option')).toHaveCount(3)
    runtime.assertClean()
  })

  test('keeps exploratory and canonical-background hypotheses opt-in and reversible', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNetwork(page)
    await page.locator('#networkAdvancedControls summary').click()

    const exploratory = page.locator('#networkExploratoryMappings')
    const canonical = page.locator('#networkCanonicalBackground')
    await expect(exploratory).not.toBeChecked()
    await expect(canonical).not.toBeChecked()
    await expect(page.locator('#networkEvidenceBoundary')).toContainText('Default scientific view')

    const initial = await page.evaluate(() => ({
      links: (window as any).__ATLAS_P0__.activeLinks.length,
      canonicalEdges: (window as any).__ATLAS_P0__.graphEdges.filter((edge: any) => edge.meta?.canonical).length,
    }))
    expect(initial.canonicalEdges).toBe(0)

    await exploratory.check()
    await expect(page.locator('html')).toHaveAttribute('data-atlas-exploratory-mappings', 'true')
    await expect(page.locator('#networkEvidenceBoundary')).toContainText('Expanded exploratory view')
    const expanded = await page.evaluate(() => {
      const api = (window as any).__ATLAS_P0__
      const key = (link: any) => `${link.id}|${link.condition}|${link.pathIndex}|${link.manifestation}`
      const activeKeys = new Set(api.activeLinks.map(key))
      const rejectedKeys = new Set(api.rejectedLinks.map(key))
      return {
        links: api.activeLinks.length,
        unreviewed: api.activeLinks.filter((link: any) => link.curationStatus === 'unreviewed').length,
        rejectedOverlap: [...activeKeys].filter(keyValue => rejectedKeys.has(keyValue)),
      }
    })
    expect(expanded.links).toBeGreaterThan(initial.links)
    expect(expanded.unreviewed).toBeGreaterThan(0)
    expect(expanded.rejectedOverlap).toEqual([])

    await canonical.check()
    await expect(page.locator('html')).toHaveAttribute('data-atlas-canonical-background', 'true')
    const canonicalState = await page.evaluate(() => ({
      count: (window as any).__ATLAS_P0__.graphEdges.filter((edge: any) => edge.meta?.canonical).length,
      validation: (window as any).__ATLAS_P0__.validate(),
    }))
    expect(canonicalState.count).toBeGreaterThan(0)
    expect(canonicalState.validation).toEqual({ ok: true, errors: [] })

    await canonical.uncheck()
    await exploratory.uncheck()
    await expect(page.locator('html')).toHaveAttribute('data-atlas-canonical-background', 'false')
    await expect(page.locator('html')).toHaveAttribute('data-atlas-exploratory-mappings', 'false')
    await expect(page.locator('#networkEvidenceBoundary')).toContainText('Default scientific view')
    const restored = await page.evaluate(() => ({
      links: (window as any).__ATLAS_P0__.activeLinks.length,
      canonicalEdges: (window as any).__ATLAS_P0__.graphEdges.filter((edge: any) => edge.meta?.canonical).length,
    }))
    expect(restored.links).toBe(initial.links)
    expect(restored.canonicalEdges).toBe(0)

    const raced = await page.evaluate(async () => {
      const api = (window as any).__ATLAS_P0__
      await Promise.all([
        api.setExploratoryMappings(true),
        api.setCanonicalBackground(true),
        api.setExploratoryMappings(false),
        api.setCanonicalBackground(false),
      ])
      return {
        exploratory: document.documentElement.dataset.atlasExploratoryMappings,
        canonical: document.documentElement.dataset.atlasCanonicalBackground,
        links: api.activeLinks.length,
        canonicalEdges: api.graphEdges.filter((edge: any) => edge.meta?.canonical).length,
        validation: api.validate(),
      }
    })
    expect(raced).toEqual({
      exploratory: 'false',
      canonical: 'false',
      links: initial.links,
      canonicalEdges: 0,
      validation: { ok: true, errors: [] },
    })
    runtime.assertClean()
  })

  test('renders all explorer representations and primary interactions without runtime failures', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNetwork(page)

    const representations = await page.locator('[data-network-representation]').evaluateAll(buttons => buttons.map(button => ({
      name: button.textContent?.trim() || '',
      panel: button.getAttribute('aria-controls') || '',
    })))
    expect(representations).toHaveLength(7)

    for (const representation of representations) {
      await page.getByRole('tab', { name: representation.name, exact: true }).click()
      await expect(page.locator(`#${representation.panel}`)).toBeVisible()
    }

    await page.getByRole('tab', { name: 'Free-space', exact: true }).click()
    await page.locator('#networkCondition').selectOption('egpa')
    await expect(page.locator('#networkCondition')).toHaveValue('egpa')
    await page.locator('#networkSearch').fill('IL-5')
    await page.locator('#networkSearch').press('Enter')
    await expect(page.locator('#networkSelectionStatus')).not.toContainText('No graph selection')
    await page.getByRole('button', { name: 'Causal front' }).click()
    await page.getByRole('button', { name: 'Reset' }).click()
    runtime.assertClean()
  })

  test('desktop and mobile evidence-boundary layouts remain contained and visually reviewable', async ({ page }) => {
    const runtime = watchRuntime(page)
    await openNetwork(page, { width: 1440, height: 1050 })
    await page.locator('#networkAdvancedControls summary').click()
    const desktop = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      boundary: document.querySelector('#networkEvidenceBoundary')?.getBoundingClientRect().toJSON(),
      controls: document.querySelector('#networkAdvancedControls')?.getBoundingClientRect().toJSON(),
    }))
    expect(desktop.documentWidth).toBeLessThanOrEqual(desktop.viewport)
    expect(desktop.boundary?.width).toBeGreaterThan(300)
    expect(desktop.controls?.right).toBeLessThanOrEqual(desktop.viewport)
    await page.locator('#network').screenshot({ path: 'test-results/p0-visual/default-desktop.png' })

    await page.locator('#networkExploratoryMappings').check()
    await page.locator('#networkCanonicalBackground').check()
    await page.locator('#network').screenshot({ path: 'test-results/p0-visual/expanded-desktop.png' })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => (window as any).gotoTab('network'))
    await expect(page.locator('#networkMobileNavigator')).toBeVisible()
    const mobile = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      boundary: document.querySelector('#networkEvidenceBoundary')?.getBoundingClientRect().toJSON(),
      navigator: document.querySelector('#networkMobileNavigator')?.getBoundingClientRect().toJSON(),
    }))
    expect(mobile.documentWidth).toBeLessThanOrEqual(mobile.viewport)
    expect(mobile.boundary?.left).toBeGreaterThanOrEqual(0)
    expect(mobile.boundary?.right).toBeLessThanOrEqual(mobile.viewport)
    expect(mobile.navigator?.right).toBeLessThanOrEqual(mobile.viewport)
    await page.locator('#network').screenshot({ path: 'test-results/p0-visual/expanded-mobile.png' })
    runtime.assertClean()
  })
})
