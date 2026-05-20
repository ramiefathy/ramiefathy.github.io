import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appsRoot = resolve(__dirname, '../../public/apps')
const appsCatalogPath = resolve(__dirname, '../data/apps.json')
const pagesWithShell = [
  'legacy/index.html',
  'MindMaps/CTCL/CTCLMindMaps.html',
  'MindMaps/Psoriasis/PsoriasisMindMaps.html',
  'MindMaps/Alopecia/AlopeciaMindMaps.html',
  'pdf-studio.html',
  'biologic-monitoring-dashboard/index.html',
  'dermatopathology-differentials.html',
  'dermatopathology-modern/index.html',
  'dermatopathology-modern/index-fixed.html',
  'dermatopathology-modern/deduplication-visualization.html',
  'dermatopathology-modern/test-fixes.html',
  'dermatology-scribe/index.html',
  'dermatology-scribe/test-ui-enhancements.html',
  'WoundCareWebpages.html'
]
const pdfStudioPage = 'pdf-studio.html'
const legacyPdfRedirects = [
  { file: 'PDF Merger.html', target: './pdf-studio.html?tool=assemble&legacy=merger' },
  { file: 'PDF Splitter.html', target: './pdf-studio.html?tool=extract&legacy=splitter' },
  { file: 'textExtractor.html', target: './pdf-studio.html?tool=textextract&legacy=extractor' }
]
const validPdfStudioTools = new Set([
  'organizer',
  'extract',
  'image',
  'stamp',
  'assemble',
  'metadata',
  'ocr',
  'compress',
  'textextract'
])

const loadApp = (relativePath: string) =>
  readFileSync(resolve(appsRoot, relativePath), 'utf8')
const loadAppsCatalog = () => JSON.parse(readFileSync(appsCatalogPath, 'utf8'))

