import { expect, test } from '@playwright/test'
import { blockExternalRequests, watchRuntime } from './helpers/network.js'
import { setDeterministicUi } from './helpers/nav.js'

const route = '/apps/dermatology-scribe/index.html'

async function injectMaterialOutput(page, selector, text) {
  await page.locator(selector).evaluate((element, value) => {
    element.innerHTML = `<p>${value}</p>`
  }, text)
}

test.describe('RAMIE clinician output adjudication', () => {
  test.beforeEach(async ({ page }) => {
    await setDeterministicUi(page, { width: 1280, height: 900 })
    await blockExternalRequests(page)
    await page.goto(route, { waitUntil: 'networkidle' })
  })

  test('marks generated differential, plan, and note output as unreviewed', async ({ page }) => {
    const runtime = watchRuntime(page)
    await injectMaterialOutput(page, '#differentialOutput', 'Possible diagnoses include allergic contact dermatitis, irritant contact dermatitis, and atopic dermatitis. Correlate with exposure history and examination.')
    await injectMaterialOutput(page, '#managementPlanResult', 'Review the exposure history, consider patch testing when clinically appropriate, verify medication history, and provide a clinician-reviewed treatment and follow-up plan.')
    await injectMaterialOutput(page, '#soapNoteOutput', 'Subjective: Patient reports an itchy eruption after a new topical exposure. Objective: Examination findings require clinician confirmation. Assessment and plan: Generated draft requires source review before use.')

    const panels = page.locator('.ramie-output-review')
    await expect(panels).toHaveCount(3)
    for (const id of ['differential', 'management-plan', 'soap-note']) {
      const panel = page.locator(`[data-output-review-for="${id}"]`)
      await expect(panel).toBeVisible()
      await expect(panel).toHaveAttribute('data-status', 'unreviewed')
      await expect(panel).toContainText(/Generated content is unverified/i)
    }
    expect(await page.evaluate(() => window.RamieOutputReview.canExport())).toBe(false)
    runtime.assertClean()
  })

  test('requires every clinically material check before acceptance', async ({ page }) => {
    await injectMaterialOutput(page, '#managementPlanResult', 'Start a clinician-selected treatment only after confirming diagnosis, allergies, pregnancy status, comorbidities, medication interactions, monitoring, dose, route, frequency, and follow-up.')
    const panel = page.locator('[data-output-review-for="management-plan"]')
    await panel.getByRole('button', { name: 'Accept reviewed output' }).click()
    await expect(panel.getByRole('alert')).toContainText(/Complete all/i)
    await expect(panel).toHaveAttribute('data-status', 'unreviewed')

    const checks = panel.getByRole('checkbox')
    const count = await checks.count()
    expect(count).toBeGreaterThanOrEqual(5)
    for (let index = 0; index < count; index += 1) await checks.nth(index).check()
    await panel.getByRole('button', { name: 'Accept reviewed output' }).click()
    await expect(panel).toHaveAttribute('data-status', 'accepted')
    expect(await page.evaluate(() => window.RamieOutputReview.getRecord('management-plan')?.status)).toBe('accepted')
  })

  test('makes accepted output stale after any generated-content change', async ({ page }) => {
    await injectMaterialOutput(page, '#soapNoteOutput', 'Subjective: Initial generated note content with sufficient detail for the review panel. Objective, assessment, and plan remain clinician-review drafts and are not verified facts.')
    expect(await page.evaluate(() => window.RamieOutputReview.accept('soap-note'))).toBe(true)
    const panel = page.locator('[data-output-review-for="soap-note"]')
    await expect(panel).toHaveAttribute('data-status', 'accepted')

    await injectMaterialOutput(page, '#soapNoteOutput', 'Subjective: The generated note was changed after acceptance. Objective: New generated examination content. Assessment and plan: This modified text must be reviewed again.')
    await expect(panel).toHaveAttribute('data-status', 'stale')
    expect(await page.evaluate(() => window.RamieOutputReview.canExport())).toBe(false)
  })

  test('blocks clinical export controls but does not block session saving', async ({ page }) => {
    await injectMaterialOutput(page, '#soapNoteOutput', 'Subjective: Unreviewed generated note. Objective: Unverified generated examination. Assessment and plan: This draft may not be exported as reviewed clinical documentation.')

    await page.evaluate(() => {
      const exportButton = document.createElement('button')
      exportButton.type = 'button'
      exportButton.id = 'exportNoteBtn'
      exportButton.textContent = 'Export clinical note'
      exportButton.addEventListener('click', () => { window.__ramieExportInvoked = true })
      document.body.append(exportButton)

      const saveButton = document.createElement('button')
      saveButton.type = 'button'
      saveButton.id = 'testSaveSession'
      saveButton.textContent = 'Save session fixture'
      saveButton.addEventListener('click', () => { window.__ramieSaveInvoked = true })
      document.body.append(saveButton)
    })

    await page.locator('#exportNoteBtn').click()
    await expect(page.locator('#ramie-export-review-notice')).toBeVisible()
    expect(await page.evaluate(() => window.__ramieExportInvoked)).not.toBe(true)

    await page.locator('#testSaveSession').click()
    expect(await page.evaluate(() => window.__ramieSaveInvoked)).toBe(true)

    expect(await page.evaluate(() => window.RamieOutputReview.accept('soap-note'))).toBe(true)
    await page.locator('#exportNoteBtn').click()
    expect(await page.evaluate(() => window.__ramieExportInvoked)).toBe(true)
  })

  test('persists accepted review only for the unchanged session output fingerprint', async ({ page }) => {
    const text = 'Subjective: Stable generated note content. Objective: Findings require clinician confirmation. Assessment and plan: Draft reviewed for this browser session only.'
    await injectMaterialOutput(page, '#soapNoteOutput', text)
    expect(await page.evaluate(() => window.RamieOutputReview.accept('soap-note'))).toBe(true)
    const stored = await page.evaluate(() => sessionStorage.getItem('ramie.output-review.v1'))
    expect(stored).toContain('accepted')

    await page.reload({ waitUntil: 'networkidle' })
    await injectMaterialOutput(page, '#soapNoteOutput', text)
    await expect(page.locator('[data-output-review-for="soap-note"]')).toHaveAttribute('data-status', 'accepted')

    await injectMaterialOutput(page, '#soapNoteOutput', `${text} Additional changed sentence.`)
    await expect(page.locator('[data-output-review-for="soap-note"]')).toHaveAttribute('data-status', 'stale')
  })
})

declare global {
  interface Window {
    RamieOutputReview: {
      getRecords: () => Array<{ id: string; status: string }>
      getRecord: (id: string) => { id: string; status: string } | null
      canExport: () => boolean
      unresolved: () => Array<{ id: string; status: string }>
      accept: (id: string) => boolean
    }
    __ramieExportInvoked?: boolean
    __ramieSaveInvoked?: boolean
  }
}
