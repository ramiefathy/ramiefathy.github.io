import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Site-side Atlas design contract.
 *
 * Mirrors `frontend-design-contract.test.ts` (which guards `site/public/apps/**`)
 * but scoped to the Astro source: `site/src/components/**` and `site/src/pages/**`.
 *
 * Catches regressions where a future component or page reintroduces the pre-Atlas
 * navy/cyan/teal palette, the old Playfair/IBM Plex fonts, an emoji glyph, or a
 * banned vibecoded pattern.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SITE_ROOT = path.resolve(__dirname, '../..')

const COMPONENTS_ROOT = path.resolve(SITE_ROOT, 'src', 'components')
const PAGES_ROOT = path.resolve(SITE_ROOT, 'src', 'pages')
const STYLES_ROOT = path.resolve(SITE_ROOT, 'src', 'styles')
const LAYOUTS_ROOT = path.resolve(SITE_ROOT, 'src', 'layouts')
const APPS_ROOT = path.resolve(SITE_ROOT, 'src', 'apps')

const ATLAS_INCLUDE_EXT = new Set(['.astro', '.jsx', '.tsx', '.ts', '.js', '.css', '.html'])

function walk(root: string): string[] {
  const out: string[] = []
  const stack: string[] = [root]
  while (stack.length) {
    const dir = stack.pop()!
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      if (!ATLAS_INCLUDE_EXT.has(path.extname(entry.name))) continue
      out.push(full)
    }
  }
  return out
}

const SITE_FILES = [
  ...walk(COMPONENTS_ROOT),
  ...walk(PAGES_ROOT),
  ...walk(STYLES_ROOT),
  ...walk(LAYOUTS_ROOT),
  ...walk(APPS_ROOT),
]

