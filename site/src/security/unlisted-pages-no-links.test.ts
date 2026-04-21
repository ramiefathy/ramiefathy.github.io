import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type UnlistedStaticPage = {
  label: string
  route: string
  file: string
}

function walkFiles(rootDir: string): string[] {
  const results: string[] = []
  const stack: string[] = [rootDir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      results.push(full)
    }
  }

  return results
}

function loadUnlistedStaticPages(repoRoot: string): UnlistedStaticPage[] {
  const inventoryPath = path.resolve(repoRoot, 'docs/site-test-inventory.md')
  const markdown = fs.readFileSync(inventoryPath, 'utf-8')
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/m)
  if (!match) {
    throw new Error(`No inventory JSON block found in ${inventoryPath}`)
  }

  const inventory = JSON.parse(match[1]) as { unlistedStaticPages?: UnlistedStaticPage[] }
  return inventory.unlistedStaticPages ?? []
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeRoute(route: string): string {
  return route.replace(/\/+$/, '').replace(/^\//, '')
}

describe('Unlisted surfaces remain unlinked', () => {
  it('does not link to unlisted static pages anywhere in shipped site content', () => {
    const SITE_ROOT = path.resolve(process.cwd()) // .../repo/site
    const REPO_ROOT = path.resolve(SITE_ROOT, '..')
    const unlistedPages = loadUnlistedStaticPages(REPO_ROOT)

    // Scan both authored content and public assets.
    const scanRoots = [
      path.join(SITE_ROOT, 'src'),
      path.join(SITE_ROOT, 'public')
    ]

    const offenders: string[] = []

    // Anything that contains an actual link/navigation surface to an unlisted route should fail.
    // We intentionally allow each unlisted page itself to mention its own route.
    const allowedFiles = new Set<string>(
      unlistedPages.map((entry) => path.resolve(REPO_ROOT, entry.file))
    )

    // We treat "unlinked" as: no navigational anchors/buttons/forms pointing to unlisted routes.
    // Redirect stubs (meta refresh / window.location.replace) are allowed so old entry points can forward.
    const linkPatterns: RegExp[] = unlistedPages.flatMap((entry) => {
      const route = escapeRegExp(normalizeRoute(entry.route))
      return [
        new RegExp(`<a\\b[^>]*\\bhref\\s*=\\s*["']/?${route}(?:[/#?]|["'])`, 'i'),
        new RegExp(`<form\\b[^>]*\\baction\\s*=\\s*["']/?${route}(?:[/#?]|["'])`, 'i'),
        new RegExp(`\\bto\\s*:\\s*["']/?${route}(?:[/#?]|["'])`, 'i')
      ]
    })

    for (const root of scanRoots) {
      for (const file of walkFiles(root)) {
        if (allowedFiles.has(path.resolve(file))) continue

        const ext = path.extname(file).toLowerCase()
        // Only scan text-like files to avoid false positives in binaries.
        if (!['.html', '.htm', '.js', '.ts', '.tsx', '.jsx', '.css', '.md', '.astro', '.json'].includes(ext)) continue

        const content = fs.readFileSync(file, 'utf-8')
        if (linkPatterns.some((re) => re.test(content))) {
          offenders.push(path.relative(REPO_ROOT, file))
        }
      }
    }

    expect(
      offenders,
      `Found links to unlisted static pages (must be unlinked):\n${offenders.join('\n')}`
    ).toEqual([])
  })
})
