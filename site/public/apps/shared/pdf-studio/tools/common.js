import { ThumbnailVirtualizer } from '../core/thumbnail-virtualizer.js'
import { loadPdfJsDocument, renderPdfPageToCanvas } from '../core/pdfjs-runtime.js'
import { loadPdfLibDocument } from '../core/pdflib-runtime.js'

const DEFAULT_THUMB_SCALE = 0.28
const DEFAULT_PREVIEW_SCALE = 1.05

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / (1024 ** index)
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

export function createParagraph(text, className = 'legacy-workflow__status') {
  const paragraph = document.createElement('p')
  paragraph.className = className
  paragraph.textContent = text
  return paragraph
}

export function clearElement(target) {
  while (target.firstChild) {
    target.removeChild(target.firstChild)
  }
}

export function downloadBytes(bytes, filename, mimeType = 'application/pdf') {
  const blob = new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return { blob, filename }
}

export async function loadPdfFromFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const [pdfJsDoc, pdfLibDoc] = await Promise.all([
    loadPdfJsDocument(arrayBuffer),
    loadPdfLibDocument(arrayBuffer)
  ])

  return {
    file,
    arrayBuffer,
    pdfJsDoc,
    pdfLibDoc,
    pageCount: pdfJsDoc.numPages
  }
}

export async function renderPreviewPage(pdfJsDoc, pageNumber, targetCanvas, scale = DEFAULT_PREVIEW_SCALE) {
  await renderPdfPageToCanvas(pdfJsDoc, pageNumber, targetCanvas, { scale })
}

function buildTileMeta(pageNumber, getStateForPage) {
  const state = getStateForPage ? getStateForPage(pageNumber) : {}
  const chips = []
  if (state.rotation) {
    chips.push({ tone: 'info', text: `Rotated ${state.rotation}°` })
  }
  if (state.deleted) {
    chips.push({ tone: 'danger', text: 'Will be removed' })
  }
  return chips
}

function updateTilePresentation(tile, pageNumber, selectedPages, getStateForPage) {
  const pageState = getStateForPage ? getStateForPage(pageNumber) : {}
  tile.classList.toggle('is-selected', selectedPages.has(pageNumber))
  tile.classList.toggle('is-deleted', Boolean(pageState.deleted))

  const chipsContainer = tile.querySelector('.pdf-thumb-chips')
  clearElement(chipsContainer)
  const chips = buildTileMeta(pageNumber, getStateForPage)
  chips.forEach((chip) => {
    const badge = document.createElement('span')
    badge.className = 'pdf-thumb-chip'
    badge.dataset.tone = chip.tone
    badge.textContent = chip.text
    chipsContainer.append(badge)
  })
}

