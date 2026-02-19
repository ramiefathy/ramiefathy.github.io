import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const APPS_ROOT = path.resolve(process.cwd(), 'public', 'apps')
const SHARED_ROOT = path.join(APPS_ROOT, 'shared')
const INVENTORY_PATH = path.resolve(process.cwd(), '../docs/site-test-inventory.md')
const REPO_ROOT = path.resolve(process.cwd(), '..')

type WalkOptions = {
  excludeDirs: string[]
  excludeFilePatterns: RegExp[]
  includeExtensions: Set<string>
}

type InventoryApp = {
  file: string
  route: string
  label: string
}

type Inventory = {
  legacyHtmlApps: InventoryApp[]
}

function resolveRepoPath(inventoryPath: string): string {
  if (path.isAbsolute(inventoryPath)) return inventoryPath
  if (inventoryPath.startsWith('site/')) {
    return path.resolve(REPO_ROOT, inventoryPath)
  }
  return path.resolve(process.cwd(), inventoryPath)
}

function walkFiles(rootDir: string, options: WalkOptions): string[] {
  const results: string[] = []
  const stack: string[] = [rootDir]

  while (stack.length > 0) {
    const currentDir = stack.pop()
    if (!currentDir) continue

    const rel = path.relative(rootDir, currentDir)
    const firstSegment = rel.split(path.sep)[0]
    if (firstSegment && options.excludeDirs.includes(firstSegment)) continue

    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }

      const ext = path.extname(entry.name).toLowerCase()
      if (!options.includeExtensions.has(ext)) continue
      if (options.excludeFilePatterns.some((pattern) => pattern.test(entry.name))) continue
      results.push(fullPath)
    }
  }

  return results
}

function getHtmlMetaTags(html: string): string[] {
  return html.match(/<meta\b[^>]*>/gi) ?? []
}

