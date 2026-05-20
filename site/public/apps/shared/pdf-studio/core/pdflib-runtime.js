export function getPdfLib() {
  if (!globalThis.PDFLib) {
    throw new Error('pdf-lib runtime is not available on window.PDFLib')
  }
  return globalThis.PDFLib
}

export async function loadPdfLibDocument(arrayBuffer, options = {}) {
  const { PDFDocument, ParseSpeeds } = getPdfLib()
  return PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
    parseSpeed: ParseSpeeds.Fast,
    ...options
  })
}

export async function createPdfDocument() {
  const { PDFDocument } = getPdfLib()
  return PDFDocument.create()
}
