import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const LEGACY_SHELL_PATH = path.resolve(process.cwd(), 'public', 'apps', 'shared', 'legacy-shell.js')

describe('Legacy shell security contract', () => {
  it('does not interpolate pageName into innerHTML templates', () => {
    const content = fs.readFileSync(LEGACY_SHELL_PATH, 'utf-8')

    // pageName is derived from document.title / location.pathname; it must never be injected as HTML.
    expect(content).not.toMatch(/\$\{pageName\}/)
    expect(content).toMatch(/legacy-shell__name["'][^>]*><\/span>/)
    expect(content).toMatch(/\.textContent\s*=\s*pageName\b/)
  })
})
