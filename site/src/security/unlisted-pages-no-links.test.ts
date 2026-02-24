import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

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

describe('Unlisted surfaces remain unlinked', () => {
  it('does not link to /tasks anywhere in shipped site content', () => {
    const SITE_ROOT = path.resolve(process.cwd()) // .../repo/site
    const REPO_ROOT = path.resolve(SITE_ROOT, '..')

    // Scan both authored content and public assets.
    const scanRoots = [
      path.join(SITE_ROOT, 'src'),
      path.join(SITE_ROOT, 'public')
    ]

    const offenders: string[] = []

    // Anything that contains an actual link/navigation surface to /tasks should fail.
    // We intentionally allow the tasks page itself to mention its own route.
    const allowedFiles = new Set<string>([
      path.resolve(REPO_ROOT, 'site/public/tasks/index.html'),
      path.resolve(REPO_ROOT, 'docs/site-test-inventory.md')
    ])

    // We treat "unlinked" as: no navigational anchors/buttons/forms pointing to /tasks.
    // Redirect stubs (meta refresh / window.location.replace) are allowed so old entry points can forward.
    const linkPatterns: RegExp[] = [
      /<a\b[^>]*\bhref\s*=\s*["']\/?tasks\b/i,
      /<form\b[^>]*\baction\s*=\s*["']\/?tasks\b/i,
      /\bto\s*:\s*["']\/?tasks\b/i
    ]

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

    expect(offenders, `Found links to /tasks (must be unlinked):\n${offenders.join('\n')}`).toEqual([])
  })
})
