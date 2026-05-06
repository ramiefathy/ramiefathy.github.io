import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type UnlistedStaticPage = {
  label: string
  route: string
  file: string
}

type UnlistedAstroRoute = {
  label: string
  route: string
  file: string
  allowedLinkFiles?: string[]
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

function loadUnlistedSurfaces(repoRoot: string): {
  unlistedStaticPages: UnlistedStaticPage[]
  unlistedAstroRoutes: UnlistedAstroRoute[]
} {
  const inventoryPath = path.resolve(repoRoot, 'docs/site-test-inventory.md')
  const markdown = fs.readFileSync(inventoryPath, 'utf-8')
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/m)
  if (!match) {
    throw new Error(`No inventory JSON block found in ${inventoryPath}`)
  }

  const inventory = JSON.parse(match[1]) as {
    unlistedStaticPages?: UnlistedStaticPage[]
    unlistedAstroRoutes?: UnlistedAstroRoute[]
  }
  return {
    unlistedStaticPages: inventory.unlistedStaticPages ?? [],
    unlistedAstroRoutes: inventory.unlistedAstroRoutes ?? []
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeRoute(route: string): string {
  return route.replace(/\/+$/, '').replace(/^\//, '')
}

describe('Unlisted surfaces remain unlinked', () => {
  it('does not link to unlisted pages anywhere in shipped site content', () => {
    const SITE_ROOT = path.resolve(process.cwd()) // .../repo/site
    const REPO_ROOT = path.resolve(SITE_ROOT, '..')
    const { unlistedStaticPages, unlistedAstroRoutes } = loadUnlistedSurfaces(REPO_ROOT)
    const unlistedPages = [...unlistedStaticPages, ...unlistedAstroRoutes]

    // Scan both authored content and public assets.
    const scanRoots = [
      path.join(SITE_ROOT, 'src'),
      path.join(SITE_ROOT, 'public')
    ]

    const offenders: string[] = []

    // Anything that contains an actual link/navigation surface to an unlisted route should fail.
    // We intentionally allow each unlisted page itself to mention its own route.
    const allowedFiles = new Set<string>(
      unlistedPages.flatMap((entry) => [
        path.resolve(REPO_ROOT, entry.file),
        ...('allowedLinkFiles' in entry ? (entry.allowedLinkFiles ?? []).map((file) => path.resolve(REPO_ROOT, file)) : [])
      ])
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
      `Found links to unlisted pages (must be unlinked):\n${offenders.join('\n')}`
    ).toEqual([])
  })

  it('requires unlisted Astro routes to opt out of indexing and canonical URLs', () => {
    const SITE_ROOT = path.resolve(process.cwd()) // .../repo/site
    const REPO_ROOT = path.resolve(SITE_ROOT, '..')
    const { unlistedAstroRoutes } = loadUnlistedSurfaces(REPO_ROOT)

    const offenders = unlistedAstroRoutes.flatMap((entry) => {
      const filePath = path.resolve(REPO_ROOT, entry.file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const failures: string[] = []

      if (!/noindex\s*=\s*{true}/.test(content)) {
        failures.push(`${entry.file}: missing noindex={true}`)
      }

      if (!/canonical\s*=\s*{null}/.test(content)) {
        failures.push(`${entry.file}: missing canonical={null}`)
      }

      const headersPath = path.resolve(SITE_ROOT, 'public/_headers')
      const headers = fs.readFileSync(headersPath, 'utf-8')
      const headerPattern = new RegExp(`${escapeRegExp(normalizeRoute(entry.route))}/\\*\\s+X-Robots-Tag:\\s*noindex,\\s*nofollow`, 'm')
      if (!headerPattern.test(headers)) {
        failures.push(`${entry.file}: missing X-Robots-Tag noindex/nofollow header for ${entry.route}/*`)
      }

      return failures
    })

    expect(offenders, `Unlisted Astro route policy failures:\n${offenders.join('\n')}`).toEqual([])
  })
})
