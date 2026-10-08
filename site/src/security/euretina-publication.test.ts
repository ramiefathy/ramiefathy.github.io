import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

const root = path.resolve('public/study/euretina-2026-9c4e7a2b')
const html = () => fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const digest = (bytes: string | Buffer) => crypto.createHash('sha256').update(bytes).digest('hex')
const dataText = () => html().match(/<script id="guide-data" type="application\/json">([\s\S]*?)<\/script>/)![1]
const data = () => JSON.parse(dataText())

describe('EURETINA multipart publication', () => {
  it('preserves the acquired guide data and explicit incomplete coverage', () => {
    const guide = data()
    expect(digest(dataText())).toBe('8544a8737fa27b0de84a6c164a8681413ddf2790974407e9447221bbb6d0f826')
    expect(guide.sessions).toHaveLength(16)
    expect(guide.sessions.reduce((n: number, s: any) => n + s.chapter_summaries.length, 0)).toBe(134)
    expect(guide.starred).toHaveLength(69)
    expect(guide.starred.filter((x: any) => x.status === 'ready')).toHaveLength(51)
    expect(guide.starred.filter((x: any) => x.status === 'pending')).toHaveLength(18)
    expect(guide.complete).toBe(false)
    expect(guide.sessions.filter((x: any) => x.summary.overview.length === 0)).toHaveLength(1)
  })

  it('packages all 300 figures and verifies each indexed figure against its source hash', () => {
    const guide = data()
    expect(guide.figures).toHaveLength(296)
    const legacy = JSON.parse(html().match(/const FIGURES=(\[[\s\S]*?\]);/)![1])
    expect(legacy).toHaveLength(4)
    const files = new Set<string>()
    for (const figure of guide.figures) {
      const file = path.resolve(root, figure.image_path)
      expect(file.startsWith(root + path.sep)).toBe(true)
      expect(digest(fs.readFileSync(file)), figure.image_path).toBe(figure.image_sha256)
      expect(figure.attribution.length).toBeGreaterThan(0)
      files.add(figure.image_path)
    }
    for (const figure of legacy) {
      const file = 'assets/' + figure.file
      expect(fs.statSync(path.join(root, file)).size).toBeGreaterThan(0)
      files.add(file)
    }
    expect(files.size).toBe(300)
  })

  it('verifies the entire deployable checksum manifest', () => {
    const rows = fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8').trim().split('\n')
    expect(rows).toHaveLength(302)
    for (const row of rows) {
      const [, hash, name] = row.match(/^([a-f0-9]{64})\s+(.+)$/)!
      const file = path.resolve(root, name)
      expect(file.startsWith(root + path.sep)).toBe(true)
      expect(digest(fs.readFileSync(file)), name).toBe(hash)
    }
  })

  it('keeps the updated page noindex and avoids describing public access as private', () => {
    expect(html()).toContain('<meta name="robots" content="noindex, nofollow, noarchive">')
    expect(html()).not.toContain('content="A private EURETINA')
    expect(html()).toContain('connect-src \'none\'')
  })
})
