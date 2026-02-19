import { clearElement, createOutputLink, createParagraph, formatBytes } from './common.js'

export const id = 'metadata'
export const navLabel = 'Metadata'
export const label = 'Metadata Inspector & Scrubber'
export const description = 'Inspect PDF document information and scrub or reset standard metadata fields before sharing.'

function getStandardMetadata(pdfDocument) {
  const rawKeywords = pdfDocument.getKeywords?.()
  const normalizedKeywords = Array.isArray(rawKeywords)
    ? rawKeywords.join(', ')
    : (typeof rawKeywords === 'string' ? rawKeywords : '')

  return {
    Title: pdfDocument.getTitle() || '',
    Author: pdfDocument.getAuthor() || '',
    Subject: pdfDocument.getSubject() || '',
    Keywords: normalizedKeywords,
    Producer: pdfDocument.getProducer() || '',
    Creator: pdfDocument.getCreator() || '',
    CreationDate: pdfDocument.getCreationDate()?.toISOString() || '',
    ModificationDate: pdfDocument.getModificationDate()?.toISOString() || ''
  }
}

function renderMetadataTable(target, current, next) {
  clearElement(target)
  const table = document.createElement('table')
  table.style.width = '100%'
  table.style.borderCollapse = 'collapse'

  const header = document.createElement('tr')
  header.innerHTML = '<th style="text-align:left; padding:8px; border-bottom:1px solid var(--cl-border);">Field</th><th style="text-align:left; padding:8px; border-bottom:1px solid var(--cl-border);">Current</th><th style="text-align:left; padding:8px; border-bottom:1px solid var(--cl-border);">After scrub</th>'
  table.append(header)

  Object.keys(current).forEach((fieldName) => {
    const row = document.createElement('tr')
    row.innerHTML = `
      <td style="padding:8px; border-bottom:1px solid var(--cl-border); font-weight:600;">${fieldName}</td>
      <td style="padding:8px; border-bottom:1px solid var(--cl-border);">${current[fieldName] || '—'}</td>
      <td style="padding:8px; border-bottom:1px solid var(--cl-border);">${next[fieldName] || '—'}</td>
    `
    table.append(row)
  })

  target.append(table)
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  let loadedFile = null
  let loadedBuffer = null
  let currentMetadata = null

  const loadSection = createSection('Load PDF')
  const inputWrapper = document.createElement('div')
  inputWrapper.className = 'cl-file-input'
  inputWrapper.innerHTML = `
    <input type="file" id="metadata-file-input" accept=".pdf">
    <label for="metadata-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="metadata-file-status">No file selected</span>
  `
  loadSection.append(inputWrapper)

  const scrubSection = createSection('Scrub Controls')
  const scrubGrid = document.createElement('div')
  scrubGrid.className = 'pdf-form-grid columns-2'
  scrubGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label><input type="checkbox" id="metadata-clear-fields" checked> Clear title/author/subject/keywords</label>
      <label><input type="checkbox" id="metadata-clear-dates" checked> Normalize creation/modification dates</label>
    </div>
    <div class="legacy-workflow__field">
      <label for="metadata-new-title">New title (optional)</label>
      <input id="metadata-new-title" type="text" placeholder="Consult Note">
      <label for="metadata-new-author">New author (optional)</label>
      <input id="metadata-new-author" type="text" placeholder="Dermatology Team">
    </div>
  `
  scrubSection.append(scrubGrid)

  const metadataSection = createSection('Metadata Diff')
  const metadataTableHost = document.createElement('div')
  metadataSection.append(metadataTableHost)

  primaryPanel.append(loadSection, scrubSection, metadataSection)

  const notesSection = createSection('What this does / does not do')
  const notes = document.createElement('ul')
  notes.className = 'notes-list'
  notes.innerHTML = `
    <li>Removes or rewrites standard PDF document information fields.</li>
    <li>Normalizes metadata timestamps when requested.</li>
    <li><strong>This is not de-identification.</strong> Visible text, images, and page content remain unchanged.</li>
    <li>Embedded XMP metadata may persist depending on document internals.</li>
  `
  notesSection.append(notes)

  const outputSection = createSection('Output')
  const runButton = document.createElement('button')
  runButton.type = 'button'
  runButton.className = 'cl-btn-primary legacy-focus-ring'
  runButton.textContent = 'Scrub metadata'
  runButton.disabled = true
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(runButton, outputList)

  secondaryPanel.append(notesSection, outputSection)

  const fileInput = inputWrapper.querySelector('#metadata-file-input')
  const fileStatus = inputWrapper.querySelector('#metadata-file-status')
  const clearFields = scrubGrid.querySelector('#metadata-clear-fields')
  const clearDates = scrubGrid.querySelector('#metadata-clear-dates')
  const newTitleInput = scrubGrid.querySelector('#metadata-new-title')
  const newAuthorInput = scrubGrid.querySelector('#metadata-new-author')

  const buildProjectedMetadata = () => {
    if (!currentMetadata) return null
    const next = { ...currentMetadata }

    if (clearFields.checked) {
      next.Title = ''
      next.Author = ''
      next.Subject = ''
      next.Keywords = ''
    }

    if (newTitleInput.value.trim()) {
      next.Title = newTitleInput.value.trim()
    }
    if (newAuthorInput.value.trim()) {
      next.Author = newAuthorInput.value.trim()
    }

    if (clearDates.checked) {
      next.CreationDate = ''
      next.ModificationDate = ''
    }

    return next
  }

  const refreshMetadataDiff = () => {
    if (!currentMetadata) {
      metadataTableHost.replaceChildren(createParagraph('Load a PDF to inspect metadata.', 'legacy-workflow__status'))
      return
    }

    const projected = buildProjectedMetadata()
    renderMetadataTable(metadataTableHost, currentMetadata, projected)
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    loadedFile = file
    loadedBuffer = await file.arrayBuffer()
    const pdfDocument = await PDFLib.PDFDocument.load(loadedBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    })

    currentMetadata = getStandardMetadata(pdfDocument)
    fileStatus.textContent = file.name
    runButton.disabled = false
    refreshMetadataDiff()
  })

  scrubSection.addEventListener('input', refreshMetadataDiff)

  runButton.addEventListener('click', async () => {
    if (!loadedBuffer || !loadedFile) return

    const pdfDocument = await PDFLib.PDFDocument.load(loadedBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    })

    if (clearFields.checked) {
      pdfDocument.setTitle('')
      pdfDocument.setAuthor('')
      pdfDocument.setSubject('')
      pdfDocument.setKeywords([])
    }

    if (newTitleInput.value.trim()) {
      pdfDocument.setTitle(newTitleInput.value.trim())
    }
    if (newAuthorInput.value.trim()) {
      pdfDocument.setAuthor(newAuthorInput.value.trim())
    }

    if (clearDates.checked) {
      const fallbackDate = new Date('2000-01-01T00:00:00.000Z')
      pdfDocument.setCreationDate(fallbackDate)
      pdfDocument.setModificationDate(fallbackDate)
    }

    const bytes = await pdfDocument.save()
    const filename = `${loadedFile.name.replace(/\.pdf$/i, '')}_metadata_scrubbed.pdf`

    const postCheckDocument = await PDFLib.PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false
    })
    currentMetadata = getStandardMetadata(postCheckDocument)
    refreshMetadataDiff()

    clearElement(outputList)
    outputList.append(
      createParagraph(`Metadata scrub complete (${formatBytes(bytes.byteLength || bytes.length || 0)}).`, 'legacy-workflow__status'),
      createOutputLink(filename, bytes)
    )
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-metadata', [
    'Load a PDF and review the current metadata values in the diff table.',
    'Choose whether to clear fields, normalize dates, or set replacement title/author values.',
    'Export scrubbed output and verify the resulting metadata panel.'
  ])

  return () => {}
}
