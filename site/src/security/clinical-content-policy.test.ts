import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const siteRoot = resolve(__dirname, '../..')
const roots = [resolve(siteRoot, 'src/data/mindmaps'), resolve(siteRoot, 'public/apps/MindMaps')]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(json|js|html)$/.test(entry)) out.push(full)
  }
  return out
}
const files = roots.flatMap(root => walk(root))
const label = (file: string) => relative(siteRoot, file)

// Audit-process language belongs in the correction ledger, never in user-facing clinical text.
const auditProcessPhrases = [
  'not established by the sources supplied here',
  'has been removed',
  'was not supported by the cited guideline and is not retained',
  'was not supported by the cited source',
  'Verify current labels rather than a 2013',
  '(source summary)',
  'bibliographic reference, not a verbatim quotation',
  'the listed sources do not justify',
  'is not validated here',
]

describe('Clinical content policy', () => {
  it('does not present mogamulizumab as a first-line or unrestricted therapy', () => {
    const offenders = files.filter(file => /ctcl/i.test(file)).filter(file => {
      const text = readFileSync(file, 'utf8')
      return /mogamulizumab \(FDA-approved first-line\)/i.test(text) || /FDA-approved first-line/i.test(text)
    })
    expect(offenders.map(label)).toEqual([])
  })

  it('contains no audit-process language in user-facing mind map text', () => {
    const offenders: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const phrase of auditProcessPhrases) if (text.includes(phrase)) offenders.push(`${label(file)} :: ${phrase}`)
    }
    expect(offenders).toEqual([])
  })

  it('contains no orphaned numeric citation markers in mind map data', () => {
    const offenders: string[] = []
    for (const file of files.filter(f => f.startsWith(roots[0]))) {
      const text = readFileSync(file, 'utf8')
      const matches = text.match(/\\\\\[\d[^\]]*\\\\\]/g) || []
      if (matches.length) offenders.push(`${label(file)} :: ${matches.length} marker(s)`)
    }
    expect(offenders).toEqual([])
  })

  it('defines each CTCL legacy tooltip text exactly once', () => {
    const text = readFileSync(resolve(siteRoot, 'public/apps/MindMaps/CTCL/js/data.js'), 'utf8')
    const contents = [...text.matchAll(/"content": "((?:[^"\\]|\\.)*)"/g)].map(m => m[1])
      .concat([...text.matchAll(/content: '((?:[^'\\]|\\.)*)'/g)].map(m => m[1]))
    const seen = new Map<string, number>()
    for (const content of contents) seen.set(content, (seen.get(content) || 0) + 1)
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([content, count]) => `${count}x ${content.slice(0, 60)}`)
    expect(duplicates).toEqual([])
  })
})
