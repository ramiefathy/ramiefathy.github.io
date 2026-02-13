import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type LegacyHtmlAppInventoryEntry = {
  label: string
  route: string
  file: string
  category: string
  requiresDownloads: boolean
}

export type ExternalAppInventoryEntry = {
  slug: string
  canonicalUrl: string
  surfacesToCheck: string[]
}

export type SiteTestInventory = {
  astroRoutes: string[]
  specialRoutes?: {
    notFound?: string
  }
  mindmapTopics?: {
    sourceDir: string
    routePrefix: string
    derivation?: string
  }
  legacyHtmlApps: LegacyHtmlAppInventoryEntry[]
  externalApps?: ExternalAppInventoryEntry[]
  excludedOnPurpose?: string[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const inventoryPath = path.resolve(repoRoot, 'docs/site-test-inventory.md')

function extractFirstJsonCodeBlock(markdown: string): string {
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/m)
  if (!match) {
    throw new Error(`Unable to find a \`\`\`json code block in ${inventoryPath}`)
  }
  return match[1]
}

function assertStringArray(name: string, value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`Inventory field "${name}" must be a string[]`)
  }
}

function assertLegacyApps(value: unknown): asserts value is LegacyHtmlAppInventoryEntry[] {
  if (!Array.isArray(value)) {
    throw new Error('Inventory field "legacyHtmlApps" must be an array')
  }
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Inventory legacyHtmlApps entries must be objects')
    }
    const candidate = entry as Partial<LegacyHtmlAppInventoryEntry>
    const requiredStringFields: Array<keyof LegacyHtmlAppInventoryEntry> = ['label', 'route', 'file', 'category']
    for (const key of requiredStringFields) {
      if (typeof candidate[key] !== 'string' || candidate[key]?.trim().length === 0) {
        throw new Error(`Inventory legacyHtmlApps entry is missing string field "${key}"`)
      }
    }
    if (typeof candidate.requiresDownloads !== 'boolean') {
      throw new Error('Inventory legacyHtmlApps entry is missing boolean field "requiresDownloads"')
    }
  }
}

export function loadSiteTestInventory(): SiteTestInventory {
  const markdown = fs.readFileSync(inventoryPath, 'utf8')
  const json = extractFirstJsonCodeBlock(markdown)
  const parsed = JSON.parse(json) as Partial<SiteTestInventory>

  assertStringArray('astroRoutes', parsed.astroRoutes)
  assertLegacyApps(parsed.legacyHtmlApps)

  return parsed as SiteTestInventory
}

export function getAstroRoutes(): string[] {
  return loadSiteTestInventory().astroRoutes
}

export function getNotFoundRoute(): string {
  const inventory = loadSiteTestInventory()
  return inventory.specialRoutes?.notFound || '/404'
}

export function getLegacyHtmlApps(): LegacyHtmlAppInventoryEntry[] {
  return loadSiteTestInventory().legacyHtmlApps
}

export function getLegacyHtmlAppRoutes(): string[] {
  return getLegacyHtmlApps().map((entry) => entry.route)
}