function hasMetaDescription(html: string): boolean {
  for (const tag of getHtmlMetaTags(html)) {
    if (!/\bname\s*=\s*["']description["']/i.test(tag)) continue
    if (!/\bcontent\s*=\s*["'][^"']+["']/i.test(tag)) return false
    return true
  }

  return false
}

function parseInventory(): Inventory {
  const markdown = fs.readFileSync(INVENTORY_PATH, 'utf-8')
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/)
  if (!match) {
    throw new Error(`Unable to parse inventory JSON block at ${INVENTORY_PATH}`)
  }
  return JSON.parse(match[1]) as Inventory
}

function findBannedHexColors(content: string): string[] {
  const bannedHexes = ['#6366F1', '#4F46E5', '#8B5CF6', '#7C3AED', '#A855F7']
  const matches: string[] = []

  for (const hex of bannedHexes) {
    const re = new RegExp(hex.replace('#', '\\#'), 'i')
    if (re.test(content)) matches.push(hex)
  }

  return matches
}

function hexToHue(hex: string): number {
  const normalized = hex.replace('#', '').trim()
  const chunk = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized

  if (chunk.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  const red = parseInt(chunk.slice(0, 2), 16) / 255
  const green = parseInt(chunk.slice(2, 4), 16) / 255
  const blue = parseInt(chunk.slice(4, 6), 16) / 255

  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  if (delta === 0) return 0

  let hue = 0
  if (max === red) hue = ((green - blue) / delta) % 6
  else if (max === green) hue = (blue - red) / delta + 2
  else hue = (red - green) / delta + 4

  const computed = Math.round(hue * 60)
  return computed < 0 ? computed + 360 : computed
}

describe('Frontend Design System Contract (legacy apps)', () => {
  it('legacy shared tokens define required semantic variables', () => {
    const tokensPath = path.join(SHARED_ROOT, 'legacy-tokens.css')
    const css = fs.readFileSync(tokensPath, 'utf-8')

    for (const required of ['--primary', '--accent', '--background', '--foreground', '--muted']) {
      expect(css).toContain(`${required}:`)
    }

    for (const requiredFont of ['--font-heading', '--font-body']) {
      expect(css).toContain(`${requiredFont}:`)
    }

    for (const requiredClinical of ['--cl-primary', '--cl-accent', '--cl-surface', '--cl-text', '--cl-border']) {
      expect(css).toContain(`${requiredClinical}:`)
    }

    expect(css).toContain("@import url('./legacy-fonts.css');")
  })

  it('legacy primary hue stays in teal family (160-185)', () => {
    const tokensPath = path.join(SHARED_ROOT, 'legacy-tokens.css')
    const css = fs.readFileSync(tokensPath, 'utf-8')
    const match = css.match(/--cl-primary:\s*(#[0-9a-fA-F]{6})/)?.[1]

    expect(match).toBeDefined()
    const hue = hexToHue(match as string)
    expect(hue).toBeGreaterThanOrEqual(160)
    expect(hue).toBeLessThanOrEqual(185)
  })

  it('legacy apps avoid banned vibecoded tokens and patterns', () => {
    const files = walkFiles(APPS_ROOT, {
      excludeDirs: ['vendor'],
      excludeFilePatterns: [/\.min\.js$/i],
      includeExtensions: new Set(['.html', '.css', '.js'])
    })

    const bannedRegexes: Array<{ label: string; re: RegExp }> = [
      { label: 'Inter font', re: /\bInter\b/ },
      { label: 'Tailwind transition-all', re: /\btransition-all\b/ },
      { label: 'Tailwind hover scale', re: /\bhover:scale-/ },
      { label: 'Dead hash links', re: /href="#"/ },
      { label: 'Purple/violet/indigo utility', re: /\b(?:bg|text|ring|from|to)-(?:purple|violet|indigo)-\d{2,3}\b/ }
    ]

    const violations: string[] = []

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8')
      for (const banned of bannedRegexes) {
        if (banned.re.test(content)) {
          violations.push(`${path.relative(APPS_ROOT, filePath)} :: ${banned.label}`)
          break
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('legacy apps do not contain banned indigo/violet/purple hex colors in non-vendor code', () => {
    const files = walkFiles(APPS_ROOT, {
      excludeDirs: ['vendor'],
      excludeFilePatterns: [/\.min\.js$/i],
      includeExtensions: new Set(['.html', '.css', '.js'])
    })

    const offenders: string[] = []

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const banned = findBannedHexColors(content)
      if (banned.length) {
        offenders.push(`${path.relative(APPS_ROOT, filePath)} :: ${banned.join(', ')}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('legacy HTML apps include a meta description', () => {
    const htmlFiles = walkFiles(APPS_ROOT, {
      excludeDirs: ['vendor'],
      excludeFilePatterns: [],
      includeExtensions: new Set(['.html'])
    })

    const missingMetaDescription = htmlFiles
      .filter((filePath) => !hasMetaDescription(fs.readFileSync(filePath, 'utf-8')))
      .map((filePath) => path.relative(APPS_ROOT, filePath))

    expect(missingMetaDescription).toEqual([])
  })

  it('all apps HTML remove remote Google Fonts endpoints', () => {
    const htmlFiles = walkFiles(APPS_ROOT, {
      excludeDirs: ['vendor'],
      excludeFilePatterns: [],
      includeExtensions: new Set(['.html'])
    })

    const offenders = htmlFiles
      .filter((filePath) => {
        const html = fs.readFileSync(filePath, 'utf-8')
        return /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html)
      })
      .map((filePath) => path.relative(APPS_ROOT, filePath))

    expect(offenders).toEqual([])
  })

  it('inventory user-facing pages do not load remote runtime scripts', () => {
    const inventory = parseInventory()
    const offenders: string[] = []

    for (const app of inventory.legacyHtmlApps) {
      const html = fs.readFileSync(resolveRepoPath(app.file), 'utf-8')
      if (/<script[^>]+src=["']https?:\/\//i.test(html)) {
        offenders.push(`${app.file} (${app.route})`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('user-facing styles avoid backdrop-filter and emoji characters', () => {
    const files = walkFiles(APPS_ROOT, {
      excludeDirs: ['vendor'],
      excludeFilePatterns: [/\.min\.js$/i],
      includeExtensions: new Set(['.html', '.css'])
    })

    const emojiPattern = /[\u{1F300}-\u{1FAFF}\u2600-\u26FF\u2700-\u27BF]/u
    const offenders: string[] = []

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (/backdrop-filter/i.test(content)) {
        offenders.push(`${path.relative(APPS_ROOT, filePath)} :: backdrop-filter`)
        continue
      }

      if (emojiPattern.test(content)) {
        offenders.push(`${path.relative(APPS_ROOT, filePath)} :: emoji glyph`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('text extractor no longer references remote pdf worker', () => {
    const extractorPath = path.join(APPS_ROOT, 'textExtractor.html')
    const html = fs.readFileSync(extractorPath, 'utf-8')

    expect(html).not.toMatch(/GlobalWorkerOptions\.workerSrc\s*=\s*["']https?:\/\//)
  })

  it('base body text size floor is at least 14px', () => {
    const primitivesPath = path.join(SHARED_ROOT, 'legacy-primitives.css')
    const css = fs.readFileSync(primitivesPath, 'utf-8')
    const match = css.match(/body\[data-legacy-shell='true'\]\s*\{[\s\S]*?font-size:\s*([0-9.]+)rem/)

    expect(match).toBeTruthy()
    const remValue = Number(match?.[1] || 0)
    expect(remValue).toBeGreaterThanOrEqual(0.875)
  })

  it('modern dermpath stabilized view removes legacy SaaS subtitle and hides gamification signals', () => {
    const fixedPath = path.join(APPS_ROOT, 'dermatopathology-modern', 'index-fixed.html')
    const fixedHtml = fs.readFileSync(fixedPath, 'utf-8')
    const clinicalCss = fs.readFileSync(path.join(APPS_ROOT, 'dermatopathology-modern', 'clinical-reference.css'), 'utf-8')

    expect(fixedHtml).not.toContain('Modern Learning Experience')
    expect(fixedHtml).toContain('Clinical Dermatopathology Reference')
    expect(fixedHtml).not.toContain('AI Insights')
    expect(fixedHtml).toContain('Clinical Correlations')
    expect(fixedHtml).not.toContain('Icon name="sparkles"')
    expect(fixedHtml).not.toContain('bg-cyan-700 text-white')
    expect(clinicalCss).toMatch(/\.achievement-badge[^{]*\{[^}]*display:\s*none/i)
    expect(clinicalCss).toMatch(/\.streak-badge[^{]*\{[^}]*display:\s*none/i)
    expect(clinicalCss).toMatch(/\.glass[^\{]*\{[\s\S]*background:\s*var\(--cl-surface\)/i)
  })
})
