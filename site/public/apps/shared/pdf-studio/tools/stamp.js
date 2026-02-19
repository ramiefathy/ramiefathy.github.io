import { createPdfDocument } from '../core/pdflib-runtime.js'
import { parseRangeExpression } from '../core/range-parser.js'
import {
  clearElement,
  createOutputLink,
  createParagraph,
  formatBytes,
  loadPdfFromFile,
  renderPreviewPage
} from './common.js'

export const id = 'stamp'
export const navLabel = 'Mark & Number'
export const label = 'Mark & Number'
export const description = 'Apply page numbers, Bates labels, and date/document stamps with safe margins and preview-first controls.'

function resolvePosition(pageWidth, pageHeight, textWidth, margin, preset) {
  const yBottom = margin
  const yTop = pageHeight - margin - 12

  switch (preset) {
    case 'bottom-left':
      return { x: margin, y: yBottom }
    case 'bottom-center':
      return { x: (pageWidth - textWidth) / 2, y: yBottom }
    case 'header':
      return { x: margin, y: yTop }
    case 'footer':
      return { x: margin, y: yBottom }
    case 'bottom-right':
    default:
      return { x: pageWidth - textWidth - margin, y: yBottom }
  }
}

function formatBates(prefix, base, index) {
  const serial = String(base + index).padStart(6, '0')
  return `${prefix}${serial}`
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  let loadedDocument = null
  let previewRenderVersion = 0
  let previewRenderChain = Promise.resolve()

  const loadSection = createSection('Load PDF')
  const inputWrapper = document.createElement('div')
  inputWrapper.className = 'cl-file-input'
  inputWrapper.innerHTML = `
    <input type="file" id="stamp-file-input" accept=".pdf">
    <label for="stamp-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="stamp-file-status">No file selected</span>
  `
  loadSection.append(inputWrapper)

  const formSection = createSection('Stamp Template')
  const formGrid = document.createElement('div')
  formGrid.className = 'pdf-form-grid columns-2'
  formGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label><input type="checkbox" id="stamp-enable-page-number" checked> Page numbers (Page X of Y)</label>
      <label><input type="checkbox" id="stamp-enable-bates"> Bates numbering</label>
      <label><input type="checkbox" id="stamp-enable-date"> Date stamp</label>
    </div>
    <div class="legacy-workflow__field">
      <label for="stamp-label-text">Document label</label>
      <input id="stamp-label-text" type="text" placeholder="e.g., Clinic packet">
      <label for="stamp-bates-prefix">Bates prefix + start</label>
      <div class="pdf-form-grid columns-2">
        <input id="stamp-bates-prefix" type="text" placeholder="RF-">
        <input id="stamp-bates-start" type="number" min="1" value="1">
      </div>
    </div>
  `
  const placementGrid = document.createElement('div')
  placementGrid.className = 'pdf-form-grid columns-2'
  placementGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label for="stamp-position">Position</label>
      <select id="stamp-position">
        <option value="bottom-right">Bottom right</option>
        <option value="bottom-center">Bottom center</option>
        <option value="bottom-left">Bottom left</option>
        <option value="header">Header left</option>
        <option value="footer">Footer left</option>
      </select>
    </div>
    <div class="legacy-workflow__field">
      <label for="stamp-margin">Safe margin</label>
      <select id="stamp-margin">
        <option value="36">36pt (0.5")</option>
        <option value="54">54pt (0.75")</option>
        <option value="72" selected>72pt (1")</option>
      </select>
    </div>
  `
  const pageScope = document.createElement('div')
  pageScope.className = 'pdf-form-grid columns-2'
  pageScope.innerHTML = `
    <label class="legacy-workflow__status"><input type="radio" name="stamp-scope" value="all" checked> Apply to all pages</label>
    <div class="legacy-workflow__field">
      <label for="stamp-range">Selected pages (if scope selected)</label>
      <input id="stamp-range" type="text" placeholder="e.g., 1-3, 8">
    </div>
  `
  const selectedScopeLabel = document.createElement('label')
  selectedScopeLabel.className = 'legacy-workflow__status'
  selectedScopeLabel.innerHTML = '<input type="radio" name="stamp-scope" value="selected"> Apply only selected pages'
  pageScope.prepend(selectedScopeLabel)

  formSection.append(formGrid, placementGrid, pageScope)

  primaryPanel.append(loadSection, formSection)

  const previewSection = createSection('Preview')
  const previewFrame = document.createElement('div')
  previewFrame.className = 'pdf-preview-frame'
  const previewCanvas = document.createElement('canvas')
  previewFrame.append(previewCanvas)
  previewSection.append(previewFrame)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF to configure stamp placement.', 'legacy-workflow__status')
  preflightSection.append(preflightText)

  const outputSection = createSection('Output')
  const runButton = document.createElement('button')
  runButton.type = 'button'
  runButton.className = 'cl-btn-primary legacy-focus-ring'
  runButton.textContent = 'Apply stamps'
  runButton.disabled = true
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(runButton, outputList)

  secondaryPanel.append(previewSection, preflightSection, outputSection)

  const fileInput = inputWrapper.querySelector('#stamp-file-input')
  const fileStatus = inputWrapper.querySelector('#stamp-file-status')

  const getTemplateLines = (pageNumber, totalPages, itemIndex) => {
    const lines = []
    const enablePageNumber = formGrid.querySelector('#stamp-enable-page-number').checked
    const enableBates = formGrid.querySelector('#stamp-enable-bates').checked
    const enableDate = formGrid.querySelector('#stamp-enable-date').checked
    const labelText = formGrid.querySelector('#stamp-label-text').value.trim()

    if (labelText) lines.push(labelText)
    if (enablePageNumber) lines.push(`Page ${pageNumber} of ${totalPages}`)
    if (enableBates) {
      const prefix = formGrid.querySelector('#stamp-bates-prefix').value || 'RF-'
      const start = Number.parseInt(formGrid.querySelector('#stamp-bates-start').value || '1', 10)
      lines.push(formatBates(prefix, start, itemIndex))
    }
    if (enableDate) {
      lines.push(new Date().toLocaleDateString())
    }
    return lines
  }

  const getTargetPages = () => {
    const scope = formSection.querySelector('input[name="stamp-scope"]:checked')?.value || 'all'
    if (!loadedDocument) return []

    if (scope === 'all') {
      return Array.from({ length: loadedDocument.pageCount }, (_, index) => index + 1)
    }

    const rangeExpression = formSection.querySelector('#stamp-range').value.trim()
    if (!rangeExpression) return []
    return parseRangeExpression(rangeExpression, loadedDocument.pageCount).pages
  }

  const refreshPreview = async () => {
    if (!loadedDocument) return

    const currentRenderVersion = ++previewRenderVersion
    await renderPreviewPage(loadedDocument.pdfJsDoc, 1, previewCanvas, 1)
    if (currentRenderVersion !== previewRenderVersion) return

    const canvasContext = previewCanvas.getContext('2d')
    const margin = Number.parseInt(formSection.querySelector('#stamp-margin').value, 10)
    const lines = getTemplateLines(1, loadedDocument.pageCount, 0)
    if (!lines.length) return

    canvasContext.font = '16px "IBM Plex Sans", sans-serif'
    canvasContext.fillStyle = '#0f766e'
    const text = lines.join(' • ')
    const textWidth = canvasContext.measureText(text).width
    const position = resolvePosition(
      previewCanvas.width,
      previewCanvas.height,
      textWidth,
      margin,
      formSection.querySelector('#stamp-position').value
    )
    canvasContext.fillText(text, position.x, previewCanvas.height - position.y)
  }

  const schedulePreviewRefresh = () => {
    previewRenderChain = previewRenderChain
      .then(() => refreshPreview())
      .catch((error) => {
        const message = String(error?.message || error)
        if (message.includes('Cannot use the same canvas during multiple render() operations')) {
          return
        }
        console.error(error)
      })
  }

  const refreshPreflight = () => {
    if (!loadedDocument) {
      preflightText.textContent = 'Load a PDF to configure stamp placement.'
      runButton.disabled = true
      return
    }

    const targetPages = getTargetPages()
    const margin = Number.parseInt(formSection.querySelector('#stamp-margin').value, 10)
    preflightText.textContent = `Applying template to ${targetPages.length} page(s). Margin: ${margin}pt.`
    runButton.disabled = targetPages.length === 0
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    loadedDocument = await loadPdfFromFile(file)
    fileStatus.textContent = `${file.name} (${loadedDocument.pageCount} pages)`
    refreshPreflight()
    schedulePreviewRefresh()
  })

  formSection.addEventListener('input', () => {
    refreshPreflight()
    schedulePreviewRefresh()
  })

  runButton.addEventListener('click', async () => {
    if (!loadedDocument) return
    const targetPages = getTargetPages()
    if (!targetPages.length) return

    const outputPdf = await createPdfDocument()
    const copiedPages = await outputPdf.copyPages(
      loadedDocument.pdfLibDoc,
      Array.from({ length: loadedDocument.pageCount }, (_, index) => index)
    )
    copiedPages.forEach((page) => outputPdf.addPage(page))

    const { StandardFonts, rgb } = PDFLib
    const font = await outputPdf.embedFont(StandardFonts.Helvetica)

    targetPages.forEach((pageNumber, index) => {
      const page = outputPdf.getPage(pageNumber - 1)
      const lines = getTemplateLines(pageNumber, loadedDocument.pageCount, index)
      if (!lines.length) return

      const margin = Number.parseInt(formSection.querySelector('#stamp-margin').value, 10)
      const position = formSection.querySelector('#stamp-position').value
      const text = lines.join(' | ')
      const textWidth = font.widthOfTextAtSize(text, 10)
      const pageSize = page.getSize()
      const placement = resolvePosition(pageSize.width, pageSize.height, textWidth, margin, position)

      page.drawText(text, {
        x: placement.x,
        y: placement.y,
        size: 10,
        font,
        color: rgb(0.12, 0.2, 0.26)
      })
    })

    const bytes = await outputPdf.save()
    const filename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_stamped.pdf`
    clearElement(outputList)
    outputList.append(
      createParagraph(`Stamped ${targetPages.length} page(s). Output size: ${formatBytes(bytes.byteLength || bytes.length || 0)}.`, 'legacy-workflow__status'),
      createOutputLink(filename, bytes)
    )
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-stamp', [
    'Configure your stamp template and safe margin before running.',
    'Use selected-pages mode when only parts of a packet should be labeled.',
    'Check preview to verify placement before generating output.'
  ])

  return () => {}
}
