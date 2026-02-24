import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SITE_ROOT = path.resolve(__dirname, '../..')

const TASKBOARD_PATH = path.resolve(SITE_ROOT, 'public', 'tasks', 'index.html')

function getInlineScript(html: string): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/i)
  if (!match) {
    throw new Error(`Unable to find inline <script> in ${TASKBOARD_PATH}`)
  }
  return match[1]
}

describe('Taskboard login flow contract', () => {
  it('showLogin() restores login button state after sign-out', () => {
    const html = fs.readFileSync(TASKBOARD_PATH, 'utf-8')
    const script = getInlineScript(html)

    expect(script).toContain('LOGIN_BUTTON_DEFAULT_HTML')
    expect(script).toMatch(/function\s+showLogin\(\)\s*\{[\s\S]*btn\.disabled\s*=\s*false/i)

    const showLoginBlock = script.match(/function\s+showLogin\(\)\s*\{[\s\S]*?\n\}/)?.[0]
    expect(showLoginBlock).toBeDefined()
    expect(showLoginBlock).toMatch(/btn\.innerHTML\s*=\s*LOGIN_BUTTON_DEFAULT_HTML/)

    const signInBlock = script.match(/function\s+signIn\(\)\s*\{[\s\S]*?\n\}/)?.[0]
    expect(signInBlock).toBeDefined()
    expect(signInBlock).toMatch(/btn\.innerHTML\s*=\s*LOGIN_BUTTON_DEFAULT_HTML/)
  })
})
