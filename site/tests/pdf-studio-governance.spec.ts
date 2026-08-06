import { expect, test } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { watchRuntime } from './helpers/network.js'

async function makeTextPdf() {
  const document = await PDFDocument.create()
  const font = await document.embedFont(StandardFonts.Helvetica)
  const page = document.addPage([612, 792])
  page.drawText('PDF Studio text layer verification fixture', { x: 72, y: 700, size: 18, font })
  page.drawText('This sentence must be extracted from the existing PDF text layer.', { x: 72, y: 660, size: 11, font })
  return {
    name: 'text-layer-fixture.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await document.save())
  }
}

test.describe('PDF Studio release boundaries', () => {
  test('loads all runtime assets from the local origin', async ({ page }) => {
    const externalRequests: string[] = []
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) externalRequests.push(request.url())
    })
    const runtime = watchRuntime(page)

    await page.goto('/apps/pdf-studio.html?tool=organizer', { waitUntil: 'networkidle' })
    await expect(page.locator('.legacy-boundary--local')).toBeVisible()
    await expect(page.locator('.legacy-boundary--local')).toContainText(/does not upload documents/i)
    await expect(page.locator('.legacy-boundary--local')).toContainText(/not secure redaction/i)
    expect(externalRequests).toEqual([])

    runtime.assertClean()
  })

  test('detects the compatibility stub and emits explicitly labeled text-layer outputs', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makeTextPdf()

    await page.goto('/apps/pdf-studio.html?tool=ocr', { waitUntil: 'networkidle' })
    await expect(page.getByText('Capability boundary:', { exact: false })).toBeVisible()
    await expect(page.locator('#pdf-studio-subtitle')).toContainText(/verified local OCR engine/i)
    await page.locator('#ocr-file-input').setInputFiles(fixture)

    const runButton = page.getByRole('button', { name: /Run OCR \/ extract text layer/i })
    await expect(runButton).toBeEnabled()
    await runButton.click()

    await expect(page.locator('.pdf-ocr-queue-item [data-status]')).toHaveText(/done · text layer found/i)
    await expect(page.locator('.legacy-workflow__status[data-tone="error"]')).toContainText(/Text-layer extraction mode/i)
    await expect(page.locator('.pdf-output-list')).toContainText(/does not claim OCR/i)

    const downloads = page.locator('.pdf-output-list a[download]')
    await expect(downloads).toHaveCount(2)
    const names = await downloads.evaluateAll((links) => links.map((link) => link.getAttribute('download')))
    expect(names).toEqual(expect.arrayContaining([
      'text-layer-fixture_text_layer_preserved.pdf',
      'text-layer-fixture_text_layer.txt'
    ]))
    expect(names.some((name) => name?.endsWith('_ocr.txt'))).toBe(false)
    expect(names.some((name) => name?.endsWith('_searchable.pdf'))).toBe(false)

    runtime.assertClean()
  })
})
