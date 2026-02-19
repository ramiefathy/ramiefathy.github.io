import { createPdfDocument } from '../core/pdflib-runtime.js'
import { readJpegExifOrientation } from '../core/exif-jpeg.js'
import { clearElement, createEmptyState, createOutputLink, createParagraph, formatBytes } from './common.js'

export const id = 'image'
export const navLabel = 'Image Packet'
export const label = 'Image Packet Builder'
export const description = 'Package clinical images into a single PDF with reorder, fit modes, captions, and optional cover page.'

const PAGE_PRESETS = {
  letter: { label: 'Letter (8.5×11)', width: 612, height: 792 },
  a4: { label: 'A4', width: 595, height: 842 }
}

async function fileToObjectUrl(file) {
  return URL.createObjectURL(file)
}

async function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
    image.src = URL.createObjectURL(blob)
  })
}

function drawWithOrientation(context, image, orientation, width, height) {
  switch (orientation) {
    case 3:
      context.translate(width, height)
      context.rotate(Math.PI)
      break
    case 6:
      context.translate(width, 0)
      context.rotate(Math.PI / 2)
      break
    case 8:
      context.translate(0, height)
      context.rotate(-Math.PI / 2)
      break
    default:
      break
  }
  context.drawImage(image, 0, 0)
}

async function normalizeImageForPdf(item) {
  const isJpeg = item.file.type === 'image/jpeg' || /\.jpe?g$/i.test(item.file.name)
  if (!isJpeg) {
    return {
      bytes: new Uint8Array(await item.file.arrayBuffer()),
      type: item.file.type === 'image/png' ? 'png' : 'jpg',
      width: item.dimensions.width,
      height: item.dimensions.height
    }
  }

  const fileBytes = new Uint8Array(await item.file.arrayBuffer())
  const orientation = readJpegExifOrientation(fileBytes) || 1
  if (![3, 6, 8].includes(orientation) && item.rotation === 0) {
    return {
      bytes: fileBytes,
      type: 'jpg',
      width: item.dimensions.width,
      height: item.dimensions.height
    }
  }

  const image = await loadImageFromBlob(item.file)
  const rotateQuarterTurns = ((item.rotation || 0) % 360 + 360) % 360 / 90
  const orientationTurns = orientation === 6 ? 1 : orientation === 3 ? 2 : orientation === 8 ? 3 : 0
  const totalTurns = (rotateQuarterTurns + orientationTurns) % 4
  const targetWidth = totalTurns % 2 === 0 ? image.width : image.height
  const targetHeight = totalTurns % 2 === 0 ? image.height : image.width

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  context.save()

  if (totalTurns === 1) {
    context.translate(targetWidth, 0)
    context.rotate(Math.PI / 2)
  } else if (totalTurns === 2) {
    context.translate(targetWidth, targetHeight)
    context.rotate(Math.PI)
  } else if (totalTurns === 3) {
    context.translate(0, targetHeight)
    context.rotate(-Math.PI / 2)
  }

  drawWithOrientation(context, image, 1, image.width, image.height)
  context.restore()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    type: 'jpg',
    width: targetWidth,
    height: targetHeight
  }
}

