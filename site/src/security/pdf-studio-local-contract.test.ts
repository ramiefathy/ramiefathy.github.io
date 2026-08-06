import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appsRoot = resolve(__dirname, '../../public/apps')
const studioHtml = readFileSync(resolve(appsRoot, 'pdf-studio.html'), 'utf8')
const studioRoot = resolve(appsRoot, 'shared/pdf-studio')
const ocrSource = readFileSync(resolve(studioRoot, 'tools/ocr.js'), 'utf8')
const tesseractCompatibilityAsset = readFileSync(resolve(appsRoot, 'vendor/tesseract/tesseract.min.js'), 'utf8')
const shellSource = readFileSync(resolve(appsRoot, 'shared/legacy-shell.js'), 'utf8')

function listJavaScriptFiles(root: string): string[] {
  const files: string[] = []
  for (const name of readdirSync(root)) {
    const target = resolve(root, name)
    if (statSync(target).isDirectory()) files.push(...listJavaScriptFiles(target))
    else if (name.endsWith('.js')) files.push(target)
  }
  return files
}

describe('PDF Studio local-processing and capability contract', () => {
  it('uses a same-origin CSP and refuses external runtime connectivity', () => {
    expect(studioHtml).toContain('http-equiv="Content-Security-Policy"')
    expect(studioHtml).toContain("default-src 'self'")
    expect(studioHtml).toContain("script-src 'self'")
    expect(studioHtml).toContain("connect-src 'self'")
    expect(studioHtml).toContain("worker-src 'self' blob:")
    expect(studioHtml).toContain("object-src 'none'")
    expect(studioHtml).toContain('name="referrer" content="no-referrer"')

    const offenders: string[] = []
    for (const file of listJavaScriptFiles(studioRoot)) {
      const source = readFileSync(file, 'utf8')
      if (/https?:\/\//i.test(source)) offenders.push(file.replace(appsRoot, ''))
      if (/\bWebSocket\s*\(/.test(source)) offenders.push(`${file.replace(appsRoot, '')}: WebSocket`)
      if (/\bXMLHttpRequest\b/.test(source)) offenders.push(`${file.replace(appsRoot, '')}: XMLHttpRequest`)
    }
    expect(offenders).toEqual([])
  })

  it('does not represent the bundled compatibility asset as a production OCR engine', () => {
    expect(tesseractCompatibilityAsset).toContain("__pdfStudioCapability: 'compatibility-stub-no-ocr'")
    expect(tesseractCompatibilityAsset).toContain('Production OCR engine assets are not installed')
    expect(tesseractCompatibilityAsset).not.toContain('async recognize')

    expect(ocrSource).toContain("const STUB_CAPABILITY = 'compatibility-stub-no-ocr'")
    expect(ocrSource).toContain('isProductionOcrRuntime')
    expect(ocrSource).toContain('throw new Error(reason)')
    expect(ocrSource).toContain('Text-layer extraction mode. No image recognition will occur.')
    expect(ocrSource).toContain('_text_layer_preserved.pdf')
    expect(ocrSource).toContain('_text_layer.txt')
    expect(ocrSource).toContain('does not claim OCR')
  })

  it('makes the local-processing and redaction limits visible', () => {
    expect(studioHtml).toContain('data-shell-kicker="Productivity"')
    expect(shellSource).toContain('PDF processing occurs in this browser')
    expect(shellSource).toContain('Visual masking is not secure redaction')
    expect(studioHtml).not.toMatch(/secure redaction/i)
  })
})
