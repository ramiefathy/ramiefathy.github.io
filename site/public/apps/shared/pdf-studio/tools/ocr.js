import { createPdfDocument } from '../core/pdflib-runtime.js'
import { parseRangeExpression } from '../core/range-parser.js'
import { clearElement, createEmptyState, createOutputLink, createParagraph, formatBytes, loadPdfFromFile } from './common.js'

export const id = 'ocr'
export const navLabel = 'OCR / Text Layer (Beta)'
export const label = 'OCR / Text-Layer Extraction (Beta)'
export const description = 'Use a verified local OCR engine when installed; otherwise extract existing PDF text layers without claiming image recognition.'

const TESSERACT_LOCAL_PATH = './vendor/tesseract/tesseract.min.js'
const STUB_CAPABILITY = 'compatibility-stub-no-ocr'

function isProductionOcrRuntime(runtime) {
  return Boolean(
    runtime &&
    runtime.__pdfStudioCapability !== STUB_CAPABILITY &&
    typeof runtime.createWorker === 'function'
  )
}

async function ensureTesseractRuntime() {
  if (!window.Tesseract) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = TESSERACT_LOCAL_PATH
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.append(script)
    })
  }

  if (!isProductionOcrRuntime(window.Tesseract)) {
    const reason = window.Tesseract?.__pdfStudioReason || 'A production local OCR engine is not installed.'
    throw new Error(reason)
  }

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
  const primaryEmpty = createEmptyState(
    'No PDF loaded',
    'Choose a PDF file to inspect its text layer and configure the processing queue.'
  )

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

  const optionsSection = createSection('Processing Options')
  optionsSection.innerHTML += `
    <div class="pdf-form-grid columns-2">
      <div class="legacy-workflow__field">
        <label for="ocr-quality">OCR render profile</label>
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
        <input id="ocr-page-range" type="text" placeholder="e.g., 1-3, 7" aria-label="OCR or text-layer page range">
      </div>
    </div>
  `

  const capabilityNotice = document.createElement('div')
  capabilityNotice.className = 'legacy-workflow__status'
  capabilityNotice.dataset.tone = 'error'
  capabilityNotice.innerHTML = `
    <strong>Capability boundary:</strong>
    This release does not bundle a production OCR worker, WASM core, or trained-language data.
    It can extract text already embedded in a PDF and preserve the source PDF, but it cannot recognize text from image-only scans.
  `

  const warningText = document.createElement('p')
  warningText.className = 'legacy-workflow__status'
  warningText.textContent = 'A real local OCR engine will be used only when complete engine assets are explicitly installed and verified.'
  optionsSection.append(capabilityNotice, warningText)

  primaryPanel.append(loadSection, optionsSection, primaryEmpty)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF to inspect the queue and available text layer.', 'legacy-workflow__status')
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
  runButton.textContent = 'Process selected pages'
  runButton.disabled = true
  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'cl-btn-secondary legacy-focus-ring'
  cancelButton.textContent = 'Cancel'
  cancelButton.disabled = true
  actionRow.append(runButton, cancelButton)
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(
    createEmptyState(
      'No output yet',
      'Process a PDF to generate either verified OCR outputs or an explicitly labeled text-layer extraction.'
    )
  )
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
      preflightText.textContent = 'Load a PDF to inspect the queue and available text layer.'
      return
    }

    const targetPages = getTargetPages()
    const qualityLabel = qualitySelect.value === 'accurate' ? 'Accurate' : 'Fast'
    preflightText.textContent = `Queue: ${targetPages.length} page(s). OCR render profile if an engine is installed: ${qualityLabel}. Fallback output: existing text layer + preserved PDF.`
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
    queueList.append(createEmptyState('Queue is idle', 'Process selected pages to inspect text availability.'))
    clearElement(outputList)
    outputList.append(
      createEmptyState(
        'No output yet',
        'Outputs will state whether verified OCR or existing text-layer extraction was used.'
      )
    )
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
    let capabilityFailure = ''

    try {
      tesseractRuntime = await ensureTesseractRuntime()
    } catch (error) {
      fallbackMode = true
      capabilityFailure = error instanceof Error ? error.message : 'Production OCR engine assets are unavailable.'
    }

    if (fallbackMode) {
      warningText.textContent = `Text-layer extraction mode. No image recognition will occur. ${capabilityFailure}`
      warningText.dataset.tone = 'error'
    } else {
      warningText.textContent = 'Verified OCR engine assets detected. OCR is running locally in this browser session.'
      warningText.dataset.tone = 'success'
    }

    for (let index = 0; index < targetPages.length; index += 1) {
      if (cancelSignal.cancelled) break

      const pageNumber = targetPages[index]
      const queueRow = queueRows.get(pageNumber)
      setQueueStatus(queueRow, fallbackMode ? 'extracting text layer' : 'running OCR')

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
          try {
            const result = await worker.recognize(canvas)
            extracted = result?.data?.text?.trim() || ''
          } finally {
            await worker.terminate()
          }
        }

        extractedTextByPage.set(pageNumber, extracted)
        if (fallbackMode) {
          setQueueStatus(queueRow, extracted ? 'text layer found' : 'no text layer')
        } else {
          setQueueStatus(queueRow, extracted ? 'OCR done' : 'OCR done (no text)')
        }
      } catch (error) {
        console.error(error)
        setQueueStatus(queueRow, 'failed')
      }
    }

    if (cancelSignal.cancelled) {
      runButton.disabled = false
      cancelButton.disabled = true
      outputList.replaceChildren(createParagraph('Processing cancelled. No outputs written.', 'legacy-workflow__status'))
      return
    }

    const outputPdf = await createPdfDocument()
    const copiedPages = await outputPdf.copyPages(
      loadedDocument.pdfLibDoc,
      Array.from({ length: loadedDocument.pageCount }, (_, pageIndex) => pageIndex)
    )
    copiedPages.forEach((page) => outputPdf.addPage(page))

    if (!fallbackMode) {
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
    }

    const pdfBytes = await outputPdf.save()
    const textLines = targetPages.map(
      (pageNumber) => `\n\n--- Page ${pageNumber} ---\n${extractedTextByPage.get(pageNumber) || ''}`
    )
    const textBlob = new Blob([textLines.join('')], { type: 'text/plain;charset=utf-8' })
    const textUrl = URL.createObjectURL(textBlob)
    const sourceStem = loadedDocument.file.name.replace(/\.pdf$/i, '')
    const textFilename = fallbackMode ? `${sourceStem}_text_layer.txt` : `${sourceStem}_ocr.txt`

    const textLink = document.createElement('a')
    textLink.href = textUrl
    textLink.download = textFilename
    textLink.className = 'legacy-btn legacy-btn--secondary legacy-focus-ring'
    textLink.textContent = `Download ${textFilename}`
    textLink.addEventListener('click', () => {
      setTimeout(() => URL.revokeObjectURL(textUrl), 2_000)
    })

    const outputPdfFilename = fallbackMode
      ? `${sourceStem}_text_layer_preserved.pdf`
      : `${sourceStem}_searchable.pdf`
    const pagesWithText = targetPages.filter((pageNumber) => Boolean(extractedTextByPage.get(pageNumber))).length
    const completionMessage = fallbackMode
      ? `Text-layer extraction completed. Existing text was found on ${pagesWithText} of ${targetPages.length} selected page(s). The PDF output preserves source pages and does not claim OCR. PDF size: ${formatBytes(pdfBytes.byteLength || pdfBytes.length || 0)}.`
      : `Verified local OCR completed on ${targetPages.length} page(s); ${pagesWithText} page(s) produced text. Searchable PDF size: ${formatBytes(pdfBytes.byteLength || pdfBytes.length || 0)}.`

    clearElement(outputList)
    outputList.append(
      createParagraph(completionMessage, 'legacy-workflow__status'),
      createOutputLink(outputPdfFilename, pdfBytes),
      textLink
    )

    if (fallbackMode && pagesWithText === 0) {
      outputList.prepend(
        createParagraph(
          'No embedded text layer was detected. This release cannot recognize image-only scans; install and verify complete local OCR assets before claiming OCR output.',
          'legacy-workflow__status'
        )
      )
    }

    runButton.disabled = false
    cancelButton.disabled = true
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-ocr', [
    'This release does not bundle a production OCR engine; fallback mode extracts only text already embedded in the PDF.',
    'A verified local engine, worker, WASM core, and trained-language data are required for image-only scans.',
    'Every output states which processing mode was used and avoids labeling fallback output as OCR.'
  ])

  return () => {}
}
