import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const route = '/teaching/craniopharyngioma-7e9c4b2a/'
const file = path.resolve('public', route.slice(1), 'index.html')

describe('Unlisted craniopharyngioma teaching figure', () => {
  it('retains crawler opt-out in the directly served document and headers', () => {
    const html = fs.readFileSync(file, 'utf8')
    expect(html).toContain('<meta name="robots" content="noindex, nofollow, noarchive">')
    expect(html).not.toContain('__bundler')
    expect(fs.readFileSync('public/_headers', 'utf8')).toContain(`${route}*\n  X-Robots-Tag: noindex, nofollow, noarchive`)
  })

  it('uses embedded fonts and no external runtime resources', () => {
    const html = fs.readFileSync(file, 'utf8')
    expect(new Set(html.match(/data:font\/woff2;base64,[A-Za-z0-9+/=]+/g)).size).toBe(12)
    expect(html).not.toMatch(/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/)
    expect(html).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/)
  })

  it('distinguishes combination approval and schematic effects from clinical outcomes', () => {
    const html = fs.readFileSync(file, 'utf8')
    expect(html).toContain('FDA-approved in combination, tumor-agnostic*')
    expect(html).toContain('do not predict response, dose, or clinical efficacy')
    expect(html).not.toContain('most-used')
    expect(html).not.toContain('so it works whichever exon 3 residue is mutated')
  })
})
