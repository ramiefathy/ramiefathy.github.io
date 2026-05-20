import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type FileEntry = {
  absolutePath: string
  relativePath: string
}

function listFilesRecursive(rootDir: string): FileEntry[] {
  const out: FileEntry[] = []

  const visit = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(abs)
        continue
      }
      out.push({ absolutePath: abs, relativePath: abs.replace(`${rootDir}/`, '') })
    }
  }

  visit(rootDir)
  return out
}

describe('SSR hydration safety (React style tags)', () => {
  it('disallows <style>{`...`}</style> template literals in React islands', () => {
    const componentsRoot = resolve(process.cwd(), 'src/components')
    const jsxFiles = listFilesRecursive(componentsRoot).filter((file) => extname(file.absolutePath) === '.jsx')

    const violations: string[] = []
    const inlineStyleTemplate = /<style[^>]*>\s*\{\s*`/m

    for (const file of jsxFiles) {
      const source = readFileSync(file.absolutePath, 'utf8')
      if (inlineStyleTemplate.test(source)) {
        violations.push(file.relativePath)
      }
    }

    expect(violations).toEqual([])
  })
})

