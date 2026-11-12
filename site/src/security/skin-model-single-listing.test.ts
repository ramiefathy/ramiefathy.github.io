import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every 3D skin-model attempt (Skin3D, the Skinoculars line, Opus-Skin, the AtlasSkin 3D DEJ Explorer, …) keeps
 * its own repository, but the site lists them once: the Skinoculars portfolio at skinoculars.ramiefathy.com
 * (source ramiefathy/Skinoculars), which opens on the current model and links every earlier version.
 */
const repoRoot = path.resolve(process.cwd(), '..')
const CANONICAL = 'https://skinoculars.ramiefathy.com/'
type App = { name: string; slug: string; description: string; href: string; preview?: string }
const apps = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/src/data/apps.json'), 'utf8')) as App[]

// Hosts, slugs and names of the skin-model versions that are now reached through the Skinoculars portfolio.
const SKIN_MODEL = /skinoculars|skin3d|skin-?3d|opus-?skin|atlasskin|atlas-skin|dej explorer|atlas\.ramiefathy\.com|skin-showcase/i

describe('skin models have a single catalog listing', () => {
  it('exactly one catalog entry is a skin model, and it is the Skinoculars portfolio', () => {
    const hits = apps.filter((a) => SKIN_MODEL.test([a.name, a.slug, a.href, a.preview ?? ''].join(' ')))
    expect(hits.map((a) => a.slug)).toEqual(['skinoculars'])
    expect(hits[0].href).toBe(CANONICAL)
    expect(hits[0].preview).toBe(CANONICAL)
  })

  it('the listing says it holds the version history', () => {
    const entry = apps.find((a) => a.slug === 'skinoculars')
    expect(entry?.description).toMatch(/earlier versions|version history|prior versions/i)
  })

  it('the catalog page has no category for the retired AtlasSkin 3D entry', () => {
    const page = fs.readFileSync(path.join(repoRoot, 'site/src/pages/apps/index.astro'), 'utf8')
    expect(page).not.toContain("'atlas-skin-3d'")
  })
})
