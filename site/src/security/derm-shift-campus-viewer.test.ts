import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const publicRoot = path.resolve(process.cwd(), 'public')
const viewerRoot = path.join(publicRoot, 'derm-shift-campus-c5q8n2x7')

function read(name: string): string {
  return fs.readFileSync(path.join(viewerRoot, name), 'utf8')
}

describe('unlisted Derm-Shift medical campus viewer', () => {
  it('ships the complete viewer surface and a nontrivial spatial payload', () => {
    expect(fs.existsSync(path.join(viewerRoot, 'index.html'))).toBe(true)
    expect(fs.existsSync(path.join(viewerRoot, 'viewer.js'))).toBe(true)
    expect(fs.existsSync(path.join(viewerRoot, 'styles.css'))).toBe(true)

    const model = path.join(viewerRoot, 'campus-lod.dsc.gz')
    expect(fs.existsSync(model)).toBe(true)
    expect(fs.statSync(model).size).toBeGreaterThan(400_000)
  })

  it('is explicitly non-indexed and exposes no public-site navigation hook', () => {
    const html = read('index.html')
    expect(html).toContain('name="robots" content="noindex,nofollow,noarchive,nosnippet"')
    expect(html).toContain('UNLISTED ENVIRONMENT VIEWER')

    const headers = fs.readFileSync(path.join(publicRoot, '_headers'), 'utf8')
    expect(headers).toContain('/derm-shift-campus-c5q8n2x7/*')
    expect(headers).toContain('X-Robots-Tag: noindex, nofollow, noarchive, nosnippet')
  })

  it('pins renderer dependencies and retains orbit, flight, sectioning, and destination controls', () => {
    const html = read('index.html')
    const script = read('viewer.js')
    expect(html).toContain('three@0.185.1')
    expect(script).toContain('PointerLockControls')
    expect(script).toContain('OrbitControls')
    expect(script).toContain('clippingPlane')
    expect(script).toContain("dermpath: { label: 'Dermatopathology laboratory'")
    expect(script).toContain("mohs: { label: 'Derm surgery / Mohs center'")
    expect(script).toContain("specialty: { label: 'Specialty dermatology clinic'")
  })
})