describe('Atlas Site Design Contract (Astro src)', () => {
  it('no banned palette hexes appear in src/components, src/pages, src/styles, or src/layouts', () => {
    // Pre-Atlas navy/cyan/teal/blue/purple/violet/indigo families that should never
    // re-appear in the Atlas codebase.
    const banned: Array<{ label: string; re: RegExp }> = [
      { label: 'old teal primary', re: /#0f766e\b/i },
      { label: 'old cyan accent', re: /#0ea5e9\b/i },
      { label: 'old cyan-400', re: /#06b6d4\b/i },
      { label: 'old cyan-300', re: /#22d3ee\b/i },
      { label: 'old cyan-200', re: /#67e8f9\b/i },
      { label: 'old navy bg', re: /#041020\b/i },
      { label: 'old navy', re: /#0b2750\b/i },
      { label: 'old navy', re: /#123d78\b/i },
      { label: 'old blue accent', re: /#1c5aa2\b/i },
      { label: 'old icy bg', re: /#f4fbff\b/i },
      { label: 'old teal-50 wash', re: /#f0fdfa\b/i },
      { label: 'indigo-500', re: /#6366[Ff]1\b/ },
      { label: 'indigo-600', re: /#4[Ff]46[Ee]5\b/ },
      { label: 'violet-500', re: /#8[Bb]5[Cc][Ff]6\b/ },
      { label: 'violet-600', re: /#7[Cc]3[Aa][Ee]6\b/ },
      { label: 'purple-500', re: /#[Aa]855[Ff]7\b/ },
    ]

    const offenders: Array<{ file: string; hex: string }> = []
    for (const file of SITE_FILES) {
      const rel = path.relative(SITE_ROOT, file)
      // global.css legitimately documents its tokens — exempt the token block
      // by skipping lines matching `--ink: ` / token assignments.
      const content = fs.readFileSync(file, 'utf-8')
      for (const { re } of banned) {
        const match = content.match(re)
        if (match) offenders.push({ file: rel, hex: match[0] })
      }
    }

    expect(offenders).toEqual([])
  })

  it('no banned font families in src/components, pages, styles, layouts', () => {
    // Banned: AI-default sans + the now-legacy Playfair/IBM Plex pair.
    // Allowed exemption: `src/styles/global.css` references Bricolage/Newsreader/Space Mono
    // and `legacy-fonts.css` (in /apps/shared/) still has Playfair etc. but that's
    // outside this test's scope.
    const bannedFonts: Array<{ label: string; re: RegExp }> = [
      { label: 'Inter', re: /['"]Inter['"]/ },
      { label: 'Poppins', re: /['"]Poppins['"]/ },
      { label: 'Roboto', re: /['"]Roboto['"]/ },
      { label: 'Montserrat', re: /['"]Montserrat['"]/ },
      { label: 'DM Sans', re: /['"]DM Sans['"]/ },
      { label: 'Geist Sans', re: /['"]Geist Sans['"]/ },
      // Atlas migration replaced these — should not be reintroduced in the Astro src.
      { label: 'Playfair Display (legacy)', re: /['"]Playfair Display['"]/ },
      { label: 'IBM Plex Sans (legacy)', re: /['"]IBM Plex Sans['"]/ },
    ]

    const offenders: Array<{ file: string; font: string }> = []
    for (const file of SITE_FILES) {
      const rel = path.relative(SITE_ROOT, file)
      const content = fs.readFileSync(file, 'utf-8')
      for (const { label, re } of bannedFonts) {
        if (re.test(content)) offenders.push({ file: rel, font: label })
      }
    }

    expect(offenders).toEqual([])
  })

  it('no Google Fonts CDN references in src — fonts are self-hosted via legacy-fonts.css', () => {
    const offenders: string[] = []
    for (const file of SITE_FILES) {
      const rel = path.relative(SITE_ROOT, file)
      const content = fs.readFileSync(file, 'utf-8')
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(content)) {
        offenders.push(rel)
      }
    }
    expect(offenders).toEqual([])
  })

  it('no emoji glyphs in src components/pages (excluding .md and inline content quotes)', () => {
    // Atlas uses Material Symbols glyphs or text labels — not emoji.
    // Common offenders: ✨ ☀ ☾ 🚀 💡 🎉 🔥 ⚡ 📚 📖 🏥 ⭐ ★ ❤
    // Note: this is a softer check — only flag if emoji appears in markup attributes
    // (className, label, aria-label) or as direct text content of a UI element.
    const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}]/u

    const offenders: Array<{ file: string; sample: string }> = []
    for (const file of SITE_FILES) {
      const rel = path.relative(SITE_ROOT, file)
      // Skip data files (publications.js, blog.json) — content can quote articles
      if (rel.includes('data')) continue
      const content = fs.readFileSync(file, 'utf-8')
      const match = content.match(emojiRe)
      if (match) {
        const idx = content.indexOf(match[0])
        offenders.push({ file: rel, sample: content.slice(Math.max(0, idx - 20), idx + 20) })
      }
    }

    expect(offenders).toEqual([])
  })

  it('Atlas type primitives are referenced across the Astro pages', () => {
    // Sanity check that templates use the Atlas type system (kicker / display1 /
    // display2 / lede). At least 4 pages should reference these.
    const referencingPages = new Set<string>()
    for (const file of walk(PAGES_ROOT)) {
      const content = fs.readFileSync(file, 'utf-8')
      if (/\b(class|className)=["'`][^"'`]*\b(kicker|display1|display2|lede|plate-stamp|plate-head)\b/.test(content)) {
        referencingPages.add(path.relative(PAGES_ROOT, file))
      }
    }

    expect(referencingPages.size).toBeGreaterThanOrEqual(4)
  })

  it('Atlas color tokens are defined in src/styles/global.css', () => {
    const css = fs.readFileSync(path.join(STYLES_ROOT, 'global.css'), 'utf-8')
    for (const required of ['--bone:', '--ink:', '--terracotta:', '--slate:', '--moss:', '--gold:']) {
      expect(css).toContain(required)
    }
    expect(css).toMatch(/--bone:\s*#f4f0e8\b/i)
    expect(css).toMatch(/--terracotta:\s*#c2674a\b/i)
    expect(css).toMatch(/--ink:\s*#0a0a0a\b/i)
  })

  it('Atlas font families resolve to Bricolage / Newsreader / Space Mono', () => {
    const css = fs.readFileSync(path.join(STYLES_ROOT, 'global.css'), 'utf-8')
    expect(css).toMatch(/--font-display:\s*['"]Bricolage Grotesque['"]/i)
    expect(css).toMatch(/--font-(emphasis|body):\s*['"]Newsreader['"]/i)
    expect(css).toMatch(/--font-mono:\s*['"]Space Mono['"]/i)
  })

  it('dark-mode override blocks have been removed from global.css', () => {
    const css = fs.readFileSync(path.join(STYLES_ROOT, 'global.css'), 'utf-8')
    // `html[data-theme='dark']` blocks were Atlas-removed (light-only).
    expect(css).not.toMatch(/html\[data-theme=['"]dark['"]\]/)
    expect(css).not.toMatch(/\[data-theme=['"]dark['"]\]/)
  })
})