function getPlacement(pageWidth, pageHeight, imageWidth, imageHeight, fitMode, margin) {
  const maxWidth = pageWidth - margin * 2
  const maxHeight = pageHeight - margin * 2

  const scaleFit = Math.min(maxWidth / imageWidth, maxHeight / imageHeight)
  const scaleFill = Math.max(maxWidth / imageWidth, maxHeight / imageHeight)
  const scale = fitMode === 'fill' ? scaleFill : scaleFit

  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  const x = (pageWidth - drawWidth) / 2
  const y = (pageHeight - drawHeight) / 2
  return { x, y, drawWidth, drawHeight }
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context

  const items = []
  let selectedIndex = -1

  const uploadSection = createSection('Load Images')
  const uploadInput = document.createElement('div')
  uploadInput.className = 'cl-file-input'
  uploadInput.innerHTML = `
    <input type="file" id="image-packet-input" accept="image/png,image/jpeg,image/heic" multiple>
    <label for="image-packet-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <span class="cl-file-input__label">Choose images</span>
    </label>
    <span class="cl-file-input__status" id="image-packet-status">No images selected</span>
  `
  uploadSection.append(uploadInput)

  const settingsSection = createSection('Packet Settings')
  const settingsGrid = document.createElement('div')
  settingsGrid.className = 'pdf-form-grid columns-2'
  settingsGrid.innerHTML = `
    <div class="legacy-workflow__field">
      <label for="packet-page-size">Page size</label>
      <select id="packet-page-size">
        <option value="letter">Letter (8.5×11)</option>
        <option value="a4">A4</option>
        <option value="auto">Auto (match image)</option>
      </select>
    </div>
    <div class="legacy-workflow__field">
      <label for="packet-fit-mode">Fit mode</label>
      <select id="packet-fit-mode">
        <option value="fit">Fit within page</option>
        <option value="fill">Fill page (crop)</option>
      </select>
    </div>
  `
  const coverToggleLabel = document.createElement('label')
  coverToggleLabel.className = 'legacy-workflow__status'
  coverToggleLabel.innerHTML = '<input type="checkbox" id="packet-cover-toggle"> Add cover page with title and date'
  settingsSection.append(settingsGrid, coverToggleLabel)

  const boardSection = createSection('Image Board')
  const board = document.createElement('div')
  board.className = 'pdf-thumb-board'
  board.append(createEmptyState('No images loaded', 'Choose one or more images to build a PDF packet.'))
  boardSection.append(board)

  primaryPanel.append(uploadSection, settingsSection, boardSection)

  const previewSection = createSection('Preview')
  const previewFrame = document.createElement('div')
  previewFrame.className = 'pdf-preview-frame'
  const previewCanvas = document.createElement('canvas')
  previewFrame.append(previewCanvas)
  previewSection.append(previewFrame)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Add images to preview packet summary.', 'legacy-workflow__status')
  const warningList = document.createElement('ul')
  warningList.className = 'pdf-warnings'
  preflightSection.append(preflightText, warningList)

  const outputSection = createSection('Output')
  const buildButton = document.createElement('button')
  buildButton.type = 'button'
  buildButton.className = 'cl-btn-primary legacy-focus-ring'
  buildButton.textContent = 'Build PDF packet'
  buildButton.disabled = true
  const outputList = document.createElement('div')
  outputList.className = 'pdf-output-list'
  outputList.append(createEmptyState('No output yet', 'Load images and build a packet to generate a downloadable PDF.'))
  outputSection.append(buildButton, outputList)

  secondaryPanel.append(previewSection, preflightSection, outputSection)

  const fileInput = uploadInput.querySelector('#image-packet-input')
  const fileStatus = uploadInput.querySelector('#image-packet-status')
  const pageSizeSelect = settingsGrid.querySelector('#packet-page-size')
  const fitModeSelect = settingsGrid.querySelector('#packet-fit-mode')
  const coverToggle = settingsSection.querySelector('#packet-cover-toggle')

  const refreshPreflight = () => {
    if (!items.length) {
      preflightText.textContent = 'Add images to preview packet summary.'
      clearElement(warningList)
      buildButton.disabled = true
      clearElement(outputList)
      outputList.append(createEmptyState('No output yet', 'Load images and build a packet to generate a downloadable PDF.'))
      return
    }

    const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0)
    preflightText.textContent = `${items.length} image(s) queued. Estimated packet size before compression: ${formatBytes(totalBytes)}.`
    buildButton.disabled = false

    clearElement(warningList)
    const heicCount = items.filter((item) => /\.heic$/i.test(item.file.name) || item.file.type === 'image/heic').length
    if (heicCount > 0) {
      const warningItem = document.createElement('li')
      warningItem.textContent = `${heicCount} HEIC file(s) detected. Browser support varies; unsupported files will be skipped.`
      warningList.append(warningItem)
    }
  }

  const drawPreview = async () => {
    if (selectedIndex < 0 || !items[selectedIndex]) {
      const context2d = previewCanvas.getContext('2d')
      context2d.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
      return
    }

    const item = items[selectedIndex]
    const image = await loadImageFromBlob(item.file)
    previewCanvas.width = 520
    previewCanvas.height = 680
    const context2d = previewCanvas.getContext('2d')
    context2d.fillStyle = '#ffffff'
    context2d.fillRect(0, 0, previewCanvas.width, previewCanvas.height)

    const placement = getPlacement(previewCanvas.width, previewCanvas.height, image.width, image.height, fitModeSelect.value, 24)
    context2d.save()
    context2d.translate(placement.x + placement.drawWidth / 2, placement.y + placement.drawHeight / 2)
    context2d.rotate((item.rotation * Math.PI) / 180)
    context2d.drawImage(image, -placement.drawWidth / 2, -placement.drawHeight / 2, placement.drawWidth, placement.drawHeight)
    context2d.restore()

    if (item.caption) {
      context2d.fillStyle = '#1e293b'
      context2d.font = '16px "IBM Plex Sans", sans-serif'
      context2d.fillText(item.caption, 24, previewCanvas.height - 24)
    }
  }

  const renderBoard = () => {
    clearElement(board)
    if (!items.length) {
      board.append(createEmptyState('No images loaded', 'Choose one or more images to start building a packet.'))
      return
    }

    items.forEach((item, index) => {
      const tile = document.createElement('article')
      tile.className = 'pdf-thumb-tile legacy-focus-ring'
      if (index === selectedIndex) tile.classList.add('is-selected')
      tile.draggable = true
      tile.tabIndex = 0

      const image = document.createElement('img')
      image.src = item.url
      image.alt = item.file.name
      image.style.width = '100%'
      image.style.aspectRatio = '3 / 4'
      image.style.objectFit = 'cover'
      image.style.borderRadius = 'var(--radius)'
      image.style.border = '1px solid var(--cl-border)'
      tile.append(image)

      const meta = document.createElement('div')
      meta.className = 'pdf-thumb-meta'
      meta.textContent = `${index + 1}. ${item.file.name}`
      tile.append(meta)

      const actionRow = document.createElement('div')
      actionRow.className = 'legacy-workflow__actions'
      const rotateButton = document.createElement('button')
      rotateButton.type = 'button'
      rotateButton.className = 'cl-btn-secondary legacy-focus-ring'
      rotateButton.textContent = 'Rotate'
      rotateButton.addEventListener('click', (event) => {
        event.stopPropagation()
        item.rotation = (item.rotation + 90) % 360
        drawPreview().catch((error) => console.error(error))
      })

      const removeButton = document.createElement('button')
      removeButton.type = 'button'
      removeButton.className = 'cl-btn-secondary legacy-focus-ring'
      removeButton.textContent = 'Remove'
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation()
        items.splice(index, 1)
        if (selectedIndex >= items.length) selectedIndex = items.length - 1
        renderBoard()
        refreshPreflight()
        drawPreview().catch((error) => console.error(error))
      })
      actionRow.append(rotateButton, removeButton)

      const captionField = document.createElement('input')
      captionField.type = 'text'
      captionField.className = 'legacy-workflow__input'
      captionField.placeholder = 'Optional caption'
      captionField.value = item.caption
      captionField.addEventListener('click', (event) => event.stopPropagation())
      captionField.addEventListener('input', () => {
        item.caption = captionField.value
        if (index === selectedIndex) {
          drawPreview().catch((error) => console.error(error))
        }
      })

      tile.append(actionRow, captionField)

      tile.addEventListener('click', () => {
        selectedIndex = index
        renderBoard()
        drawPreview().catch((error) => console.error(error))
      })

      tile.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', String(index))
      })

      tile.addEventListener('dragover', (event) => {
        event.preventDefault()
      })

      tile.addEventListener('drop', (event) => {
        event.preventDefault()
        const fromIndex = Number.parseInt(event.dataTransfer.getData('text/plain'), 10)
        const toIndex = index
        if (Number.isNaN(fromIndex) || fromIndex === toIndex) return
        const [moved] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moved)
        selectedIndex = toIndex
        renderBoard()
      })

      board.append(tile)
    })
  }

  fileInput.addEventListener('change', async () => {
    const selectedFiles = Array.from(fileInput.files || [])
    if (!selectedFiles.length) return

    items.forEach((item) => URL.revokeObjectURL(item.url))
    items.length = 0

    for (const file of selectedFiles) {
      const url = await fileToObjectUrl(file)
      const image = await loadImageFromBlob(file)
      items.push({
        file,
        url,
        caption: '',
        rotation: 0,
        dimensions: { width: image.width, height: image.height }
      })
    }

    fileStatus.textContent = `${items.length} image(s) loaded`
    clearElement(outputList)
    outputList.append(createEmptyState('No output yet', 'Build the packet to generate a downloadable PDF.'))
    selectedIndex = items.length ? 0 : -1
    renderBoard()
    refreshPreflight()
    await drawPreview()
  })

  const addCoverPageIfNeeded = async (pdfDocument) => {
    if (!coverToggle.checked) return
    const coverPage = pdfDocument.addPage([612, 792])
    const { StandardFonts, rgb } = PDFLib
    const headingFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold)
    const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica)

    const title = 'Image Packet'
    const dateLabel = new Date().toLocaleDateString()
    coverPage.drawText(title, { x: 72, y: 700, size: 28, font: headingFont, color: rgb(0.07, 0.25, 0.24) })
    coverPage.drawText(`Generated ${dateLabel}`, { x: 72, y: 664, size: 13, font: bodyFont, color: rgb(0.2, 0.25, 0.3) })
  }

  buildButton.addEventListener('click', async () => {
    if (!items.length) return

    const pdfDocument = await createPdfDocument()
    await addCoverPageIfNeeded(pdfDocument)
    const pageSizeMode = pageSizeSelect.value
    const fitMode = fitModeSelect.value

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]
      if (/\.heic$/i.test(item.file.name) || item.file.type === 'image/heic') {
        continue
      }

      const normalized = await normalizeImageForPdf(item)
      const embedded = normalized.type === 'png'
        ? await pdfDocument.embedPng(normalized.bytes)
        : await pdfDocument.embedJpg(normalized.bytes)

      const pageSize = pageSizeMode === 'auto'
        ? { width: normalized.width, height: normalized.height }
        : PAGE_PRESETS[pageSizeMode]

      const page = pdfDocument.addPage([pageSize.width, pageSize.height])
      const placement = getPlacement(pageSize.width, pageSize.height, normalized.width, normalized.height, fitMode, 24)
      page.drawImage(embedded, {
        x: placement.x,
        y: placement.y,
        width: placement.drawWidth,
        height: placement.drawHeight
      })

      if (item.caption) {
        const { StandardFonts, rgb } = PDFLib
        const captionFont = await pdfDocument.embedFont(StandardFonts.Helvetica)
        page.drawText(item.caption, {
          x: 24,
          y: 20,
          size: 11,
          font: captionFont,
          color: rgb(0.2, 0.23, 0.28)
        })
      }
    }

    const bytes = await pdfDocument.save()
    clearElement(outputList)

    const filename = `image_packet_${new Date().toISOString().slice(0, 10)}.pdf`
    outputList.append(
      createParagraph(`Generated ${filename} (${formatBytes(bytes.byteLength || bytes.length || 0)}).`, 'legacy-workflow__status'),
      createOutputLink(filename, bytes)
    )
  })

  window.LegacyGuidance?.maybeShow('pdf-studio-image', [
    'Drop or choose images, then reorder in the image board.',
    'Use page-size and fit settings to control final packet layout.',
    'Build and download the combined PDF packet.'
  ])

  return () => {
    items.forEach((item) => URL.revokeObjectURL(item.url))
  }
}
