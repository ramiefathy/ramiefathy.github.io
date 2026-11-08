import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Unlisted, password-protected PsO–PsA therapy compendium.
 *
 * `index.html` and `sw.js` in this folder are published by the private ramiefathy/psopsa-algo workflow, which
 * encrypts the page (PBKDF2-SHA256 → AES-256-GCM) and verifies the round trip before committing here. Do not edit
 * them by hand. Until the first publish the folder holds a placeholder.
 *
 * These checks guard the public side: only ciphertext is ever served, the page opts out of indexing, it makes no
 * third-party requests, and nothing else (above all the readable standalone file) can be dropped into the folder.
 */
const ROUTE = '/tools/rx-88b7pf8328/'
const DIR = path.resolve('public', ROUTE.slice(1))
const PAGE = path.join(DIR, 'index.html')
const SW = path.join(DIR, 'sw.js')

// Terms present throughout the readable compendium and never in the unlock screen or the placeholder.
const LEAK_TERMS = ['Adalimumab', 'Bimekizumab', 'Risankizumab', 'Upadacitinib', 'Secukinumab', 'PASI90', 'ACR50',
  'Methotrexate', 'boxed warning']

type Payload = { v: number; kdf: string; iterations: number; salt: string; iv: string; ct: string }

function readPayload(html: string): Payload | null {
  const m = html.match(/<script id="payload" type="application\/json">([\s\S]*?)<\/script>/)
  return m ? (JSON.parse(m[1]) as Payload) : null
}

describe('Unlisted PsO–PsA compendium (encrypted)', () => {
  const html = fs.readFileSync(PAGE, 'utf8')

  it('ships only the encrypted page and its offline worker', () => {
    const files = fs.readdirSync(DIR).sort()
    const allowed = new Set(['index.html', 'sw.js'])
    expect(files.filter((f) => !allowed.has(f)), 'unexpected file in the protected folder').toEqual([])
    expect(files).toContain('index.html')
  })

  it('opts out of indexing in the document and in the headers file', () => {
    expect(html).toContain('<meta name="robots" content="noindex, nofollow, noarchive">')
    const headers = fs.readFileSync('public/_headers', 'utf8')
    expect(headers).toContain(`${ROUTE}*\n  X-Robots-Tag: noindex, nofollow, noarchive`)
  })

  it('contains no readable clinical text', () => {
    const lower = html.toLowerCase()
    expect(LEAK_TERMS.filter((t) => lower.includes(t.toLowerCase()))).toEqual([])
  })

  it('makes no third-party requests (no font CDN, no remote scripts or styles)', () => {
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/i)
    expect(html).not.toMatch(/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i)
  })

  it('is either the placeholder or a well-formed AES-GCM payload', () => {
    const payload = readPayload(html)
    if (!payload) {
      expect(html).toContain('data-psopsa-placeholder')
      return
    }
    expect(payload.v).toBe(1)
    expect(payload.kdf).toBe('PBKDF2-SHA256')
    expect(payload.iterations).toBeGreaterThanOrEqual(600000)
    expect(Buffer.from(payload.salt, 'base64')).toHaveLength(16)
    expect(Buffer.from(payload.iv, 'base64')).toHaveLength(12)
    expect(Buffer.from(payload.ct, 'base64').length).toBeGreaterThan(100_000)
  })

  it('keeps the offline worker confined to its own page and caches', () => {
    if (!fs.existsSync(SW)) return
    const sw = fs.readFileSync(SW, 'utf8')
    expect(sw).toContain('const PREFIX = "pso-compendium-"')
    expect(sw).toMatch(/k\.startsWith\(PREFIX\)/)
    expect(sw).not.toMatch(/fonts\.g/)
  })
})
