import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type Inventory = {
  astroRoutes: string[]
  specialRoutes?: { notFound?: string }
  mindmapTopics?: { sourceDir: string; routePrefix: string }
  legacyHtmlApps: Array<{
    label: string
    route: string
    file: string
    category: string
    requiresDownloads: boolean
  }>
  externalApps?: Array<{
    slug: string
    canonicalUrl: string
    surfacesToCheck: string[]
  }>
}

function loadInventoryFromDocs(repoRoot: string): Inventory {
  const inventoryPath = path.resolve(repoRoot, 'docs/site-test-inventory.md')
  const markdown = fs.readFileSync(inventoryPath, 'utf8')
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/m)
  if (!match) {
    throw new Error(`No \`\`\`json code block found in ${inventoryPath}`)
  }
  return JSON.parse(match[1]) as Inventory
}

function assertNoVendorPaths(filePaths: string[]): void {
  const vendorMatches = filePaths.filter((entry) => entry.includes('site/public/apps/vendor/'))
  expect(vendorMatches, 'Inventory must not include vendor test/demo pages').toEqual([])
}

describe('Site/app canonical inventory (docs/site-test-inventory.md)', () => {
  it('is parseable and has the required top-level keys', () => {
    const repoRoot = path.resolve(process.cwd(), '..')
    const inventory = loadInventoryFromDocs(repoRoot)

    expect(Array.isArray(inventory.astroRoutes)).toBe(true)
    expect(inventory.astroRoutes.length).toBeGreaterThan(0)

    expect(Array.isArray(inventory.legacyHtmlApps)).toBe(true)
    expect(inventory.legacyHtmlApps.length).toBeGreaterThan(0)
  })

  it('lists only shipped legacy HTML pages and excludes vendor pages', () => {
    const repoRoot = path.resolve(process.cwd(), '..')
    const inventory = loadInventoryFromDocs(repoRoot)

    const files = inventory.legacyHtmlApps.map((entry) => entry.file)
    assertNoVendorPaths(files)

    for (const entry of inventory.legacyHtmlApps) {
      expect(entry.label.trim().length, 'legacyHtmlApps entries must have a label').toBeGreaterThan(0)
      expect(entry.route.startsWith('/apps/'), `legacyHtmlApps route must start with /apps/: ${entry.route}`).toBe(true)
      expect(entry.file.startsWith('site/public/apps/'), `legacyHtmlApps file must be under site/public/apps/: ${entry.file}`).toBe(true)

      const abs = path.resolve(repoRoot, entry.file)
      expect(fs.existsSync(abs), `Missing legacyHtmlApps file on disk: ${entry.file}`).toBe(true)
    }
  })
})
