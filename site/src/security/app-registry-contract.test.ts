import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const siteRoot = resolve(__dirname, '../..')
const repositoryRoot = resolve(siteRoot, '..')
const registryPath = resolve(__dirname, '../data/apps.json')
const catalogPath = resolve(__dirname, '../pages/apps/index.astro')

const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as Array<Record<string, any>>
const catalog = readFileSync(catalogPath, 'utf8')

const REQUIRED_STRING_FIELDS = [
  'name',
  'slug',
  'description',
  'outcome',
  'category',
  'status',
  'maturity',
  'maturityLabel',
  'visibility',
  'clinicalUse',
  'dataFlow',
  'privacySummary',
  'accountRequirement',
  'phiPolicy',
  'acceptanceProfile',
  'href'
]

const ALLOWED_CATEGORIES = new Set(['clinical', 'learning', 'research', 'reference', 'productivity', 'private', 'archive'])
const ALLOWED_STATUS = new Set(['active', 'legacy'])
const ALLOWED_REVIEW_STATUS = new Set([
  'reviewed',
  'review-due',
  'review-pending',
  'research-artifact',
  'not-applicable',
  'expired'
])
const ALLOWED_PHI_POLICIES = new Set(['not-accepted', 'approved-deployment-only', 'not-applicable'])
const PUBLIC_CATALOG_CATEGORIES = new Set(['clinical', 'learning', 'research', 'reference', 'productivity'])

