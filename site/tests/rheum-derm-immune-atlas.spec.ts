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
    await expect(page.locator('#comparisonStateLegend [data-state]')).toHaveCount(4)
    await expect(page.locator('#comparisonMatrix')).toHaveAttribute('aria-label', /orthographic comparison matrix/i)

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
})