export function createThumbnailBoard({
  board,
  pdfJsDoc,
  pages,
  selectedPages,
  onSelectionChange,
  onOrderChange,
  getStateForPage
}) {
  clearElement(board)
  const selected = selectedPages || new Set()
  let anchorPage = null

  const tileByPage = new Map()
  const virtualizer = new ThumbnailVirtualizer({
    container: board,
    async onRender(element, payload, signal) {
      if (signal.aborted) return
      const canvas = element.querySelector('canvas')
      if (!canvas || canvas.dataset.rendered === 'true') return
      await renderPdfPageToCanvas(pdfJsDoc, payload.pageNumber, canvas, { scale: DEFAULT_THUMB_SCALE })
      if (!signal.aborted) {
        canvas.dataset.rendered = 'true'
      }
    }
  })

  const emitSelection = () => {
    if (typeof onSelectionChange === 'function') {
      onSelectionChange(Array.from(selected).sort((first, second) => first - second))
    }
  }

  const getOrderedPagesFromDom = () =>
    Array.from(board.querySelectorAll('.pdf-thumb-tile'))
      .map((element) => Number.parseInt((element).dataset.page || '', 10))
      .filter((pageNumber) => Number.isFinite(pageNumber))

  const applySingleSelection = (pageNumber) => {
    selected.clear()
    selected.add(pageNumber)
    anchorPage = pageNumber
    tileByPage.forEach((tile, key) => updateTilePresentation(tile, key, selected, getStateForPage))
    emitSelection()
  }

  const moveSelection = (delta) => {
    const orderedPages = getOrderedPagesFromDom()
    if (!orderedPages.length) return

    const sortedSelection = Array.from(selected).sort((first, second) => first - second)
    const currentPage = anchorPage ?? sortedSelection[0] ?? orderedPages[0]
    const currentIndex = Math.max(0, orderedPages.indexOf(currentPage))
    const nextIndex = Math.min(orderedPages.length - 1, Math.max(0, currentIndex + delta))
    const nextPage = orderedPages[nextIndex]
    if (!Number.isFinite(nextPage)) return

    applySingleSelection(nextPage)
    tileByPage.get(nextPage)?.focus()
  }

  const handleTileClick = (event, pageNumber) => {
    if (event.shiftKey && anchorPage !== null) {
      const lower = Math.min(anchorPage, pageNumber)
      const upper = Math.max(anchorPage, pageNumber)
      selected.clear()
      for (let index = lower; index <= upper; index += 1) {
        selected.add(index)
      }
    } else if (event.metaKey || event.ctrlKey) {
      if (selected.has(pageNumber)) {
        selected.delete(pageNumber)
      } else {
        selected.add(pageNumber)
      }
      anchorPage = pageNumber
    } else {
      selected.clear()
      selected.add(pageNumber)
      anchorPage = pageNumber
    }

    tileByPage.forEach((tile, key) => updateTilePresentation(tile, key, selected, getStateForPage))
    emitSelection()
  }

  const dragState = { fromPage: null }

  pages.forEach((pageNumber) => {
    const tile = document.createElement('article')
    tile.className = 'pdf-thumb-tile legacy-focus-ring'
    tile.tabIndex = 0
    tile.draggable = true
    tile.dataset.page = String(pageNumber)
    tile.innerHTML = `
      <canvas aria-hidden="true"></canvas>
      <div class="pdf-thumb-meta">
        <span>Page ${pageNumber}</span>
      </div>
      <div class="pdf-thumb-chips"></div>
    `

    tile.addEventListener('click', (event) => handleTileClick(event, pageNumber))
    tile.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        moveSelection(1)
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveSelection(-1)
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleTileClick(event, pageNumber)
      }
    })

    tile.addEventListener('dragstart', (event) => {
      dragState.fromPage = pageNumber
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(pageNumber))
    })

    tile.addEventListener('dragover', (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    })

    tile.addEventListener('drop', (event) => {
      event.preventDefault()
      const fromPage = dragState.fromPage
      const toPage = pageNumber
      if (!fromPage || fromPage === toPage) return
      if (typeof onOrderChange === 'function') {
        onOrderChange(fromPage, toPage)
      }
    })

    board.append(tile)
    tileByPage.set(pageNumber, tile)
    updateTilePresentation(tile, pageNumber, selected, getStateForPage)
    virtualizer.register(tile, `thumb-${pageNumber}`, { pageNumber })
  })

  return {
    virtualizer,
    refreshState() {
      tileByPage.forEach((tile, pageNumber) => updateTilePresentation(tile, pageNumber, selected, getStateForPage))
    },
    updateOrder(newPages) {
      newPages.forEach((pageNumber) => {
        const tile = tileByPage.get(pageNumber)
        if (tile) board.append(tile)
      })
    },
    getSelectedPages() {
      return Array.from(selected).sort((first, second) => first - second)
    },
    selectPages(pagesToSelect) {
      selected.clear()
      pagesToSelect.forEach((pageNumber) => selected.add(pageNumber))
      anchorPage = pagesToSelect.length ? pagesToSelect[0] : null
      this.refreshState()
      emitSelection()
    },
    destroy() {
      virtualizer.unregisterAll()
      tileByPage.clear()
    }
  }
}

export function createOutputLink(filename, bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.className = 'legacy-btn legacy-btn--secondary legacy-focus-ring'
  link.textContent = `Download ${filename}`
  link.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(url), 2_000)
  })
  return link
}
