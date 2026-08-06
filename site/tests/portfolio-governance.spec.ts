import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

test.describe('portfolio governance and application boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
  })

  test('catalog renders outcome, maturity, account, PHI, and data-flow disclosures', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: /Tools with explicit boundaries/i })).toBeVisible()
    await expect(page.getByText('No accounts. No tracking.')).toHaveCount(0)

    const ramie = page.locator('[data-app-slug="dermatology-scribe"]')
    await expect(ramie).toBeVisible()
    await expect(ramie).toContainText('Research prototype')
    await expect(ramie).toContainText('Configured backend')
    await expect(ramie).toContainText('PHI only in approved deployment')
    await expect(ramie).toContainText(/public demo is not approved/i)

    const search = page.getByLabel('Search applications')
    await search.fill('schedules')
    await expect(page.locator('[data-app-slug="scheduler-pro"]')).toBeVisible()
    await expect(page.locator('[data-app-slug="skinscores"]')).toBeHidden()
    await expect(page.locator('#apps-result-summary')).toContainText('1 application')

    await search.fill('labs')
    await expect(page.locator('[data-app-slug="biologic-monitoring"]')).toBeVisible()
    await expect(page.locator('#apps-empty')).toBeHidden()

    await search.fill('no-such-application-token')
    await expect(page.locator('#apps-empty')).toBeVisible()
    await expect(page.locator('#apps-result-summary')).toContainText('0 applications')

    runtime.assertClean()
  })

  test('RAMIE remains feature-rich while its research and PHI boundaries are unavoidable', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/dermatology-scribe/index.html', { waitUntil: 'networkidle' })

    const boundary = page.locator('.legacy-boundary--research')
    await expect(boundary).toBeVisible()
    await expect(boundary).toContainText('Research prototype')
    await expect(boundary).toContainText(/public demo is not approved for protected health information/i)
    await expect(page.locator('.legacy-shell__kicker')).toHaveText('Research')
    await expect(page.locator('[data-chip="saved"]')).toHaveText('Ready')
    await expect(page.locator('[data-chip="time"]')).toBeHidden()

    for (const capability of [
      'Begin transcription',
      'Differential Diagnosis',
      'Management Plan',
      'Clinical SOAP Note',
      'Start new conversation',
      'Resume session'
    ]) {
      await expect(page.locator('body')).toContainText(capability)
    }

    runtime.assertClean()
  })

  test('biologic reference validates its data before rendering and reconciles the IL-17/IBD contradiction', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/biologic-monitoring-dashboard/index.html', { waitUntil: 'networkidle' })

    await expect(page.locator('.legacy-boundary--warning')).toContainText('Clinical reference — review due')
    await expect(page.locator('#clinical-data-quality')).toHaveAttribute('data-state', 'valid')
    await expect(page.locator('#clinical-data-quality')).toContainText(/Dataset gate passed/i)
    await expect(page.locator('[data-chip="currency"]')).toContainText('Data as of September 23, 2025')
    await expect(page.locator('#results article.entry-card').first()).toBeVisible()

    const quality = await page.evaluate(() => window.BIOLOGIC_MONITORING_DATA_QUALITY)
    expect(quality.ok).toBe(true)
    expect(quality.errors).toEqual([])
    expect(quality.corrections.some((item) => item.entryId === 'il17-inhibitors')).toBe(true)

    runtime.assertClean()
  })

  test('historical WoundCare and local PDF Studio expose the correct route-specific boundaries', async ({ page }) => {
    let runtime = watchRuntime(page)
    await page.goto('/apps/WoundCareWebpages.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-boundary--archive')).toContainText('Historical archive · November 21, 2019')
    await expect(page.locator('.legacy-boundary--archive')).toContainText(/not a current wound-care reference/i)
    await expect(page.locator('.legacy-shell__kicker')).toHaveText('Archive')
    runtime.assertClean()

    runtime = watchRuntime(page)
    await page.goto('/apps/pdf-studio.html', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-boundary--local')).toContainText('Local-first utility')
    await expect(page.locator('.legacy-boundary--local')).toContainText(/does not upload documents/i)
    await expect(page.locator('.legacy-boundary--local')).toContainText(/not secure redaction/i)
    await expect(page.locator('.legacy-shell__kicker')).toHaveText('Productivity')
    runtime.assertClean()
  })

  test('mind-map library provides global topic discovery and an education boundary', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/apps/mindmaps/', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: /Choose a topic/i })).toBeVisible()
    await expect(page.getByRole('note')).toContainText(/Educational boundary/i)
    const cards = page.locator('.library-card')
    expect(await cards.count()).toBeGreaterThan(10)

    await page.getByLabel('Search topics').fill('alopecia')
    await expect(page.locator('#mindmap-library-count')).toContainText(/topic/)
    await expect(page.locator('.library-card:visible')).toHaveCount(1)
    await expect(page.locator('.library-card:visible')).toContainText(/alopecia/i)

    await page.getByLabel('Search topics').fill('definitely-not-a-topic')
    await expect(page.locator('#mindmap-library-empty')).toBeVisible()

    runtime.assertClean()
  })

  test('dermoscopy research dashboard states independent and repeated denominators and inference limits', async ({ page }) => {
    const runtime = watchRuntime(page)
    await page.goto('/research/dermoscopy-llm-dashboard', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: /100 unique images/i })).toBeVisible()
    await expect(page.locator('.research-boundary')).toContainText('10,200 model × prompt observations')
    await expect(page.locator('.research-boundary')).toContainText('100 unique images')
    await expect(page.locator('.research-boundary')).toContainText(/not.*10,200 independent clinical cases/i)
    await expect(page.locator('#dashboard-methods')).toContainText(/clustered bootstrap/i)
    await expect(page.locator('#dashboard-methods')).toContainText(/not a prospective diagnostic-accuracy study/i)
    await expect(page.locator('#dashboard-methods')).toContainText(/model snapshots/i)

    runtime.assertClean()
  })
})

declare global {
  interface Window {
    BIOLOGIC_MONITORING_DATA_QUALITY: {
      ok: boolean
      errors: Array<{ entryId: string; field: string; message: string }>
      corrections: Array<{ entryId: string; field: string; message: string }>
    }
  }
}