function routeSourceExists(href: string) {
  if (/^https?:\/\//.test(href)) return true
  const pathname = href.split(/[?#]/)[0]

  if (pathname.startsWith('/research/')) {
    const page = pathname.replace(/^\//, '') + '.astro'
    return existsSync(resolve(siteRoot, 'src/pages', page))
  }

  if (pathname === '/apps/mindmaps/' || pathname === '/apps/mindmaps') {
    return existsSync(resolve(siteRoot, 'src/pages/apps/mindmaps/index.astro'))
  }

  if (pathname.startsWith('/apps/')) {
    const relative = decodeURIComponent(pathname.replace(/^\/apps\//, ''))
    const candidate = relative.endsWith('/') ? `${relative}index.html` : relative
    return existsSync(resolve(siteRoot, 'public/apps', candidate))
  }

  if (pathname.startsWith('/tools/')) {
    const relative = pathname.replace(/^\//, '')
    const candidate = relative.endsWith('/') ? `${relative}index.html` : relative
    return existsSync(resolve(siteRoot, 'public', candidate)) || existsSync(resolve(repositoryRoot, candidate))
  }

  if (pathname.startsWith('/strategy/')) {
    const relative = pathname.replace(/^\//, '')
    return existsSync(resolve(siteRoot, 'src/pages', `${relative}.astro`)) || existsSync(resolve(siteRoot, 'src/pages', relative, 'index.astro'))
  }

  if (pathname === '/tasks') return existsSync(resolve(siteRoot, 'public/tasks/index.html'))
  if (pathname.startsWith('/study/')) return existsSync(resolve(siteRoot, 'public', pathname.replace(/^\//, ''), 'index.html'))
  if (pathname === '/mcq-eval/') return existsSync(resolve(siteRoot, 'public/mcq-eval/index.html'))
  if (pathname.startsWith('/legacy/')) return true
  return false
}

describe('authoritative application registry', () => {
  it('defines unique, complete, explicitly governed records', () => {
    const problems: string[] = []
    const slugs = new Set<string>()
    const sortRanks = new Set<number>()

    for (const app of registry) {
      for (const field of REQUIRED_STRING_FIELDS) {
        if (typeof app[field] !== 'string' || !app[field].trim()) problems.push(`${app.slug ?? app.name ?? 'unknown'}: missing ${field}`)
      }
      if (slugs.has(app.slug)) problems.push(`${app.slug}: duplicate slug`)
      slugs.add(app.slug)
      if (!ALLOWED_CATEGORIES.has(app.category)) problems.push(`${app.slug}: invalid category ${app.category}`)
      if (!ALLOWED_STATUS.has(app.status)) problems.push(`${app.slug}: invalid status ${app.status}`)
      if (typeof app.listed !== 'boolean') problems.push(`${app.slug}: listed must be explicit boolean`)
      if (typeof app.featured !== 'boolean') problems.push(`${app.slug}: featured must be explicit boolean`)
      if (!Number.isInteger(app.sortRank)) problems.push(`${app.slug}: sortRank must be an integer`)
      if (sortRanks.has(app.sortRank)) problems.push(`${app.slug}: duplicate sortRank ${app.sortRank}`)
      sortRanks.add(app.sortRank)
      if (!Array.isArray(app.audience) || !app.audience.length || app.audience.some((value: unknown) => typeof value !== 'string' || !value.trim())) {
        problems.push(`${app.slug}: audience must be a non-empty string array`)
      }
      if (!Array.isArray(app.stack) || !app.stack.length) problems.push(`${app.slug}: stack must be non-empty`)
      if (!ALLOWED_PHI_POLICIES.has(app.phiPolicy)) problems.push(`${app.slug}: invalid phiPolicy ${app.phiPolicy}`)
      if (!app.review || !ALLOWED_REVIEW_STATUS.has(app.review.status) || typeof app.review.note !== 'string' || !app.review.note.trim()) {
        problems.push(`${app.slug}: invalid review contract`)
      }
    }

    expect(problems).toEqual([])
  })

  it('keeps private, unlisted, and archived surfaces out of the public catalog', () => {
    const offenders = registry
      .filter((app) => app.listed)
      .filter((app) => app.status !== 'active' || !PUBLIC_CATALOG_CATEGORIES.has(app.category) || /private|unlisted|archive/.test(app.visibility))
      .map((app) => `${app.slug}: ${app.status}/${app.category}/${app.visibility}`)

    expect(offenders).toEqual([])
  })

  it('requires every listed in-repository route to have a build source', () => {
    const missing = registry
      .filter((app) => app.listed && !/^https?:\/\//.test(app.href))
      .filter((app) => !routeSourceExists(app.href))
      .map((app) => `${app.slug}: ${app.href}`)

    expect(missing).toEqual([])
  })

  it('makes RAMIE a feature-rich research prototype without removing its capabilities', () => {
    const ramie = registry.find((app) => app.slug === 'dermatology-scribe')
    expect(ramie).toBeDefined()
    expect(ramie?.maturity).toBe('research-prototype')
    expect(ramie?.maturityLabel).toBe('Research prototype')
    expect(ramie?.clinicalUse).toBe('research-only')
    expect(ramie?.description).toMatch(/transcription/i)
    expect(ramie?.description).toMatch(/multimodal/i)
    expect(ramie?.description).toMatch(/differential/i)
    expect(ramie?.description).toMatch(/management/i)
    expect(ramie?.description).toMatch(/note/i)
    expect(ramie?.privacySummary).toMatch(/public demo is not approved for protected health information/i)
    expect(ramie?.phiPolicy).toBe('approved-deployment-only')
  })

  it('marks stale clinical-reference content as review due or expired', () => {
    const now = Date.parse('2026-08-06T00:00:00Z')
    const offenders: string[] = []

    for (const app of registry) {
      if (!['clinical-reference', 'clinical-workflow'].includes(app.clinicalUse)) continue
      const reviewedOn = app.review?.reviewedOn
      const interval = app.review?.reviewIntervalDays
      if (!reviewedOn || !Number.isFinite(interval)) continue
      const ageDays = (now - Date.parse(`${reviewedOn}T00:00:00Z`)) / 86_400_000
      if (ageDays > interval && !['review-due', 'expired'].includes(app.review.status)) {
        offenders.push(`${app.slug}: ${ageDays.toFixed(0)} days old but ${app.review.status}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('does not make false portfolio-wide account or tracking claims', () => {
    expect(catalog).not.toContain('No accounts. No tracking.')
    expect(catalog).toContain('Maturity and data flow shown per app')
    expect(catalog).toContain('app.privacySummary')
    expect(catalog).toContain('app.outcome')
    expect(catalog).toContain('app.maturityLabel')
  })

  it('exposes outcome, maturity, privacy, account, PHI, and category in catalog search or cards', () => {
    for (const marker of [
      'app.outcome',
      'app.description',
      'app.category',
      'app.maturityLabel',
      'app.audience.join',
      'app.stack.join',
      'app.privacySummary',
      'app.accountRequirement',
      'app.phiPolicy'
    ]) {
      expect(catalog).toContain(marker)
    }
  })
})
