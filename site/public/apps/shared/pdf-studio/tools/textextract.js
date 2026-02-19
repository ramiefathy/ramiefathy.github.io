import { createPdfDocument } from '../core/pdflib-runtime.js'
import { clearElement, createOutputLink, createParagraph, formatBytes, loadPdfFromFile } from './common.js'

export const id = 'textextract'
export const navLabel = 'Text Extract'
export const label = 'Text Extract'
export const description = 'Extract text from PDF content streams, preserve basic paragraph breaks, and export a compact text-first PDF.'

function formatParagraphs(items) {
  const sorted = [...items].sort((first, second) => {
    const yA = first.transform[5]
    const yB = second.transform[5]
    const xA = first.transform[4]
    const xB = second.transform[4]
    const tolerance = Math.min(first.height || 8, second.height || 8) * 0.2
    if (Math.abs(yA - yB) < tolerance) return xA - xB
    return yB - yA
  })

  let output = ''
  let previousY = null
  const lineHeight = sorted[0]?.height || 11

  sorted.forEach((item) => {
    const content = item.str?.trim()
    if (!content) return

    const currentY = item.transform[5]
    if (previousY !== null) {
      const delta = Math.abs(currentY - previousY)
      if (delta > lineHeight * 1.55) output += '\n\n'
      else if (delta > lineHeight * 0.24) output += '\n'
      else output += ' '
    }

    output += content
    previousY = currentY
  })

  return output
}

function sanitizeText(text) {
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  let loadedDocument = null

  const loadSection = createSection('Load PDF')
  const fileInputWrapper = document.createElement('div')
  fileInputWrapper.className = 'cl-file-input'
  fileInputWrapper.innerHTML = `
    <input type="file" id="textextract-file-input" accept=".pdf">
    <label for="textextract-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="textextract-file-status">No file selected</span>
  `
  loadSection.append(fileInputWrapper)

  const optionsSection = createSection('Extraction Settings')
  const infoText = createParagraph('Text extraction uses PDF content streams and paragraph spacing heuristics.', 'legacy-workflow__status')
  optionsSection.append(infoText)

  primaryPanel.append(loadSection, optionsSection)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF to preview extraction expectations.', 'legacy-workflow__status')
  preflightSection.append(preflightText)

  const outputSection = createSection('Output')
  const runButton = document.createElement('button')
  runButton.type = 'button'
  runButton.className = 'cl-btn-primary legacy-focus-ring'
  runButton.textContent = 'Extract text'
  runButton.disabled = true
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(runButton, outputList)

  secondaryPanel.append(preflightSection, outputSection)

  const fileInput = fileInputWrapper.querySelector('#textextract-file-input')
  const fileStatus = fileInputWrapper.querySelector('#textextract-file-status')

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    loadedDocument = await loadPdfFromFile(file)
    fileStatus.textContent = `${file.name} (${loadedDocument.pageCount} pages)`
    preflightText.textContent = `Ready to extract from ${loadedDocument.pageCount} page(s). Output will contain text content only.`
    runButton.disabled = false
  })

  runButton.addEventListener('click', async () => {
    if (!loadedDocument) return

    const extractedTexts = []
    for (let pageNumber = 1; pageNumber <= loadedDocument.pageCount; pageNumber += 1) {
      const page = await loadedDocument.pdfJsDoc.getPage(pageNumber)
      const textContent = await page.getTextContent()
      extractedTexts.push(sanitizeText(formatParagraphs(textContent.items)))
    }

    const outputPdf = await createPdfDocument()
    const { StandardFonts, rgb } = PDFLib
    const font = await outputPdf.embedFont(StandardFonts.Helvetica)
    const fontSize = 10
    const margin = 48
    const lineHeight = fontSize * 1.45

    extractedTexts.forEach((pageText) => {
      if (!pageText.trim()) return

      let outputPage = outputPdf.addPage([612, 792])
      let cursorY = 792 - margin
      const maxWidth = 612 - margin * 2

      const paragraphs = pageText.split('\n\n')
      paragraphs.forEach((paragraph) => {
        const words = paragraph.split(/\s+/).filter(Boolean)
        let currentLine = ''

        words.forEach((word) => {
          const nextLine = currentLine ? `${currentLine} ${word}` : word
          const width = font.widthOfTextAtSize(nextLine, fontSize)
          if (width <= maxWidth) {
            currentLine = nextLine
            return
          }

          if (cursorY < margin + lineHeight) {
            outputPage = outputPdf.addPage([612, 792])
            cursorY = 792 - margin
          }

          outputPage.drawText(currentLine, {
            x: margin,
            y: cursorY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0)
          })
          cursorY -= lineHeight
          currentLine = word
        })

        if (currentLine) {
          if (cursorY < margin + lineHeight) {
            outputPage = outputPdf.addPage([612, 792])
            cursorY = 792 - margin
          }

          outputPage.drawText(currentLine, {
            x: margin,
            y: cursorY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0)
          })
          cursorY -= lineHeight
        }

        cursorY -= lineHeight * 0.5
      })
    })

    const bytes = await outputPdf.save()
    const filename = `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_text_extract.pdf`

    clearElement(outputList)
    outputList.append(
      createParagraph(`Created ${filename} (${formatBytes(bytes.byteLength || bytes.length || 0)}).`, 'legacy-workflow__status'),
      createOutputLink(filename, bytes)
    )
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-text-extract', [
    'Load one PDF and review preflight expectations for text-only output.',
    'Run extraction to create a compact PDF focused on text content.',
    'Download from the output panel and manually spot-check formatting.'
  ])

  return () => {}
}
