import { CommandStack } from '../core/command-stack.js'
import { createPdfDocument } from '../core/pdflib-runtime.js'
import {
  clearElement,
  createOutputLink,
  createParagraph,
  createThumbnailBoard,
  downloadBytes,
  formatBytes,
  loadPdfFromFile,
  renderPreviewPage
} from './common.js'

export const id = 'organizer'
export const navLabel = 'Pages Studio'
export const label = 'Pages Studio'
export const description = 'Reorder, rotate, delete, and export updated PDFs with a live preflight summary.'

function reorderPages(order, fromPage, toPage) {
  const next = [...order]
  const fromIndex = next.indexOf(fromPage)
  const toIndex = next.indexOf(toPage)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return next
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export async function mount(context) {
  const { primaryPanel, secondaryPanel, createSection } = context
  const commandStack = new CommandStack(120)

  let loadedDocument = null
  let thumbnailBoard = null
  let pageOrder = []
  let selectedPages = new Set()
  let previewRenderVersion = 0
  let previewRenderChain = Promise.resolve()
  const deletedPages = new Set()
  const pageRotations = new Map()

  const fileSection = createSection('Load PDF')
  const fileInputWrapper = document.createElement('div')
  fileInputWrapper.className = 'cl-file-input'
  fileInputWrapper.innerHTML = `
    <input type="file" id="organizer-file-input" accept=".pdf">
    <label for="organizer-file-input" class="cl-file-input__trigger legacy-focus-ring">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span class="cl-file-input__label">Choose PDF file</span>
    </label>
    <span class="cl-file-input__status" id="organizer-file-status">No file selected</span>
  `
  fileSection.append(fileInputWrapper)

  const toolbarSection = createSection('Page Actions')
  const toolbar = document.createElement('div')
  toolbar.className = 'pdf-tool-toolbar'
  toolbar.innerHTML = `
    <button class="cl-btn-secondary legacy-focus-ring" type="button" data-action="rotate-left">Rotate ⟲</button>
    <button class="cl-btn-secondary legacy-focus-ring" type="button" data-action="rotate-right">Rotate ⟳</button>
    <button class="cl-btn-secondary legacy-focus-ring" type="button" data-action="delete-toggle">Delete / Restore</button>
    <button class="cl-btn-secondary legacy-focus-ring" type="button" data-action="undo">Undo</button>
    <button class="cl-btn-secondary legacy-focus-ring" type="button" data-action="redo">Redo</button>
    <button class="cl-btn-secondary legacy-focus-ring" type="button" data-action="reset">Reset</button>
    <span class="toolbar-spacer" aria-hidden="true"></span>
    <span class="pdf-selection-summary" id="organizer-selection-summary">0 pages selected</span>
  `
  toolbarSection.append(toolbar)

  const boardSection = createSection('Thumbnail Board')
  const thumbBoard = document.createElement('div')
  thumbBoard.className = 'pdf-thumb-board'
  boardSection.append(thumbBoard)

  primaryPanel.append(fileSection, toolbarSection, boardSection)

  const inspectorSection = createSection('Inspector')
  const previewFrame = document.createElement('div')
  previewFrame.className = 'pdf-preview-frame'
  const previewCanvas = document.createElement('canvas')
  previewCanvas.width = 300
  previewCanvas.height = 420
  previewFrame.append(previewCanvas)
  inspectorSection.append(previewFrame)

  const preflightSection = createSection('Preflight')
  const preflightText = createParagraph('Load a PDF to view page counts and pending changes.', 'legacy-workflow__status')
  preflightSection.append(preflightText)

  const outputSection = createSection('Output')
  const outputActions = document.createElement('div')
  outputActions.className = 'legacy-workflow__actions'
  const exportButton = document.createElement('button')
  exportButton.className = 'cl-btn-primary legacy-focus-ring'
  exportButton.type = 'button'
  exportButton.textContent = 'Save Updated PDF'
  exportButton.disabled = true
  const extractSelectionButton = document.createElement('button')
  extractSelectionButton.className = 'cl-btn-secondary legacy-focus-ring'
  extractSelectionButton.type = 'button'
  extractSelectionButton.textContent = 'Extract Selection'
  extractSelectionButton.disabled = true
  outputActions.append(exportButton, extractSelectionButton)
  const outputResults = document.createElement('div')
  outputResults.className = 'pdf-output-list'
  outputResults.append(createParagraph('No output generated yet.', 'legacy-workflow__status'))
  outputSection.append(outputActions, outputResults)

  secondaryPanel.append(inspectorSection, preflightSection, outputSection)

  const fileInput = fileInputWrapper.querySelector('input[type="file"]')
  const fileStatus = fileInputWrapper.querySelector('#organizer-file-status')
  const selectionSummary = toolbar.querySelector('#organizer-selection-summary')

  const refreshSummary = () => {
    selectionSummary.textContent = `${selectedPages.size} page${selectedPages.size === 1 ? '' : 's'} selected`

    if (!loadedDocument) {
      preflightText.textContent = 'Load a PDF to view page counts and pending changes.'
      exportButton.disabled = true
      extractSelectionButton.disabled = true
      return
    }

    const removedCount = deletedPages.size
    const rotatedCount = Array.from(pageRotations.values()).filter((rotation) => rotation % 360 !== 0).length
    const remaining = pageOrder.filter((page) => !deletedPages.has(page)).length
    preflightText.textContent = `Pages: ${loadedDocument.pageCount}. Reordered: ${pageOrder.some((page, index) => page !== index + 1) ? 'yes' : 'no'}. Rotations: ${rotatedCount}. Removed: ${removedCount}. Final pages: ${remaining}.`
    exportButton.disabled = remaining === 0
    extractSelectionButton.disabled = selectedPages.size === 0
  }

  const refreshBoardState = () => {
    if (thumbnailBoard) {
      thumbnailBoard.refreshState()
      thumbnailBoard.updateOrder(pageOrder)
    }
    refreshSummary()
  }

  const renderPreviewForPage = async (pageNumber, renderToken) => {
    if (!loadedDocument || !pageNumber) return
    await renderPreviewPage(loadedDocument.pdfJsDoc, pageNumber, previewCanvas)
    if (renderToken !== previewRenderVersion) return
    const rotation = pageRotations.get(pageNumber) || 0
    previewCanvas.style.transform = `rotate(${rotation}deg)`
    previewCanvas.style.transformOrigin = 'center center'
  }

  const schedulePreviewForPage = (pageNumber) => {
    if (!pageNumber) return previewRenderChain
    const renderToken = ++previewRenderVersion
    previewRenderChain = previewRenderChain
      .then(async () => {
        if (renderToken !== previewRenderVersion) return
        await renderPreviewForPage(pageNumber, renderToken)
      })
      .catch((error) => {
        const message = String(error?.message || error)
        if (message.includes('Cannot use the same canvas during multiple render() operations')) {
          return
        }
        console.error(error)
      })
    return previewRenderChain
  }

  const applyRotation = async (deltaDegrees) => {
    if (!selectedPages.size) return
    const targetPages = Array.from(selectedPages)
    const before = targetPages.map((page) => [page, pageRotations.get(page) || 0])

    await commandStack.execute({
      do: async () => {
        targetPages.forEach((page) => {
          const current = pageRotations.get(page) || 0
          pageRotations.set(page, ((current + deltaDegrees) % 360 + 360) % 360)
        })
        refreshBoardState()
      },
      undo: async () => {
        before.forEach(([page, rotation]) => {
          if (rotation === 0) pageRotations.delete(page)
          else pageRotations.set(page, rotation)
        })
        refreshBoardState()
      }
    })

    const firstPage = targetPages[0]
    if (firstPage) {
      await schedulePreviewForPage(firstPage)
    }
  }

  const toggleDeleteSelection = async () => {
    if (!selectedPages.size) return
    const targetPages = Array.from(selectedPages)
    const before = targetPages.map((page) => deletedPages.has(page))

    await commandStack.execute({
      do: async () => {
        targetPages.forEach((page, index) => {
          if (before[index]) {
            deletedPages.delete(page)
          } else {
            deletedPages.add(page)
          }
        })
        refreshBoardState()
      },
      undo: async () => {
        targetPages.forEach((page, index) => {
          if (before[index]) deletedPages.add(page)
          else deletedPages.delete(page)
        })
        refreshBoardState()
      }
    })
  }

  toolbar.addEventListener('click', async (event) => {
    const target = event.target.closest('button[data-action]')
    if (!target) return
    const action = target.dataset.action

    if (action === 'rotate-left') await applyRotation(-90)
    if (action === 'rotate-right') await applyRotation(90)
    if (action === 'delete-toggle') await toggleDeleteSelection()
    if (action === 'undo') {
      await commandStack.undo()
      refreshBoardState()
    }
    if (action === 'redo') {
      await commandStack.redo()
      refreshBoardState()
    }
    if (action === 'reset') {
      pageOrder = Array.from({ length: loadedDocument?.pageCount || 0 }, (_, index) => index + 1)
      deletedPages.clear()
      pageRotations.clear()
      commandStack.clear()
      refreshBoardState()
    }
  })

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    fileStatus.textContent = file.name
    outputResults.replaceChildren(createParagraph('No output generated yet.'))

    loadedDocument = await loadPdfFromFile(file)
    pageOrder = Array.from({ length: loadedDocument.pageCount }, (_, index) => index + 1)
    selectedPages = new Set()
    deletedPages.clear()
    pageRotations.clear()
    commandStack.clear()

    if (thumbnailBoard) {
      thumbnailBoard.destroy()
    }

    thumbnailBoard = createThumbnailBoard({
      board: thumbBoard,
      pdfJsDoc: loadedDocument.pdfJsDoc,
      pages: pageOrder,
      selectedPages,
      onSelectionChange(nextSelectedPages) {
        selectedPages = new Set(nextSelectedPages)
        refreshSummary()
        const focusPage = nextSelectedPages[0]
        if (focusPage) {
          schedulePreviewForPage(focusPage)
        }
      },
      onOrderChange(fromPage, toPage) {
        const previousOrder = [...pageOrder]
        const nextOrder = reorderPages(previousOrder, fromPage, toPage)
        commandStack.execute({
          do: async () => {
            pageOrder = nextOrder
            thumbnailBoard.updateOrder(pageOrder)
            refreshSummary()
          },
          undo: async () => {
            pageOrder = previousOrder
            thumbnailBoard.updateOrder(pageOrder)
            refreshSummary()
          }
        }).catch((error) => console.error(error))
      },
      getStateForPage(pageNumber) {
        return {
          rotation: pageRotations.get(pageNumber) || 0,
          deleted: deletedPages.has(pageNumber)
        }
      }
    })

    selectedPages = new Set([1])
    thumbnailBoard.selectPages([1])
    await schedulePreviewForPage(1)
    refreshSummary()
  })

  const exportUpdatedPdf = async (pagesToExport, filename) => {
    if (!loadedDocument) return
    const { degrees } = PDFLib
    const sourcePdf = loadedDocument.pdfLibDoc
    const outputPdf = await createPdfDocument()

    const pageIndexes = pagesToExport.map((pageNumber) => pageNumber - 1)
    const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndexes)

    copiedPages.forEach((page, index) => {
      const sourcePageNumber = pagesToExport[index]
      const rotation = pageRotations.get(sourcePageNumber) || 0
      if (rotation) {
        page.setRotation(degrees(rotation))
      }
      outputPdf.addPage(page)
    })

    const bytes = await outputPdf.save()
    downloadBytes(bytes, filename)
    const outputLink = createOutputLink(filename, bytes)

    clearElement(outputResults)
    outputResults.append(
      createParagraph(`Generated ${filename} (${formatBytes(bytes.byteLength || bytes.length || 0)}).`, 'legacy-workflow__status'),
      outputLink
    )
  }

  exportButton.addEventListener('click', async () => {
    if (!loadedDocument) return
    const finalPages = pageOrder.filter((page) => !deletedPages.has(page))
    await exportUpdatedPdf(finalPages, `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_organized.pdf`)
  })

  extractSelectionButton.addEventListener('click', async () => {
    if (!loadedDocument || selectedPages.size === 0) return
    const selection = pageOrder.filter((page) => selectedPages.has(page) && !deletedPages.has(page))
    if (!selection.length) return
    await exportUpdatedPdf(selection, `${loadedDocument.file.name.replace(/\.pdf$/i, '')}_selection.pdf`)
  })

  const handleKeyDown = async (event) => {
    if (!loadedDocument) return
    if (event.key === 'Escape') {
      selectedPages.clear()
      thumbnailBoard?.selectPages([])
      return
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault()
      await applyRotation(90)
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      await toggleDeleteSelection()
    }
  }

  document.addEventListener('keydown', handleKeyDown)

  window.LegacyGuidance?.maybeShow('pdf-studio-organizer', [
    'Load a PDF and select one or more pages in the thumbnail board.',
    'Use toolbar actions to rotate, delete, or reorder pages with drag and drop.',
    'Review preflight counts and export your updated PDF.'
  ])

  return () => {
    thumbnailBoard?.destroy()
    document.removeEventListener('keydown', handleKeyDown)
  }
}
