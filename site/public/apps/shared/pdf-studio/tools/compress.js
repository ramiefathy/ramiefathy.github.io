import { createPdfDocument } from '../core/pdflib-runtime.js'
import { parseRangeExpression } from '../core/range-parser.js'
import { clearElement, createOutputLink, createParagraph, formatBytes, loadPdfFromFile } from './common.js'

export const id = 'compress'
export const navLabel = 'Reduce Size'
export const label = 'Reduce File Size'
export const description = 'Compress PDF size with deterministic raster mode or preserve-text attempt mode with per-page reporting.'

async function renderPageAsJpeg(pdfJsDoc, pageNumber, scale, quality) {
  const page = await pdfJsDoc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const context = canvas.getContext('2d', { alpha: false })
  await page.render({ canvasContext: context, viewport }).promise

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return {
    bytes,
    width: viewport.width,
    height: viewport.height
  }
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  let loadedDocument = null
  let cancelSignal = { cancelled: false }

  const loadSection = createSection('Load PDF')
  const inputWrapper = document.createElement('div')
  inputWrapper.className = 'cl-file-input'
  inputWrapper.innerHTML = `
    <input type="file" id="compress-file-input" accept=".pdf">
    <label for="compress-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="compress-file-status">No file selected</span>
  `
  loadSection.append(inputWrapper)

  const optionsSection = createSection('Compression Mode')
  const optionsGrid = document.createElement('div')
  optionsGrid.className = 'pdf-form-grid columns-2'
  optionsGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label for="compress-mode">Mode</label>
      <select id="compress-mode">
        <option value="raster">Fast & effective (rasterize pages)</option>
        <option value="preserve">Preserve-text attempt (mixed strategy)</option>
      </select>
    </div>
    <div class="legacy-workflow__field">
      <label for="compress-dpi">Target DPI</label>
      <select id="compress-dpi">
        <option value="96">96 DPI (smallest)</option>
        <option value="120" selected>120 DPI (balanced)</option>
        <option value="150">150 DPI (higher quality)</option>
      </select>
    </div>
  `
  const scopeGrid = document.createElement('div')
  scopeGrid.className = 'pdf-form-grid columns-2'
  scopeGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label for="compress-scope">Page scope</label>
      <select id="compress-scope">
        <option value="all">All pages</option>
        <option value="selected">Selected range</option>
      </select>
    </div>
    <div class="legacy-workflow__field">
      <label for="compress-range">Range (if selected scope)</label>
      <input id="compress-range" type="text" placeholder="e.g., 1-3, 10-12">
    </div>
  `
  optionsSection.append(optionsGrid, scopeGrid)

  const warningText = document.createElement('p')
  warningText.className = 'legacy-workflow__status'
  warningText.textContent = 'Raster mode can remove selectable text and accessibility metadata.'
  optionsSection.append(warningText)

  primaryPanel.append(loadSection, optionsSection)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF to compute compression settings.', 'legacy-workflow__status')
  const progressWrap = document.createElement('div')
  progressWrap.className = 'pdf-progress-row'
  const progressBar = document.createElement('progress')
  progressBar.max = 100
  progressBar.value = 0
  const progressLabel = createParagraph('Idle', 'legacy-workflow__status')
  progressWrap.append(progressBar, progressLabel)
  preflightSection.append(preflightText, progressWrap)

  const outputSection = createSection('Output')
  const actions = document.createElement('div')
  actions.className = 'legacy-workflow__actions'
  const runButton = document.createElement('button')
  runButton.type = 'button'
  runButton.className = 'cl-btn-primary legacy-focus-ring'
  runButton.textContent = 'Reduce file size'
  runButton.disabled = true
  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'cl-btn-secondary legacy-focus-ring'
  cancelButton.textContent = 'Cancel'
  cancelButton.disabled = true
  actions.append(runButton, cancelButton)
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(actions, outputList)

  secondaryPanel.append(preflightSection, outputSection)

  const fileInput = inputWrapper.querySelector('#compress-file-input')
  const fileStatus = inputWrapper.querySelector('#compress-file-status')
  const modeSelect = optionsGrid.querySelector('#compress-mode')
  const dpiSelect = optionsGrid.querySelector('#compress-dpi')
  const scopeSelect = scopeGrid.querySelector('#compress-scope')
  const rangeInput = scopeGrid.querySelector('#compress-range')

  const getTargetPages = () => {
    if (!loadedDocument) return []
    if (scopeSelect.value === 'all') {
      return Array.from({ length: loadedDocument.pageCount }, (_, index) => index + 1)
    }
    if (!rangeInput.value.trim()) return []
    return parseRangeExpression(rangeInput.value, loadedDocument.pageCount).pages
  }

  const refreshPreflight = () => {
    if (!loadedDocument) {
      runButton.disabled = true
      preflightText.textContent = 'Load a PDF to compute compression settings.'
      return
    }

    const targetPages = getTargetPages()
    const mode = modeSelect.value === 'raster' ? 'Rasterize selected pages' : 'Preserve-text attempt'
    preflightText.textContent = `Input size: ${formatBytes(loadedDocument.file.size)}. Target pages: ${targetPages.length}. Mode: ${mode}.`
    runButton.disabled = targetPages.length === 0
    warningText.textContent = modeSelect.value === 'raster'
      ? 'Raster mode usually yields larger quality loss but stronger compression.'
      : 'Preserve-text attempt keeps text-heavy pages intact and rasterizes image-dominant pages.'
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    loadedDocument = await loadPdfFromFile(file)
    fileStatus.textContent = `${file.name} (${loadedDocument.pageCount} pages)`
    refreshPreflight()
  })

  optionsSection.addEventListener('input', refreshPreflight)

  cancelButton.addEventListener('click', () => {
    cancelSignal.cancelled = true
  })

  runButton.addEventListener('click', async () => {
    if (!loadedDocument) return

    cancelSignal = { cancelled: false }
    runButton.disabled = true
    cancelButton.disabled = false

    const targetPages = new Set(getTargetPages())
    const mode = modeSelect.value
    const dpi = Number.parseInt(dpiSelect.value, 10)
    const scale = dpi / 72
    const jpegQuality = mode === 'raster' ? 0.65 : 0.75

    const outputPdf = await createPdfDocument()
    const rasterizedPages = []
    const untouchedPages = []

    for (let pageNumber = 1; pageNumber <= loadedDocument.pageCount; pageNumber += 1) {
      if (cancelSignal.cancelled) {
        break
      }

      const progressValue = Math.round((pageNumber / loadedDocument.pageCount) * 100)
      progressBar.value = progressValue
      progressLabel.textContent = `Processing page ${pageNumber} of ${loadedDocument.pageCount}`

      const shouldProcess = targetPages.has(pageNumber)
      if (!shouldProcess) {
        const copied = await outputPdf.copyPages(loadedDocument.pdfLibDoc, [pageNumber - 1])
        outputPdf.addPage(copied[0])
        untouchedPages.push(pageNumber)
        continue
      }

      let shouldRasterize = mode === 'raster'

      if (mode === 'preserve') {
        const page = await loadedDocument.pdfJsDoc.getPage(pageNumber)
        const textContent = await page.getTextContent()
        const textLength = textContent.items.map((item) => item.str || '').join(' ').trim().length
        shouldRasterize = textLength < 120
      }

      if (!shouldRasterize) {
        const copied = await outputPdf.copyPages(loadedDocument.pdfLibDoc, [pageNumber - 1])
        outputPdf.addPage(copied[0])
        untouchedPages.push(pageNumber)
        continue
      }

      const rasterized = await renderPageAsJpeg(loadedDocument.pdfJsDoc, pageNumber, scale, jpegQuality)
      const embedded = await outputPdf.embedJpg(rasterized.bytes)
      const page = outputPdf.addPage([rasterized.width, rasterized.height])
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: rasterized.width,
        height: rasterized.height
      })
      rasterizedPages.push(pageNumber)
    }

    if (cancelSignal.cancelled) {
      outputList.replaceChildren(createParagraph('Compression cancelled. Partial output discarded.', 'legacy-workflow__status'))
      progressLabel.textContent = 'Cancelled'
      runButton.disabled = false
      cancelButton.disabled = true
      return
    }

    const bytes = await outputPdf.save()
    const filename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_compressed.pdf`
    clearElement(outputList)

    outputList.append(
      createParagraph(`Output size: ${formatBytes(bytes.byteLength || bytes.length || 0)} (input ${formatBytes(loadedDocument.file.size)}).`, 'legacy-workflow__status'),
      createParagraph(`Rasterized pages: ${rasterizedPages.length ? rasterizedPages.join(', ') : 'none'}.`, 'legacy-workflow__status'),
      createParagraph(`Untouched pages: ${untouchedPages.length ? untouchedPages.join(', ') : 'none'}.`, 'legacy-workflow__status'),
      createOutputLink(filename, bytes)
    )

    progressBar.value = 100
    progressLabel.textContent = 'Completed'
    runButton.disabled = false
    cancelButton.disabled = true
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-compress', [
    'Choose raster mode for strongest size reduction when text selectability is less critical.',
    'Use preserve-text attempt to keep text-heavy pages untouched when possible.',
    'Review per-page rasterization summary before sharing the compressed output.'
  ])

  return () => {}
}
