const DEFAULT_WORKER_PATH = './vendor/pdf.worker.min.js'

export function getPdfJs() {
  if (!globalThis.pdfjsLib) {
    throw new Error('pdf.js runtime is not available on window.pdfjsLib')
  }
  return globalThis.pdfjsLib
}

export function configurePdfJsWorker(workerPath = DEFAULT_WORKER_PATH) {
  const pdfjs = getPdfJs()
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath
  return pdfjs
}

export async function loadPdfJsDocument(arrayBuffer) {
  const pdfjs = configurePdfJsWorker()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  return loadingTask.promise
}

export async function renderPdfPageToCanvas(pdfJsDocument, pageNumber, canvas, options = {}) {
  const page = await pdfJsDocument.getPage(pageNumber)
  const viewport = page.getViewport({ scale: options.scale || 1 })
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const context = canvas.getContext('2d', { alpha: false })
  await page.render({ canvasContext: context, viewport }).promise
  return viewport
}
