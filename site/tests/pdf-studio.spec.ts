import { expect, test, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const DESKTOP_VIEWPORT = { width: 1280, height: 900 }

const CONTROL_KEY = process.platform === 'darwin' ? 'Meta' : 'Control'

type RuntimeWatch = {
  assertClean: () => void
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function watchRuntime(page: Page): RuntimeWatch {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const requestFailures: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text()
      if (!/Failed to initialize PDF Studio/i.test(text)) {
        consoleErrors.push(text)
      }
    }
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })
  page.on('requestfailed', (request) => {
    const url = request.url()
    if (url.startsWith('http://127.0.0.1:4321/')) {
      requestFailures.push(`${request.method()} ${url} :: ${request.failure()?.errorText || 'unknown'}`)
    }
  })

  return {
    assertClean() {
      expect(consoleErrors).toEqual([])
      expect(pageErrors).toEqual([])
      expect(requestFailures).toEqual([])
    }
  }
}

async function makePdfFixture(name: string, pageCount: number, options?: { title?: string; author?: string }) {
  const document = await PDFDocument.create()
  const headingFont = await document.embedFont(StandardFonts.HelveticaBold)
  const bodyFont = await document.embedFont(StandardFonts.Helvetica)

  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([612, 792])
    page.drawText(`Fixture ${name} — Page ${index + 1}`, {
      x: 72,
      y: 720,
      size: 24,
      font: headingFont,
      color: rgb(0.1, 0.2, 0.35)
    })
    page.drawText(`Body text for OCR and extraction checks on page ${index + 1}.`, {
      x: 72,
      y: 682,
      size: 12,
      font: bodyFont,
      color: rgb(0.18, 0.23, 0.31)
    })
  }

  if (options?.title) document.setTitle(options.title)
  if (options?.author) document.setAuthor(options.author)
  document.setSubject('PDF Studio e2e fixture')
  document.setKeywords(['pdf-studio', 'playwright', 'fixture'])

  return {
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from(await document.save())
  }
}

const PNG_FIXTURE_A = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='
const PNG_FIXTURE_B = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP8z/D/PwAHggJ/l8nXWQAAAABJRU5ErkJggg=='

function makePngFixture(name: string, base64: string) {
  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64')
  }
}

async function attachPdfToFirstInput(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const input = page.locator('.cl-file-input input[type="file"]').first()
  await expect(input).toHaveCount(1)
  await input.setInputFiles(file)
}

async function attachFilesToInput(
  page: Page,
  selector: string,
  files: Array<{ name: string; mimeType: string; buffer: Buffer }>
) {
  const input = page.locator(selector)
  await expect(input).toHaveCount(1)
  await input.setInputFiles(files.length === 1 ? files[0] : files)
  await input.dispatchEvent('change')
}

async function writeFixtureToTempPath(file: { name: string; buffer: Buffer }): Promise<string> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const targetPath = path.join(tmpdir(), `pdf-studio-${stamp}-${file.name}`)
  await writeFile(targetPath, file.buffer)
  return targetPath
}

