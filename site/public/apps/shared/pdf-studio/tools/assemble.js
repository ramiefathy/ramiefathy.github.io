import { createPdfDocument } from '../core/pdflib-runtime.js'
import { clearElement, createOutputLink, createParagraph, formatBytes, loadPdfFromFile } from './common.js'

export const id = 'assemble'
export const navLabel = 'Packet Assembler'
export const label = 'Packet Assembler'
export const description = 'Merge multiple PDFs, insert separator pages, and optionally prepend a generated table of contents.'

let blockIdCounter = 0
function nextBlockId() {
  blockIdCounter += 1
  return `block-${blockIdCounter}`
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  const blocks = []
  const warnings = []

  const loadSection = createSection('Add PDFs')
  const loadWrapper = document.createElement('div')
  loadWrapper.className = 'cl-file-input'
  loadWrapper.innerHTML = `
    <input type="file" id="assembler-file-input" accept=".pdf" multiple>
    <label for="assembler-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF files</span>
    </label>
    <span class="cl-file-input__status" id="assembler-file-status">No files selected</span>
  `
  loadSection.append(loadWrapper)

  const actionRow = document.createElement('div')
  actionRow.className = 'legacy-workflow__actions'
  const addSeparatorButton = document.createElement('button')
  addSeparatorButton.type = 'button'
  addSeparatorButton.className = 'cl-btn-secondary legacy-focus-ring'
  addSeparatorButton.textContent = '+ Insert separator page'
  const tocLabel = document.createElement('label')
  tocLabel.className = 'legacy-workflow__status'
  tocLabel.innerHTML = '<input type="checkbox" id="assembler-include-toc"> Add table of contents page'
  actionRow.append(addSeparatorButton, tocLabel)

  const listSection = createSection('Assembly List')
  const assemblyList = document.createElement('div')
  assemblyList.className = 'pdf-form-grid'
  listSection.append(assemblyList)

  primaryPanel.append(loadSection, actionRow, listSection)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Add PDFs to build your packet sequence.', 'legacy-workflow__status')
  const warningList = document.createElement('ul')
  warningList.className = 'pdf-warnings'
  preflightSection.append(preflightText, warningList)

  const outputSection = createSection('Output')
  const assembleButton = document.createElement('button')
  assembleButton.type = 'button'
  assembleButton.className = 'cl-btn-primary legacy-focus-ring'
  assembleButton.textContent = 'Assemble packet'
  assembleButton.disabled = true
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(assembleButton, outputList)

  secondaryPanel.append(preflightSection, outputSection)

  const fileInput = loadWrapper.querySelector('#assembler-file-input')
  const fileStatus = loadWrapper.querySelector('#assembler-file-status')
  const includeToc = actionRow.querySelector('#assembler-include-toc')

  const refreshPreflight = () => {
    const pdfBlocks = blocks.filter((block) => block.type === 'pdf')
    const separatorCount = blocks.filter((block) => block.type === 'separator').length
    const totalPages = pdfBlocks.reduce((sum, block) => sum + (block.pageCount || 0), 0) + separatorCount + (includeToc.checked ? 1 : 0)
    preflightText.textContent = `Blocks: ${blocks.length}. PDFs: ${pdfBlocks.length}. Separators: ${separatorCount}. Estimated pages: ${totalPages}.`
    assembleButton.disabled = pdfBlocks.length === 0

    clearElement(warningList)
    warnings.forEach((warning) => {
      const item = document.createElement('li')
      item.textContent = warning
      warningList.append(item)
    })
  }

  const renderBlocks = () => {
    clearElement(assemblyList)

    blocks.forEach((block, index) => {
      const card = document.createElement('article')
      card.className = 'cl-card'
      card.draggable = true
      card.dataset.blockId = block.id

      if (block.type === 'pdf') {
        card.innerHTML = `
          <h3 style="margin:0 0 0.5rem 0; font-size:1rem;">${index + 1}. ${block.file.name}</h3>
          <p class="legacy-workflow__status">PDF block · ${block.pageCount} pages</p>
        `
      } else {
        card.innerHTML = `
          <h3 style="margin:0 0 0.5rem 0; font-size:1rem;">${index + 1}. Separator page</h3>
          <input type="text" class="legacy-workflow__input" value="${block.title}" placeholder="Separator title">
        `
        card.querySelector('input').addEventListener('input', (event) => {
          block.title = event.target.value
        })
      }

      const buttons = document.createElement('div')
      buttons.className = 'legacy-workflow__actions'
      const removeButton = document.createElement('button')
      removeButton.type = 'button'
      removeButton.className = 'cl-btn-secondary legacy-focus-ring'
      removeButton.textContent = 'Remove'
      removeButton.addEventListener('click', () => {
        const targetIndex = blocks.findIndex((entry) => entry.id === block.id)
        if (targetIndex >= 0) {
          blocks.splice(targetIndex, 1)
          renderBlocks()
          refreshPreflight()
        }
      })
      buttons.append(removeButton)
      card.append(buttons)

      card.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', block.id)
      })
      card.addEventListener('dragover', (event) => event.preventDefault())
      card.addEventListener('drop', (event) => {
        event.preventDefault()
        const sourceId = event.dataTransfer.getData('text/plain')
        if (!sourceId || sourceId === block.id) return
        const sourceIndex = blocks.findIndex((entry) => entry.id === sourceId)
        const targetIndex = blocks.findIndex((entry) => entry.id === block.id)
        if (sourceIndex < 0 || targetIndex < 0) return
        const [moved] = blocks.splice(sourceIndex, 1)
        blocks.splice(targetIndex, 0, moved)
        renderBlocks()
      })

      assemblyList.append(card)
    })
  }

  addSeparatorButton.addEventListener('click', () => {
    blocks.push({ id: nextBlockId(), type: 'separator', title: 'Section Divider' })
    renderBlocks()
    refreshPreflight()
  })

  includeToc.addEventListener('change', refreshPreflight)

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || [])
    if (!files.length) return

    warnings.length = 0
    for (const file of files) {
      try {
        const loaded = await loadPdfFromFile(file)
        blocks.push({
          id: nextBlockId(),
          type: 'pdf',
          file,
          pdfLibDoc: loaded.pdfLibDoc,
          pageCount: loaded.pageCount
        })
      } catch (error) {
        warnings.push(`${file.name}: could not be loaded (${error.message || 'unknown error'}).`)
      }
    }

    fileStatus.textContent = `${blocks.filter((block) => block.type === 'pdf').length} PDF block(s) ready`
    renderBlocks()
    refreshPreflight()
  })

  const buildToc = async (pdfDocument, entries) => {
    const tocPage = pdfDocument.addPage([612, 792])
    const { StandardFonts, rgb } = PDFLib
    const headingFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold)
    const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica)

    tocPage.drawText('Table of Contents', {
      x: 72,
      y: 730,
      size: 24,
      font: headingFont,
      color: rgb(0.07, 0.25, 0.24)
    })

    let cursorY = 690
    entries.forEach((entry) => {
      const text = `${entry.title} ................................ ${entry.startPage}`
      tocPage.drawText(text, {
        x: 72,
        y: cursorY,
        size: 11,
        font: bodyFont,
        color: rgb(0.2, 0.24, 0.3)
      })
      cursorY -= 18
    })
  }

  assembleButton.addEventListener('click', async () => {
    const pdfBlocks = blocks.filter((block) => block.type === 'pdf')
    if (!pdfBlocks.length) return

    const outputPdf = await createPdfDocument()
    const tocEntries = []

    let pageCursor = includeToc.checked ? 2 : 1
    blocks.forEach((block) => {
      if (block.type === 'separator') {
        tocEntries.push({ title: block.title || 'Divider', startPage: pageCursor })
        pageCursor += 1
      } else {
        tocEntries.push({ title: block.file.name, startPage: pageCursor })
        pageCursor += block.pageCount
      }
    })

    if (includeToc.checked) {
      await buildToc(outputPdf, tocEntries)
    }

    const { StandardFonts, rgb } = PDFLib
    const separatorFont = await outputPdf.embedFont(StandardFonts.HelveticaBold)

    for (const block of blocks) {
      if (block.type === 'separator') {
        const page = outputPdf.addPage([612, 792])
        const title = block.title || 'Divider'
        const size = 28
        const textWidth = separatorFont.widthOfTextAtSize(title, size)
        page.drawText(title, {
          x: (612 - textWidth) / 2,
          y: 396,
          size,
          font: separatorFont,
          color: rgb(0.12, 0.25, 0.27)
        })
        continue
      }

      const pageIndexes = Array.from({ length: block.pageCount }, (_, index) => index)
      const copiedPages = await outputPdf.copyPages(block.pdfLibDoc, pageIndexes)
      copiedPages.forEach((page) => outputPdf.addPage(page))
    }

    const bytes = await outputPdf.save()
    const filename = `assembled_packet_${new Date().toISOString().slice(0, 10)}.pdf`

    clearElement(outputList)
    outputList.append(
      createParagraph(`Packet assembled (${formatBytes(bytes.byteLength || bytes.length || 0)}).`, 'legacy-workflow__status'),
      createOutputLink(filename, bytes)
    )
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-assemble', [
    'Add PDFs and optional separator pages in the assembly list.',
    'Drag blocks to match your final packet sequence.',
    'Optionally add a table of contents, then assemble and download.'
  ])

  return () => {}
}
