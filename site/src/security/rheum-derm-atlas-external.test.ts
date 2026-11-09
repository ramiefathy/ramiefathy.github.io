import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The Rheum–Derm Immune Atlas lives in the private ramiefathy/rheum-derm-atlas repo and is served by
 * Cloudflare Pages at rheumderm.ramiefathy.com. This site keeps only a catalog entry and a redirect stub;
 * the app's code must not reappear here.
 */
const repoRoot = path.resolve(process.cwd(), '..')
const CANONICAL = 'https://rheumderm.ramiefathy.com/'
const stubDir = path.join(repoRoot, 'site/public/apps/rheum-derm-immune-atlas')

describe('Rheum–Derm Immune Atlas is external', () => {
  it('the legacy path is a redirect stub only, with no app code', () => {
    expect(fs.readdirSync(stubDir)).toEqual(['index.html'])
    const html = fs.readFileSync(path.join(stubDir, 'index.html'), 'utf8')
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${CANONICAL}">`)
    expect(html).toContain(`<link rel="canonical" href="${CANONICAL}">`)
    expect(html).toContain(`window.location.replace('${CANONICAL}' + window.location.search + window.location.hash)`)
    expect(html).toContain('<meta name="robots" content="noindex">')
    expect(html.length).toBeLessThan(2000)
  })

  it('the catalog entry points to the subdomain', () => {
    const apps = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/src/data/apps.json'), 'utf8')) as Array<{ slug: string; href: string; preview?: string }>
    const entry = apps.find((app) => app.slug === 'rheum-derm-immune-atlas')
    expect(entry?.href).toBe(CANONICAL)
    expect(entry?.preview).toBe(CANONICAL)
  })

  it('no other site file still links the in-site copy', () => {
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, name.name)
        if (name.isDirectory()) { if (!['node_modules', 'dist', '.astro'].includes(name.name)) walk(full); continue }
        if (!/\.(astro|jsx?|tsx?|json|html|md)$/.test(name.name) || full.startsWith(stubDir) || full.endsWith('rheum-derm-atlas-external.test.ts')) continue
        if (fs.readFileSync(full, 'utf8').includes('/apps/rheum-derm-immune-atlas/explorer/')) hits.push(path.relative(repoRoot, full))
      }
    }
    walk(path.join(repoRoot, 'site/src'))
    walk(path.join(repoRoot, 'site/public'))
    expect(hits).toEqual([])
  }, 30_000)
})