test.describe('PDF Studio professional suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT)
  })

  test('organizer supports reorder, rotate/delete, export, and keyboard controls', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makePdfFixture('organizer-fixture.pdf', 4)

    await page.goto('/apps/pdf-studio.html?tool=organizer', { waitUntil: 'networkidle' })
    await attachPdfToFirstInput(page, fixture)
    await expect(page.locator('#organizer-file-status')).toContainText('organizer-fixture.pdf')

    const tiles = page.locator('.pdf-thumb-tile')
    await expect(tiles).toHaveCount(4)
    await tiles.nth(0).dragTo(tiles.nth(2))

    await tiles.nth(1).click()
    await page.keyboard.down(CONTROL_KEY)
    await tiles.nth(2).click()
    await page.keyboard.up(CONTROL_KEY)

    await page.click('button[data-action="rotate-right"]')
    await page.click('button[data-action="delete-toggle"]')
    await expect(page.locator('.legacy-workflow__section:has-text("Preflight")')).toContainText('Pages: 4.')
    await expect(page.locator('.pdf-thumb-chip[data-tone="danger"]')).toHaveCount(2)

    await page.click('button:has-text("Save Updated PDF")')
    await expect(page.locator('.pdf-output-list')).toContainText('_organized.pdf')

    await tiles.first().click()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.pdf-thumb-tile.is-selected')).toHaveAttribute('data-page', '2')
    await page.keyboard.press('r')
    await expect(page.locator('.pdf-thumb-tile.is-selected .pdf-thumb-chip[data-tone="info"]')).toContainText('Rotated')
    await page.keyboard.press('Escape')
    await expect(page.locator('.pdf-thumb-tile.is-selected')).toHaveCount(0)

    runtime.assertClean()
  })

  test('extract tool validates ranges and supports single + split outputs', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makePdfFixture('extract-fixture.pdf', 5)

    await page.goto('/apps/pdf-studio.html?tool=extract', { waitUntil: 'networkidle' })
    await attachPdfToFirstInput(page, fixture)
    await expect(page.locator('#extract-file-status')).toContainText('(5 pages)')

    await page.fill('#extract-range-input', '1-2, 4')
    await page.click('button:has-text("Apply range selection")')
    await expect(page.locator('.legacy-workflow__section:has-text("Range Builder")')).toContainText('Applied 3 page(s) from 2 range block(s).')

    await page.click('button:has-text("Generate output")')
    await expect(page.locator('.pdf-output-list')).toContainText('_extract.pdf')

    await page.selectOption('#extract-mode-select', 'ranges')
    await page.click('button:has-text("Generate output")')
    await expect(page.locator('.pdf-output-list')).toContainText('_range_1-2.pdf')
    await expect(page.locator('.pdf-output-list')).toContainText('_range_4-4.pdf')

    runtime.assertClean()
  })

  test('image packet builder supports image reorder, preview, and packet output', async ({ page }) => {
    const runtime = watchRuntime(page)

    await page.goto('/apps/pdf-studio.html?tool=image', { waitUntil: 'networkidle' })
    await attachFilesToInput(page, '#image-packet-input', [
      makePngFixture('clinic-photo-a.png', PNG_FIXTURE_A),
      makePngFixture('clinic-photo-b.png', PNG_FIXTURE_B)
    ])

    await expect(page.locator('#image-packet-status')).toContainText('2 image(s) loaded')
    await expect(page.locator('.legacy-workflow__section:has-text("Preflight")')).toContainText('2 image(s) queued')

    const tiles = page.locator('.pdf-thumb-tile')
    await expect(tiles).toHaveCount(2)
    await tiles.nth(1).dragTo(tiles.nth(0))

    await page.fill('.pdf-thumb-tile:first-child input[placeholder="Optional caption"]', 'Anterior lesion photo')
    await page.click('button:has-text("Build PDF packet")')
    await expect(page.locator('.pdf-output-list')).toContainText('image_packet_')

    runtime.assertClean()
  })

  test('stamp tool previews template and generates stamped output', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makePdfFixture('stamp-fixture.pdf', 3)

    await page.goto('/apps/pdf-studio.html?tool=stamp', { waitUntil: 'networkidle' })
    await attachPdfToFirstInput(page, fixture)
    await expect(page.locator('#stamp-file-status')).toContainText('(3 pages)')

    await page.fill('#stamp-label-text', 'Clinic Packet')
    await page.check('#stamp-enable-bates')
    await page.fill('#stamp-bates-prefix', 'RF-')
    await page.fill('#stamp-bates-start', '100')
    await page.selectOption('#stamp-position', 'bottom-right')

    await expect(page.locator('.legacy-workflow__section:has-text("Preflight")')).toContainText('Applying template to 3 page(s)')
    await expect(page.locator('.legacy-workflow__section:has-text("Preview") canvas')).toBeVisible()

    await page.click('button:has-text("Apply stamps")')
    await expect(page.locator('.pdf-output-list')).toContainText('_stamped.pdf')

    runtime.assertClean()
  })

  test('packet assembler supports separators, toc, and output build', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixtureA = await makePdfFixture('labs.pdf', 2)
    const fixtureB = await makePdfFixture('pathology.pdf', 1)

    await page.goto('/apps/pdf-studio.html?tool=assemble', { waitUntil: 'networkidle' })
    await page.locator('#assembler-file-input').setInputFiles([fixtureA, fixtureB])
    await expect(page.locator('#assembler-file-status')).toContainText('2 PDF block(s) ready')

    await page.click('button:has-text("+ Insert separator page")')
    await page.fill('input[placeholder="Separator title"]', 'Pathology Divider')
    await page.check('#assembler-include-toc')
    await expect(page.locator('.legacy-workflow__section:has-text("Preflight")')).toContainText('Separators: 1')

    await page.click('button:has-text("Assemble packet")')
    await expect(page.locator('.pdf-output-list')).toContainText('assembled_packet_')

    runtime.assertClean()
  })

  test('metadata tool shows before/after diff and scrubs fields', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makePdfFixture('metadata-fixture.pdf', 2, {
      title: 'Sensitive Packet',
      author: 'Derm Team'
    })
    const fixturePath = await writeFixtureToTempPath(fixture)

    await page.goto('/apps/pdf-studio.html?tool=metadata', { waitUntil: 'networkidle' })
    await page.locator('#metadata-file-input').setInputFiles(fixturePath)
    await expect(page.locator('#metadata-file-status')).toContainText('metadata-fixture.pdf')

    await expect(page.locator('.legacy-workflow__section:has-text("Metadata Diff")')).toContainText('Sensitive Packet')
    await expect(page.locator('.legacy-workflow__section:has-text("What this does / does not do")')).toContainText('not de-identification')

    await page.fill('#metadata-new-title', 'Consult Note')
    await page.fill('#metadata-new-author', 'Clinic Team')
    await page.click('button:has-text("Scrub metadata")')
    await expect(page.locator('.pdf-output-list')).toContainText('_metadata_scrubbed.pdf')
    await expect(page.locator('.legacy-workflow__section:has-text("Metadata Diff")')).toContainText('Consult Note')

    runtime.assertClean()
  })

  test('OCR tool runs queue and emits searchable PDF plus txt output', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makePdfFixture('ocr-fixture.pdf', 1)

    await page.goto('/apps/pdf-studio.html?tool=ocr', { waitUntil: 'networkidle' })
    await attachFilesToInput(page, '#ocr-file-input', [fixture])
    await expect(page.locator('#ocr-file-status')).toContainText('(1 pages)')

    await page.selectOption('#ocr-page-scope', 'selected')
    await page.fill('#ocr-page-range', '1')
    await page.click('button:has-text("Run OCR")')

    await expect(page.locator('.pdf-ocr-queue-item [data-status]')).toHaveText(/done|failed|done \(no text\)/)
    await expect(page.locator('.pdf-output-list')).toContainText('_searchable.pdf')
    await expect(page.locator('.pdf-output-list')).toContainText('_ocr.txt')
    await expect(page.locator('button:has-text("Run OCR")')).toBeEnabled()

    runtime.assertClean()
  })

  test('compress tool supports both raster and preserve-text attempt flows', async ({ page }) => {
    const runtime = watchRuntime(page)
    const fixture = await makePdfFixture('compress-fixture.pdf', 3)

    await page.goto('/apps/pdf-studio.html?tool=compress', { waitUntil: 'networkidle' })
    await attachFilesToInput(page, '#compress-file-input', [fixture])
    await expect(page.locator('#compress-file-status')).toContainText('(3 pages)')

    await page.selectOption('#compress-mode', 'raster')
    await page.click('button:has-text("Reduce file size")')
    await expect(page.locator('.pdf-output-list')).toContainText('_compressed.pdf')
    await expect(page.locator('.pdf-output-list')).toContainText('Rasterized pages:')

    await page.selectOption('#compress-mode', 'preserve')
    await page.selectOption('#compress-scope', 'selected')
    await page.fill('#compress-range', '1-2')
    await page.click('button:has-text("Reduce file size")')
    await expect(page.locator('.pdf-output-list')).toContainText('Untouched pages:')
    await expect(page.locator('.pdf-progress-row progress')).toHaveAttribute('value', /100|99/)

    runtime.assertClean()
  })

  test('legacy PDF routes redirect into studio deep links', async ({ page }) => {
    const redirects = [
      ['/apps/PDF%20Merger.html', '/apps/pdf-studio.html?tool=assemble'],
      ['/apps/PDF%20Splitter.html', '/apps/pdf-studio.html?tool=extract'],
      ['/apps/textExtractor.html', '/apps/pdf-studio.html?tool=textextract']
    ] as const

    for (const [legacyRoute, target] of redirects) {
      await page.goto(legacyRoute, { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(new RegExp(escapeForRegExp(target)))
    }
  })
})
