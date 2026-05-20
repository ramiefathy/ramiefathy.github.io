import { createPdfDocument } from '../core/pdflib-runtime.js'
import { parseRangeExpression } from '../core/range-parser.js'
import { clearElement, createEmptyState, createOutputLink, createParagraph, formatBytes, loadPdfFromFile } from './common.js'

export const id = 'ocr'
export const navLabel = 'OCR (Beta)'
export const label = 'OCR (Beta)'
export const description = 'Run local OCR page-by-page with queue status, quality controls, and dual outputs (searchable PDF + TXT).'

const TESSERACT_LOCAL_PATH = './vendor/tesseract/tesseract.min.js'

async function ensureTesseractRuntime() {
  if (window.Tesseract) return window.Tesseract

  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TESSERACT_LOCAL_PATH
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.append(script)
  })

  return window.Tesseract
}

function createQueueRow(pageNumber) {
  const row = document.createElement('div')
  row.className = 'pdf-ocr-queue-item'
  row.innerHTML = `<span>Page ${pageNumber}</span><span data-status="pending">pending</span>`
  return row
}

function setQueueStatus(row, value) {
  const status = row.querySelector('[data-status]')
  if (status) status.textContent = value
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  let loadedDocument = null
  let cancelSignal = { cancelled: false }
  const primaryEmpty = createEmptyState('No PDF loaded', 'Choose a PDF file to configure the OCR queue and preview expected runtime.')

  const loadSection = createSection('Load PDF')
  const fileInputWrapper = document.createElement('div')
  fileInputWrapper.className = 'cl-file-input'
  fileInputWrapper.innerHTML = `
    <input type="file" id="ocr-file-input" accept=".pdf">
    <label for="ocr-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="ocr-file-status">No file selected</span>
  `
  loadSection.append(fileInputWrapper)

  const optionsSection = createSection('OCR Options')
  optionsSection.innerHTML += `
    <div class="pdf-form-grid columns-2">
      <div class="legacy-workflow__field">
        <label for="ocr-quality">Quality profile</label>
        <select id="ocr-quality">
          <option value="fast">Fast (lower DPI)</option>
          <option value="accurate">Accurate (higher DPI)</option>
        </select>
      </div>
      <div class="legacy-workflow__field">
        <label for="ocr-page-scope">Pages</label>
        <select id="ocr-page-scope">
          <option value="all">All pages</option>
          <option value="selected">Selected range</option>
        </select>
        <input id="ocr-page-range" type="text" placeholder="e.g., 1-3, 7" aria-label="OCR page range">
      </div>
    </div>
  `

  const warningText = document.createElement('p')
  warningText.className = 'legacy-workflow__status'
  warningText.textContent = 'OCR can take several minutes. Keep this tab open during processing.'
  optionsSection.append(warningText)

  primaryPanel.append(loadSection, optionsSection, primaryEmpty)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF to estimate OCR runtime and queue length.', 'legacy-workflow__status')
  preflightSection.append(preflightText)

  const queueSection = createSection('Queue Status')
  const queueList = document.createElement('div')
  queueList.className = 'pdf-ocr-queue'
  queueList.append(createEmptyState('No pages queued', 'Load a PDF and choose a page scope to preview queue status.'))
  queueSection.append(queueList)

  const outputSection = createSection('Output')
  const actionRow = document.createElement('div')
  actionRow.className = 'legacy-workflow__actions'
  const runButton = document.createElement('button')
  runButton.type = 'button'
  runButton.className = 'cl-btn-primary legacy-focus-ring'
  runButton.textContent = 'Run OCR'
  runButton.disabled = true
  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'cl-btn-secondary legacy-focus-ring'
  cancelButton.textContent = 'Cancel'
  cancelButton.disabled = true
  actionRow.append(runButton, cancelButton)
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createEmptyState('No output yet', 'Load a PDF and run OCR to generate a searchable PDF and TXT export.'))
  outputSection.append(actionRow, outputList)

  secondaryPanel.append(preflightSection, queueSection, outputSection)

  const fileInput = fileInputWrapper.querySelector('#ocr-file-input')
  const fileStatus = fileInputWrapper.querySelector('#ocr-file-status')
  const qualitySelect = optionsSection.querySelector('#ocr-quality')
  const pageScopeSelect = optionsSection.querySelector('#ocr-page-scope')
  const rangeInput = optionsSection.querySelector('#ocr-page-range')

  const getTargetPages = () => {
    if (!loadedDocument) return []
    if (pageScopeSelect.value === 'all') {
      return Array.from({ length: loadedDocument.pageCount }, (_, index) => index + 1)
    }

    if (!rangeInput.value.trim()) return []
    return parseRangeExpression(rangeInput.value, loadedDocument.pageCount).pages
  }

  const refreshPreflight = () => {
    if (!loadedDocument) {
      runButton.disabled = true
      preflightText.textContent = 'Load a PDF to estimate OCR runtime and queue length.'
      return
    }

    const targetPages = getTargetPages()
    const qualityLabel = qualitySelect.value === 'accurate' ? 'Accurate' : 'Fast'
    preflightText.textContent = `Queue: ${targetPages.length} page(s). Profile: ${qualityLabel}. Output includes searchable PDF + TXT.`
    runButton.disabled = targetPages.length === 0
  }

  const renderQueue = (pages) => {
    clearElement(queueList)
    const rowsByPage = new Map()
    pages.forEach((pageNumber) => {
      const row = createQueueRow(pageNumber)
      rowsByPage.set(pageNumber, row)
      queueList.append(row)
    })
    return rowsByPage
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    loadedDocument = await loadPdfFromFile(file)
    fileStatus.textContent = `${file.name} (${loadedDocument.pageCount} pages)`
    primaryEmpty.remove()
    clearElement(queueList)
    queueList.append(createEmptyState('Queue is idle', 'Run OCR to start processing selected pages.'))
    clearElement(outputList)
    outputList.append(createEmptyState('No output yet', 'Run OCR to generate a searchable PDF and TXT export.'))
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

    const targetPages = getTargetPages()
    const queueRows = renderQueue(targetPages)
    const extractedTextByPage = new Map()

    const qualityScale = qualitySelect.value === 'accurate' ? 2.2 : 1.2
    let tesseractRuntime = null
    let fallbackMode = false

    try {
      tesseractRuntime = await ensureTesseractRuntime()
    } catch {
      fallbackMode = true
    }

    if (fallbackMode) {
      warningText.textContent = 'Local OCR engine asset is unavailable. Using PDF text extraction fallback for this run.'
      warningText.dataset.tone = 'error'
    } else {
      warningText.textContent = 'OCR running locally in this browser session.'
      warningText.dataset.tone = 'success'
    }

    for (let index = 0; index < targetPages.length; index += 1) {
      if (cancelSignal.cancelled) {
        break
      }

      const pageNumber = targetPages[index]
      const queueRow = queueRows.get(pageNumber)
      setQueueStatus(queueRow, 'running')

      try {
        const page = await loadedDocument.pdfJsDoc.getPage(pageNumber)
        let extracted = ''

        if (fallbackMode) {
          const textContent = await page.getTextContent()
          extracted = textContent.items.map((item) => item.str || '').join(' ').trim()
        } else {
          const viewport = page.getViewport({ scale: qualityScale })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const canvasContext = canvas.getContext('2d', { alpha: false })
          await page.render({ canvasContext, viewport }).promise

          const worker = await tesseractRuntime.createWorker('eng')
          const result = await worker.recognize(canvas)
          extracted = result?.data?.text?.trim() || ''
          await worker.terminate()
        }

        extractedTextByPage.set(pageNumber, extracted)
        setQueueStatus(queueRow, extracted ? 'done' : 'done (no text)')
      } catch (error) {
        console.error(error)
        setQueueStatus(queueRow, 'failed')
      }
    }

    if (cancelSignal.cancelled) {
      runButton.disabled = false
      cancelButton.disabled = true
      outputList.replaceChildren(createParagraph('OCR run cancelled. No outputs written.', 'legacy-workflow__status'))
      return
    }

    const outputPdf = await createPdfDocument()
    const copiedPages = await outputPdf.copyPages(
      loadedDocument.pdfLibDoc,
      Array.from({ length: loadedDocument.pageCount }, (_, pageIndex) => pageIndex)
    )
    copiedPages.forEach((page) => outputPdf.addPage(page))

    const { StandardFonts, rgb } = PDFLib
    const font = await outputPdf.embedFont(StandardFonts.Helvetica)

    targetPages.forEach((pageNumber) => {
      const page = outputPdf.getPage(pageNumber - 1)
      const text = extractedTextByPage.get(pageNumber)
      if (!text) return

      const clipped = text.slice(0, 4000)
      page.drawText(clipped, {
        x: 24,
        y: 12,
        size: 4,
        font,
        color: rgb(1, 1, 1),
        opacity: 0
      })
    })

    const pdfBytes = await outputPdf.save()
    const textLines = targetPages.map((pageNumber) => `\n\n--- Page ${pageNumber} ---\n${extractedTextByPage.get(pageNumber) || ''}`)
    const textBlob = new Blob([textLines.join('')], { type: 'text/plain;charset=utf-8' })
    const textUrl = URL.createObjectURL(textBlob)
    const textFilename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_ocr.txt`

    const textLink = document.createElement('a')
    textLink.href = textUrl
    textLink.download = textFilename
    textLink.className = 'legacy-btn legacy-btn--secondary legacy-focus-ring'
    textLink.textContent = `Download ${textFilename}`
    textLink.addEventListener('click', () => {
      setTimeout(() => URL.revokeObjectURL(textUrl), 2_000)
    })

    const searchableFilename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_searchable.pdf`

    clearElement(outputList)
    outputList.append(
      createParagraph(`OCR completed on ${targetPages.length} page(s). Searchable PDF size: ${formatBytes(pdfBytes.byteLength || pdfBytes.length || 0)}.`, 'legacy-workflow__status'),
      createOutputLink(searchableFilename, pdfBytes),
      textLink
    )

    runButton.disabled = false
    cancelButton.disabled = true
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-ocr', [
    'OCR is local and can take minutes for large documents; keep the tab open.',
    'Choose fast or accurate mode and select all pages or a range before starting.',
    'Review queue status and download both searchable PDF and TXT outputs.'
  ])

  return () => {}
}
