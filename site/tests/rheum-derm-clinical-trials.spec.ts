import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const APP_ROUTE = '/apps/rheum-derm-clinical-trials/'

test.describe('Rheum–Derm Clinical Trials Evidence Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1440, height: 1000 })
    await blockExternalRequests(page)
  })

  test('preserves the 214-row denominator while making every listing identifiable', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(`${APP_ROUTE}#view=studies`, { waitUntil: 'networkidle' })

    const audit = await page.locator('#dashboard-data').evaluate(element => {
      const app = JSON.parse(element.textContent || '{}')
      const generic = /^(?:phase\s*[123](?:a|b)?|randomi[sz]ed(?: controlled)? trial|open-label trial|prospective study)/i
      return {
        studies: app.studies.length,
        displayTitles: app.studies.filter((study: { displayTitle?: string }) => Boolean(study.displayTitle)).length,
        genericDisplayTitles: app.studies.filter((study: { displayTitle?: string }) => generic.test(study.displayTitle || '')).length,
        uniqueDisplayTitles: new Set(app.studies.map((study: { displayTitle: string }) => study.displayTitle)).size,
        regimenStatuses: Object.values(app.meta.regimenDetailCounts as Record<string, number>)
          .reduce((total: number, count) => total + count, 0),
        quarantined: app.meta.sourceMismatchQuarantined,
      }
    })

    expect(audit).toEqual({
      studies: 214,
      displayTitles: 214,
      genericDisplayTitles: 0,
      uniqueDisplayTitles: 214,
      regimenStatuses: 214,
      quarantined: 1,
    })
    await expect(page.locator('.study-card').first().locator('.study-regimen-label')).toHaveText('Study regimen')
    await expect(page.locator('.study-card').first().locator('.regimen-status')).not.toBeEmpty()

    runtime.assertClean()
  })

  test('shows source-backed dosing and corrected names for the cited examples', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(`${APP_ROUTE}#view=studies&q=dazukibart`, { waitUntil: 'networkidle' })

    const phase2 = page.locator('.study-card').filter({
      has: page.locator('[data-study="s087-phase-2-proof-of-concept"]'),
    }).first()
    await expect(phase2).toContainText('Dazukibart phase 2 dermatomyositis trial')
    await expect(phase2).toContainText('150 or 600 mg every 4 weeks for 3 doses')
    await phase2.getByRole('button', { name: 'Details' }).click()
    await expect(page.getByRole('heading', { level: 2, name: /Dazukibart phase 2 dermatomyositis trial/ })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Study regimen' })).toBeVisible()
    await expect(page.locator('#detailDialog').getByText('Dose detail reconciled to the primary publication').first()).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()

    await page.locator('#globalSearch').fill('DETERMINE')
    const determine = page.locator('.study-card').filter({
      has: page.locator('[data-study="s082-resolve-1"]'),
    }).first()
    await expect(determine).toContainText('DETERMINE — Lenabasum for Adult dermatomyositis')
    await expect(determine).toContainText('20 mg twice daily')

    runtime.assertClean()
  })

  test('quarantines the mismatched brepocitinib record and exposes the rejected identifier', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto(`${APP_ROUTE}#view=studies&q=brepocitinib`, { waitUntil: 'networkidle' })

    const quarantined = page.locator('.study-card').filter({
      has: page.locator('[data-study="s085-phase-2-randomized-trial"]'),
    }).first()
    await expect(quarantined).toContainText('quarantined source-mismatched record')
    await expect(quarantined).toContainText('Do not use: source identity mismatch')
    await quarantined.getByRole('button', { name: 'Details' }).click()

    const detail = page.locator('#detailDialog')
    await expect(detail.getByText('Source mismatch / Quarantined', { exact: true })).toBeVisible()
    await detail.getByText('Source metadata and verification notes').click()
    await expect(detail.getByText(/Rejected NCT04027101.*baricitinib.*polymyalgia rheumatica/i)).toBeVisible()
    await expect(detail.getByText(/No verified phase 2 efficacy result is reported/i)).toBeVisible()
    await expect(detail.getByText(/verified brepocitinib dermatomyositis evidence is.*VALOR/i)).toBeVisible()

    runtime.assertClean()
  })

  test('keeps regimen and source labels usable on a phone-sized listing', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${APP_ROUTE}#view=studies&q=RAPIDS-2`, { waitUntil: 'networkidle' })

    const card = page.locator('.study-card').filter({
      has: page.locator('[data-study="s116-rapids-2"]'),
    }).first()
    await expect(card).toBeVisible()
    await expect(card).toContainText('62.5 mg twice daily for 4 weeks')
    await expect(card).toContainText('125 mg twice daily for 20 weeks')
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      body: document.documentElement.scrollWidth,
    }))
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)

    runtime.assertClean()
  })
})
