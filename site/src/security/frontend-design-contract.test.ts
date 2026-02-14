import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const APPS_ROOT = path.resolve(process.cwd(), 'public', 'apps')
const SHARED_ROOT = path.join(APPS_ROOT, 'shared')

type WalkOptions = {
  excludeDirs: string[]
  excludeFilePatterns: RegExp[]
  includeExtensions: Set<string>
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

    expect(css).toContain("@import url('./legacy-fonts.css');")
  })

  it('legacy apps avoid banned vibecoded tokens and patterns', () => {
    const files = walkFiles(APPS_ROOT, {
      excludeDirs: ['vendor'],
      excludeFilePatterns: [/\.min\.js$/i],
      includeExtensions: new Set(['.html', '.css', '.js'])
    })

    const bannedRegexes: Array<{ label: string; re: RegExp }> = [
      { label: 'Inter font', re: /\bInter\b/ },
      { label: 'Backdrops blur', re: /backdrop-filter/i },
      { label: 'Transition all', re: /transition\s*:\s*all\b/i },
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
})

