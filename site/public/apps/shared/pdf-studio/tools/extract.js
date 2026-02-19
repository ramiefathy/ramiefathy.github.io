import { createPdfDocument } from '../core/pdflib-runtime.js'
import { parseRangeExpression } from '../core/range-parser.js'
import {
  clearElement,
  createOutputLink,
  createParagraph,
  createThumbnailBoard,
  formatBytes,
  loadPdfFromFile,
  renderPreviewPage
} from './common.js'

export const id = 'extract'
export const navLabel = 'Extract & Split'
export const label = 'Extract & Split'
export const description = 'Select pages by click or range expression and export one file or multiple split outputs.'

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((first, second) => first - second)
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  let loadedDocument = null
  let selectedPages = new Set()
  let boardController = null

  const loadSection = createSection('Load PDF')
  const fileInputWrapper = document.createElement('div')
  fileInputWrapper.className = 'cl-file-input'
  fileInputWrapper.innerHTML = `
    <input type="file" id="extract-file-input" accept=".pdf">
    <label for="extract-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="extract-file-status">No file selected</span>
  `
  loadSection.append(fileInputWrapper)

  const rangeSection = createSection('Range Builder')
  const rangeGrid = document.createElement('div')
  rangeGrid.className = 'pdf-form-grid columns-2'
  rangeGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label for="extract-range-input">Pages to extract</label>
      <input id="extract-range-input" type="text" placeholder="e.g. 1-3, 7, 10-12">
    </div>
    <div class="legacy-workflow__field">
      <label for="extract-mode-select">Output mode</label>
      <select id="extract-mode-select">
        <option value="single">Extract to one PDF</option>
        <option value="ranges">Split by range blocks</option>
        <option value="per-page">Split per selected page</option>
      </select>
    </div>
  `
  const applyRangeButton = document.createElement('button')
  applyRangeButton.type = 'button'
  applyRangeButton.className = 'cl-btn-secondary legacy-focus-ring'
  applyRangeButton.textContent = 'Apply range selection'
  const rangeValidation = createParagraph('Type ranges to auto-select pages.', 'legacy-workflow__status')
  rangeSection.append(rangeGrid, applyRangeButton, rangeValidation)

  const boardSection = createSection('Thumbnail Board')
  const board = document.createElement('div')
  board.className = 'pdf-thumb-board'
  boardSection.append(board)

  primaryPanel.append(loadSection, rangeSection, boardSection)

  const inspectorSection = createSection('Inspector')
  const previewFrame = document.createElement('div')
  previewFrame.className = 'pdf-preview-frame'
  const previewCanvas = document.createElement('canvas')
  previewFrame.append(previewCanvas)
  inspectorSection.append(previewFrame)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF and select pages to extract.', 'legacy-workflow__status')
  preflightSection.append(preflightText)

  const outputSection = createSection('Output')
  const runButton = document.createElement('button')
  runButton.className = 'cl-btn-primary legacy-focus-ring'
  runButton.type = 'button'
  runButton.textContent = 'Generate output'
  runButton.disabled = true
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(runButton, outputList)

  secondaryPanel.append(inspectorSection, preflightSection, outputSection)

  const fileInput = fileInputWrapper.querySelector('input[type="file"]')
  const fileStatus = fileInputWrapper.querySelector('#extract-file-status')
  const rangeInput = rangeGrid.querySelector('#extract-range-input')
  const modeSelect = rangeGrid.querySelector('#extract-mode-select')

  const refreshPreflight = () => {
    if (!loadedDocument) {
      runButton.disabled = true
      preflightText.textContent = 'Load a PDF and select pages to extract.'
      return
    }

    const selectedCount = selectedPages.size
    const mode = modeSelect.value
    const modeLabel = mode === 'single' ? 'one file' : mode === 'ranges' ? 'files per range block' : 'files per selected page'
    preflightText.textContent = `Selected ${selectedCount} page(s) from ${loadedDocument.pageCount}. Output mode: ${modeLabel}.`
    runButton.disabled = selectedCount === 0
  }

  const showPreview = async (pageNumber) => {
    if (!loadedDocument || !pageNumber) return
    await renderPreviewPage(loadedDocument.pdfJsDoc, pageNumber, previewCanvas)
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    loadedDocument = await loadPdfFromFile(file)
    fileStatus.textContent = `${file.name} (${loadedDocument.pageCount} pages)`
    selectedPages = new Set()

    boardController?.destroy()
    boardController = createThumbnailBoard({
      board,
      pdfJsDoc: loadedDocument.pdfJsDoc,
      pages: Array.from({ length: loadedDocument.pageCount }, (_, index) => index + 1),
      selectedPages,
      onSelectionChange(nextSelectedPages) {
        selectedPages = new Set(nextSelectedPages)
        refreshPreflight()
        const focusPage = nextSelectedPages[0]
        if (focusPage) {
          showPreview(focusPage).catch((error) => console.error(error))
        }
      }
    })

    clearElement(outputList)
    outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
    refreshPreflight()
  })

  applyRangeButton.addEventListener('click', () => {
    if (!loadedDocument) return
    try {
      const parsed = parseRangeExpression(rangeInput.value, loadedDocument.pageCount)
      rangeValidation.textContent = `Applied ${parsed.pages.length} page(s) from ${parsed.blocks.length} range block(s).`
      rangeValidation.dataset.tone = 'success'
      selectedPages = new Set(parsed.pages)
      boardController?.selectPages(parsed.pages)
    } catch (error) {
      rangeValidation.textContent = error.message || 'Could not parse range expression.'
      rangeValidation.dataset.tone = 'error'
    }
    refreshPreflight()
  })

  modeSelect.addEventListener('change', refreshPreflight)

  const exportSelectionAsSingle = async (selectedSortedPages) => {
    const outputPdf = await createPdfDocument()
    const copiedPages = await outputPdf.copyPages(loadedDocument.pdfLibDoc, selectedSortedPages.map((page) => page - 1))
    copiedPages.forEach((page) => outputPdf.addPage(page))
    const bytes = await outputPdf.save()
    const filename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_extract.pdf`
    const link = createOutputLink(filename, bytes)
    return { filename, bytes, link }
  }

  const exportSelectionAsRanges = async (selectedSortedPages) => {
    const parsed = parseRangeExpression(rangeInput.value || selectedSortedPages.join(','), loadedDocument.pageCount)
    const outputs = []

    for (let blockIndex = 0; blockIndex < parsed.blocks.length; blockIndex += 1) {
      const block = parsed.blocks[blockIndex]
      const pagesInBlock = []
      for (let page = block.start; page <= block.end; page += 1) {
        if (selectedPages.has(page)) pagesInBlock.push(page)
      }
      if (!pagesInBlock.length) continue
      const outputPdf = await createPdfDocument()
      const copiedPages = await outputPdf.copyPages(loadedDocument.pdfLibDoc, pagesInBlock.map((page) => page - 1))
      copiedPages.forEach((page) => outputPdf.addPage(page))
      const bytes = await outputPdf.save()
      const filename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_range_${block.start}-${block.end}.pdf`
      outputs.push({ filename, bytes, link: createOutputLink(filename, bytes) })
    }

    return outputs
  }

  const exportSelectionPerPage = async (selectedSortedPages) => {
    const outputs = []
    for (let outputIndex = 0; outputIndex < selectedSortedPages.length; outputIndex += 1) {
      const pageNumber = selectedSortedPages[outputIndex]
      const outputPdf = await createPdfDocument()
      const copiedPages = await outputPdf.copyPages(loadedDocument.pdfLibDoc, [pageNumber - 1])
      outputPdf.addPage(copiedPages[0])
      const bytes = await outputPdf.save()
      const filename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_page_${pageNumber}.pdf`
      outputs.push({ filename, bytes, link: createOutputLink(filename, bytes) })
    }
    return outputs
  }

  runButton.addEventListener('click', async () => {
    if (!loadedDocument) return

    const selectedSortedPages = uniqueSorted(Array.from(selectedPages))
    if (!selectedSortedPages.length) return

    const mode = modeSelect.value
    clearElement(outputList)

    try {
      let outputs
      if (mode === 'single') {
        outputs = [await exportSelectionAsSingle(selectedSortedPages)]
      } else if (mode === 'ranges') {
        outputs = await exportSelectionAsRanges(selectedSortedPages)
      } else {
        outputs = await exportSelectionPerPage(selectedSortedPages)
      }

      if (!outputs.length) {
        outputList.append(createParagraph('No outputs were generated from the current selection.', 'legacy-workflow__status'))
        return
      }

      outputs.forEach((output, index) => {
        outputList.append(
          createParagraph(`Output ${index + 1}: ${output.filename} (${formatBytes(output.bytes.byteLength || output.bytes.length || 0)})`, 'legacy-workflow__status'),
          output.link
        )
      })
    } catch (error) {
      outputList.append(createParagraph(`Extraction failed: ${error.message || 'Unknown error'}`, 'legacy-workflow__status'))
    }
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-extract', [
    'Select pages directly in the thumbnail board or use range syntax like 1-3, 7, 10-12.',
    'Pick whether output should be one file, one file per range, or one file per page.',
    'Generate outputs and download from the single output panel.'
  ])

  return () => {
    boardController?.destroy()
  }
}