describe('legacy apps remediation backlog', () => {
  it('P0: scheduler remains external-only across app surfaces', () => {
    const apps = loadAppsCatalog()
    const rootAppsShowcase = readFileSync(resolve(__dirname, '../../../apps/index.html'), 'utf8')
    const schedulerLanding = readFileSync(resolve(__dirname, '../../../apps/Scheduler.html'), 'utf8')
    const clinisched = apps.find((entry: { slug: string }) => entry.slug === 'scheduler-pro')

    expect(clinisched).toBeDefined()
    expect(clinisched?.href).toBe('https://clinisched.ramiefathy.com/')
    expect(clinisched?.preview).toBeUndefined()
    expect(rootAppsShowcase).toContain('https://clinisched.ramiefathy.com/')
    expect(rootAppsShowcase).not.toContain('/apps/clinic-scheduler-pro/index.html')
    expect(schedulerLanding).toContain('https://clinisched.ramiefathy.com/')
    expect(schedulerLanding).not.toContain('Clinic Scheduler')
  })

  it('P1: legacy app shell assets are wired for all modernized legacy pages', () => {
    for (const filePath of pagesWithShell) {
      const html = loadApp(filePath)
      expect(html).toContain('data-legacy-shell="true"')
      expect(html).toMatch(/legacy-shell\.css/)
      expect(html).toMatch(/legacy-primitives\.css/)
      expect(html).toMatch(/legacy-shell\.js/)
      expect(html).toMatch(/legacy-guidance\.js/)
      expect(html).toContain('legacy-focus-ring')
    }
  })

  it('P1: modernized legacy pages expose parseable in-shell help steps', () => {
    const problems: string[] = []

    for (const filePath of pagesWithShell) {
      const html = loadApp(filePath)
      const match = html.match(/data-help-steps='([^']+)'/)
      if (!match) {
        problems.push(`${filePath} :: missing data-help-steps`)
        continue
      }

      try {
        const parsed = JSON.parse(match[1])
        if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((step) => typeof step !== 'string' || !step.trim())) {
          problems.push(`${filePath} :: invalid data-help-steps JSON`)
        }
      } catch (error) {
        problems.push(`${filePath} :: invalid data-help-steps JSON`)
      }
    }

    expect(problems).toEqual([])
  })

  it('P0: shell-enabled pages using body flex must opt into flex-col', () => {
    const offenders: string[] = []

    for (const filePath of pagesWithShell) {
      const html = loadApp(filePath)
      const bodyTag = html.match(/<body[^>]*>/i)?.[0]
      if (!bodyTag) continue
      const classValue = bodyTag.match(/\bclass\s*=\s*"([^"]*)"/i)?.[1] ?? ''
      const classNames = classValue.split(/\s+/).filter(Boolean)

      if (classNames.includes('flex') && !classNames.includes('flex-col')) {
        offenders.push(`${filePath} :: body has flex without flex-col`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('P1: PDF tools expose standardized workflow hooks', () => {
    const html = loadApp(pdfStudioPage)
    expect(html).toContain('data-workflow="pdf"')
    expect(html).toContain('legacy-workflow__primary')
    expect(html).toContain('legacy-workflow__secondary')
  })

  it('P1: legacy PDF routes redirect to canonical studio deep links', () => {
    for (const redirect of legacyPdfRedirects) {
      const html = loadApp(redirect.file)
      expect(html).toContain(redirect.target)
      expect(html).toContain('window.location.replace')
      expect(html).toContain('meta http-equiv="refresh"')
    }
  })

  it('P1: PDF studio deep links in inventory use valid tool ids', () => {
    const inventory = JSON.parse(readFileSync(resolve(__dirname, '../../../docs/site-test-inventory.md'), 'utf8').match(/```json\s*([\s\S]*?)\s*```/)?.[1] ?? '{}')
    const legacyEntries = Array.isArray(inventory.legacyHtmlApps) ? inventory.legacyHtmlApps : []

    const invalidDeepLinks: string[] = []
    for (const entry of legacyEntries) {
      if (!entry?.redirectTo || typeof entry.redirectTo !== 'string') continue
      if (!entry.redirectTo.includes('pdf-studio.html')) continue
      const url = new URL(`https://example.test${entry.redirectTo}`)
      const tool = url.searchParams.get('tool')
      if (!tool || !validPdfStudioTools.has(tool)) {
        invalidDeepLinks.push(`${entry.route} -> ${entry.redirectTo}`)
      }
    }

    expect(invalidDeepLinks).toEqual([])
  })

  it('P1: legacy apps index does not label scribe as deprecated', () => {
    const legacyAppsIndex = loadApp('legacy/index.html')
    expect(legacyAppsIndex).not.toContain('Deprecated')
  })

  it('P1: scribe styling maps to shared legacy tokens by default', () => {
    const scribeCss = loadApp('dermatology-scribe/style-modern.css')
    expect(scribeCss).toContain('--bg-primary: var(--legacy-bg')
    expect(scribeCss).toContain('.legacy-dark')
    expect(scribeCss).toContain('background: var(--bg-primary)')
    expect(scribeCss).toContain('background: var(--bg-secondary)')
  })

  it('P0: differentials sanitize user-rendered content', () => {
    const differentialsHtml = loadApp('dermatopathology-differentials.html')

    expect(differentialsHtml).toContain('escapeHtml(state.notes[dx.name])')
    expect(differentialsHtml).not.toContain("state.notes[dx.name].replace(/\\n/g, '<br>')")
  })

  it('P0: Gemini/API secrets avoid localStorage persistence', () => {
    const modernDermpath = loadApp('dermatopathology-modern/index-fixed.html')
    const scribeApp = loadApp('dermatology-scribe/app.js')

    expect(modernDermpath).not.toContain("localStorage.getItem('gemini_api_key')")
    expect(modernDermpath).not.toContain("localStorage.setItem('gemini_api_key'")

    expect(scribeApp).toContain('SENSITIVE_STORAGE_KEYS')
    expect(scribeApp).toContain('sessionStorage.setItem(key, cleaned)')
    expect(scribeApp).not.toContain('if (cleaned) localStorage.setItem(key, cleaned)')
  })

  it('P1: all high-risk parsers use guarded JSON parsing helpers', () => {
    const uiEnhancements = loadApp('dermatology-scribe/ui-enhancements.js')
    const ctclMap = loadApp('MindMaps/CTCL/js/app.js')
    const psoriasisMap = loadApp('MindMaps/Psoriasis/js/app.js')
    const alopeciaMap = loadApp('MindMaps/Alopecia/js/app.js')

    expect(uiEnhancements).toContain('safeParseJson')
    expect(ctclMap).toContain('safeParseJson')
    expect(psoriasisMap).toContain('safeParseJson')
    expect(alopeciaMap).toContain('safeParseJson')
  })

  it('P1: mindmap search escapes regex metacharacters', () => {
    const ctclMap = loadApp('MindMaps/CTCL/js/app.js')
    const psoriasisMap = loadApp('MindMaps/Psoriasis/js/app.js')
    const alopeciaMap = loadApp('MindMaps/Alopecia/js/app.js')

    for (const map of [ctclMap, psoriasisMap, alopeciaMap]) {
      expect(map).toContain('escapeRegExp')
      expect(map).toContain('const escapedQuery = escapeRegExp(query);')
      expect(map).toContain("new RegExp(`(${escapedQuery})`, 'gi')")
      expect(map).not.toContain("new RegExp(`(${query})`, 'gi')")
    }
  })

  it('P1: Clinisched is external-only in app catalog', () => {
    const apps = loadAppsCatalog()
    const clinisched = apps.find((entry: { slug: string }) => entry.slug === 'scheduler-pro')
    const legacyScheduler = apps.find((entry: { slug: string }) => entry.slug === 'scheduler-legacy')

    expect(clinisched).toBeDefined()
    expect(clinisched?.href).toBe('https://clinisched.ramiefathy.com/')
    expect(clinisched?.preview).toBeUndefined()
    expect(legacyScheduler).toBeUndefined()
  })

  it('P2: dependency hardening removes remote jsdelivr imports and legacy data URI bundles', () => {
    const differentialsHtml = loadApp('dermatopathology-differentials.html')
    const modernDermpath = loadApp('dermatopathology-modern/index-fixed.html')
    const modernDermpathFixed = loadApp('dermatopathology-modern/index-fixed.html')
    const dedupVisualization = loadApp('dermatopathology-modern/deduplication-visualization.html')
    const pdfStudio = loadApp('pdf-studio.html')
    const woundCare = loadApp('WoundCareWebpages.html')
    const scribeJsPdf = loadApp('dermatology-scribe/vendor/jspdf.umd.min.js')

    expect(differentialsHtml).not.toContain('https://cdn.jsdelivr.net/npm/')
    expect(differentialsHtml).toContain("./vendor/jspdf.umd.min.js")
    expect(differentialsHtml).toContain("./vendor/jspdf.plugin.autotable.min.js")
    expect(differentialsHtml).toContain("./vendor/xlsx")

    for (const html of [modernDermpath, modernDermpathFixed, dedupVisualization, pdfStudio]) {
      expect(html).not.toContain('https://cdn.jsdelivr.net/npm/')
    }

    expect(modernDermpath).toContain('../vendor/framer-motion.min.js')
    expect(modernDermpath).toContain('../vendor/fuse.min.js')
    expect(modernDermpath).toContain('../vendor/d3.min.js')
    expect(modernDermpathFixed).toContain('../vendor/framer-motion.min.js')
    expect(modernDermpathFixed).toContain('../vendor/fuse.min.js')
    expect(modernDermpathFixed).toContain('../vendor/d3.min.js')
    expect(dedupVisualization).toContain('../vendor/chart.umd.min.js')
    expect(pdfStudio).toContain('./vendor/pdf-lib.min.js')
    expect(pdfStudio).toContain('./vendor/pdf.min.js')

    expect(scribeJsPdf).toContain('Version 2.5.2')
    expect(woundCare).not.toContain('data:application/x-javascript;base64')
    expect(woundCare).toContain('WoundCareWebpages.legacy.bundle.js')
    expect(woundCare).not.toContain('https://mathjax.rstudio.com/')
    expect(woundCare).toContain('./vendor/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML')
  })

  it('P2b: legacy HTML apps self-host all script dependencies', () => {
    const legacyHtmlFiles = [
      'MindMaps/CTCL/CTCLMindMaps.html',
      'MindMaps/Psoriasis/PsoriasisMindMaps.html',
      'MindMaps/Alopecia/AlopeciaMindMaps.html',
      'pdf-studio.html',
      'textExtractor.html',
      'PDF Merger.html',
      'PDF Splitter.html',
      'legacy/index.html',
      'dermatopathology-modern/index.html',
      'dermatopathology-modern/index-fixed.html',
      'dermatopathology-modern/deduplication-visualization.html',
      'dermatopathology-modern/test-fixes.html',
      'dermatopathology-differentials.html',
      'dermatology-scribe/test-ui-enhancements.html'
    ]

    for (const filePath of legacyHtmlFiles) {
      const html = loadApp(filePath)
      expect(html).not.toMatch(/<script[^>]+src="https:\/\//)
    }

    const scribeEnhancedStylesheet = loadApp('dermatology-scribe/style-enhanced.css')
    expect(scribeEnhancedStylesheet).toContain("@import './style-modern.css';")
  })

  it('P0: scribe landing declares ui mode gating', () => {
    const scribeLanding = loadApp('dermatology-scribe/index.html')
    expect(scribeLanding).toMatch(/data-ui-mode="landing"/)
  })

  it('P1: all PDF tools use shared file input primitives', () => {
    const html = loadApp(pdfStudioPage)
    expect(html).toContain('id="pdf-studio-primary"')
    expect(html).toMatch(
      /<section[^>]*(?=[^>]*id="pdf-studio-primary")(?=[^>]*class="[^"]*\blegacy-workflow__panel\b[^"]*\blegacy-workflow__primary\b)[^>]*>/
    )
    expect(html).toMatch(
      /<aside[^>]*(?=[^>]*id="pdf-studio-secondary")(?=[^>]*class="[^"]*\blegacy-workflow__panel\b[^"]*\blegacy-workflow__secondary\b)[^>]*>/
    )
  })

  it('P1: archived dermpath prototype route hard-redirects to stabilized', () => {
    const archivedRoute = loadApp('dermatopathology-modern/index.html')
    expect(archivedRoute).toContain('meta http-equiv="refresh"')
    expect(archivedRoute).toContain('window.location.replace')
    expect(archivedRoute).toContain('index-fixed.html')
  })

  it('P1: dedup visualization includes readability layout hooks', () => {
    const dedupPage = loadApp('dermatopathology-modern/deduplication-visualization.html')
    expect(dedupPage).toContain('cl-stat-bar')
    expect(dedupPage).toContain('cl-chart-container')
  })
})
