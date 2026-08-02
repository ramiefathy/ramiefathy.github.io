import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Site-side Field Console design contract.
 *
 * Mirrors `frontend-design-contract.test.ts` (which guards `site/public/apps/**`)
 * but scoped to the Astro source: `site/src/components/**`, `src/pages/**`,
 * `src/styles/**`, `src/layouts/**`.
 *
 * This file previously encoded the light "atlas" palette (bone/terracotta,
 * Bricolage/Newsreader) and the plate-stamp primitives. That theme was retired;
 * the contract below guards the replacement:
 *
 *   - a dark ground (#0b0e13) with a SINGLE coral accent (#ff6b4a)
 *   - Fraunces (display) / Bricolage Grotesque (UI) / Space Mono (data)
 *   - no second accent hue — "live" is signalled by form (pulse, caret), so a
 *     phosphor-green accent must not creep back in and clash with the coral
 *   - no decorative barcode / plate-number ornament, and no themed verbiage
 *   - fonts stay self-hosted (no Google Fonts CDN)
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SITE_ROOT = path.resolve(__dirname, '../..')

const COMPONENTS_ROOT = path.resolve(SITE_ROOT, 'src', 'components')
const PAGES_ROOT = path.resolve(SITE_ROOT, 'src', 'pages')
const STYLES_ROOT = path.resolve(SITE_ROOT, 'src', 'styles')
const LAYOUTS_ROOT = path.resolve(SITE_ROOT, 'src', 'layouts')
const APPS_ROOT = path.resolve(SITE_ROOT, 'src', 'apps')

const INCLUDE_EXT = new Set(['.astro', '.jsx', '.tsx', '.ts', '.js', '.css', '.html'])

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
      if (!INCLUDE_EXT.has(path.extname(entry.name))) continue
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

const GLOBAL_CSS = path.join(STYLES_ROOT, 'global.css')

describe('Field Console Site Design Contract (Astro src)', () => {
  it('no banned palette hexes appear in src', () => {
    // Pre-existing navy/cyan/teal families plus the AI-default purple/indigo
    // family, none of which belong in a single-coral-accent system.
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
      const content = fs.readFileSync(file, 'utf-8')
      for (const { re } of banned) {
        const match = content.match(re)
        if (match) offenders.push({ file: path.relative(SITE_ROOT, file), hex: match[0] })
      }
    }

    expect(offenders).toEqual([])
  })

  it('no phosphor-green second accent reappears alongside the coral', () => {
    // The green/orange pair read as a clash. Coral is the only hue; anything
    // "live" is expressed through motion and form instead.
    const greens: Array<{ label: string; re: RegExp }> = [
      { label: 'phosphor green', re: /#a4f27e\b/i },
      { label: 'phosphor green (bright)', re: /#c0ff9e\b/i },
      { label: 'terminal green', re: /#5fbf77\b/i },
      { label: 'phosphor rgb', re: /rgba?\(\s*164\s*,\s*242\s*,\s*126/i },
    ]

    const offenders: Array<{ file: string; token: string }> = []
    for (const file of SITE_FILES) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const { label, re } of greens) {
        if (re.test(content)) offenders.push({ file: path.relative(SITE_ROOT, file), token: label })
      }
    }

    expect(offenders).toEqual([])
  })

  it('no banned font families in src', () => {
    const bannedFonts: Array<{ label: string; re: RegExp }> = [
      { label: 'Inter', re: /['"]Inter['"]/ },
      { label: 'Poppins', re: /['"]Poppins['"]/ },
      { label: 'Roboto', re: /['"]Roboto['"]/ },
      { label: 'Montserrat', re: /['"]Montserrat['"]/ },
      { label: 'DM Sans', re: /['"]DM Sans['"]/ },
      { label: 'Geist Sans', re: /['"]Geist Sans['"]/ },
      { label: 'Playfair Display (legacy)', re: /['"]Playfair Display['"]/ },
      { label: 'IBM Plex Sans (legacy)', re: /['"]IBM Plex Sans['"]/ },
    ]

    const offenders: Array<{ file: string; font: string }> = []
    for (const file of SITE_FILES) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const { label, re } of bannedFonts) {
        if (re.test(content)) offenders.push({ file: path.relative(SITE_ROOT, file), font: label })
      }
    }

    expect(offenders).toEqual([])
  })

  it('no Google Fonts CDN references in src — fonts are self-hosted', () => {
    const offenders: string[] = []
    for (const file of SITE_FILES) {
      const content = fs.readFileSync(file, 'utf-8')
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(content)) {
        offenders.push(path.relative(SITE_ROOT, file))
      }
    }
    expect(offenders).toEqual([])
  })

  it('every display font referenced by the tokens is actually self-hosted', () => {
    const css = fs.readFileSync(GLOBAL_CSS, 'utf-8')
    const faceCss = fs.readFileSync(
      path.resolve(SITE_ROOT, 'public', 'apps', 'shared', 'legacy-fonts.css'),
      'utf-8'
    )
    // @font-face blocks only, so a family name mentioned elsewhere in the file
    // (e.g. a fallback stack in a comment) can't satisfy "actually self-hosted".
    const faceBlocks = faceCss.match(/@font-face\s*\{[^}]*\}/g) ?? []
    for (const family of ['Fraunces', 'Bricolage Grotesque', 'Space Mono']) {
      const referencedByToken = new RegExp(`['"]${family}['"]`).test(css)
      expect(referencedByToken, `${family} should be referenced by a token`).toBe(true)
      const declaredInFontFace = faceBlocks.some((block) =>
        new RegExp(`font-family:\\s*['"]${family}['"]`).test(block)
      )
      expect(declaredInFontFace, `${family} needs an @font-face declaration`).toBe(true)
    }
  })

  it('no emoji glyphs in src components/pages', () => {
    const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}]/u

    const offenders: Array<{ file: string; sample: string }> = []
    for (const file of SITE_FILES) {
      const rel = path.relative(SITE_ROOT, file)
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

  it('type primitives are referenced across the Astro pages', () => {
    // Sanity check that templates use the shared type system rather than
    // one-off inline styling.
    const referencingPages = new Set<string>()
    for (const file of walk(PAGES_ROOT)) {
      const content = fs.readFileSync(file, 'utf-8')
      if (
        /\b(class|className)=["'`][^"'`]*\b(kicker|display1|display2|lede|section-marker|section-head|cmd-preface)\b/.test(
          content
        )
      ) {
        referencingPages.add(path.relative(PAGES_ROOT, file))
      }
    }

    expect(referencingPages.size).toBeGreaterThanOrEqual(4)
  })

  it('Field Console color tokens are defined in global.css', () => {
    const css = fs.readFileSync(GLOBAL_CSS, 'utf-8')
    for (const required of ['--ground:', '--surface:', '--text:', '--accent:', '--text-muted:', '--line:']) {
      expect(css).toContain(required)
    }
    expect(css).toMatch(/--ground:\s*#0b0e13\b/i)
    expect(css).toMatch(/--accent:\s*#ff6b4a\b/i)
    expect(css).toMatch(/--text:\s*#f2f4f6\b/i)
  })

  it('legacy token names remain aliased so downstream rules keep resolving', () => {
    // ~2400 rules in this file still reference the older names. They are kept
    // as role-preserving aliases; dropping them would silently unstyle pages.
    const css = fs.readFileSync(GLOBAL_CSS, 'utf-8')
    for (const alias of ['--bone:', '--ink:', '--terracotta:', '--slate:', '--rule:', '--invert-bg:']) {
      expect(css, `${alias} alias must stay defined`).toContain(alias)
    }
  })

  it('font tokens resolve to Fraunces / Bricolage Grotesque / Space Mono', () => {
    const css = fs.readFileSync(GLOBAL_CSS, 'utf-8')
    expect(css).toMatch(/--font-display:\s*['"]Fraunces['"]/i)
    expect(css).toMatch(/--font-(body|ui):\s*['"]Bricolage Grotesque['"]/i)
    expect(css).toMatch(/--font-mono:\s*['"]Space Mono['"]/i)
  })

  it('is a single-theme dark site — no light-mode override blocks', () => {
    const css = fs.readFileSync(GLOBAL_CSS, 'utf-8')
    expect(css).not.toMatch(/\[data-theme=['"]light['"]\]/)
    expect(css).not.toMatch(/\[data-theme=['"]dark['"]\]/)
  })

  it('the retired theme\'s ornament and verbiage stay out of src', () => {
    // The decorative barcode rule, plate numbering, and volume/coordinate
    // language were the specific things the redesign removed.
    const bannedMarkup: Array<{ label: string; re: RegExp }> = [
      { label: 'decorative barcode element', re: /(class|className)=["'][^"']*\bbarcode\b/ },
      { label: 'plate-number variable', re: /plateNumber|\bplate-number\b/ },
      { label: 'volume reference', re: /\bVol\.\s*(I|II|III|IV|V)\b/ },
      { label: 'frontispiece', re: /frontispiece/i },
      { label: '"working atlas" tagline', re: /working\s+atlas/i },
      { label: 'map-coordinate verbiage', re: /at that coordinate/i },
    ]

    const offenders: Array<{ file: string; label: string }> = []
    for (const file of SITE_FILES) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const { label, re } of bannedMarkup) {
        if (re.test(content)) offenders.push({ file: path.relative(SITE_ROOT, file), label })
      }
    }

    expect(offenders).toEqual([])
  })
})
