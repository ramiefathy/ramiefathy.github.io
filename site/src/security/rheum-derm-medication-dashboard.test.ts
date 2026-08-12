import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dashboardPath = resolve(
  __dirname,
  '../data/rheum-derm-medication-dashboard/index.html'
)
const catalogPath = resolve(__dirname, '../data/apps.json')

describe('Rheum–Derm Therapeutics Field Guide publication contract', () => {
  const html = readFileSync(dashboardPath, 'utf8')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Array<{
    slug: string
    href: string
    preview?: string
    status: string
    listed?: boolean
  }>

  it('publishes the audited teaching artifact with its evidence boundary', () => {
    expect(html).toContain('<title>Rheum–Derm Therapeutics Field Guide</title>')
    expect(html).toContain('Conditions')
    expect(html).toContain('Drug index')
    expect(html).toContain('linked sources and regulatory-status boundaries remain visible')
    expect(html).toContain('Not clinical decision support or a complete interaction engine.')
    expect(html).toContain('Representative regimens only; current labels and primary sources control.')
    expect(html).toContain('role=toolbar aria-label="Page tools"')
  })

  it('is cataloged at its canonical public route', () => {
    const entry = catalog.find(item => item.slug === 'rheum-derm-medication-dashboard')
    expect(entry).toMatchObject({
      href: '/apps/rheum-derm-medication-dashboard/',
      preview: '/apps/rheum-derm-medication-dashboard/',
      status: 'active'
    })
    expect(entry?.listed).not.toBe(false)
  })

  it('remains self-contained and avoids prohibited presentation dependencies', () => {
    expect(html).not.toMatch(/<(?:script|img|iframe|audio|video|source|embed)[^>]+src=["'](?:https?:)?\/\//i)
    expect(html).not.toMatch(/<(?:link)[^>]+href=["'](?:https?:)?\/\//i)
    expect(html).not.toMatch(/<(?:object)[^>]+data=["'](?:https?:)?\/\//i)
    expect(html).not.toMatch(/@import\s+(?:url\()?\s*["']?(?:https?:)?\/\//i)
    expect(html).not.toMatch(/url\(\s*["']?(?:https?:)?\/\//i)
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/i)
    expect(html).not.toContain('backdrop-filter')
  })
})
