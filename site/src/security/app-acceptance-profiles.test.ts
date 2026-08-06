import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const registry = JSON.parse(readFileSync(resolve(__dirname, '../data/apps.json'), 'utf8')) as Array<Record<string, any>>
const profiles = JSON.parse(readFileSync(resolve(__dirname, '../data/app-acceptance-profiles.json'), 'utf8')) as Record<string, Record<string, any>>

const ALLOWED_RISK_TIERS = new Set(['low', 'moderate', 'high', 'critical'])

describe('application acceptance profiles', () => {
  it('assigns every registered application to a defined profile', () => {
    const missing = registry
      .filter((app) => !profiles[app.acceptanceProfile])
      .map((app) => `${app.slug}: ${app.acceptanceProfile}`)

    expect(missing).toEqual([])
  })

  it('defines executable suites and blocking gates for every profile', () => {
    const problems: string[] = []

    for (const [id, profile] of Object.entries(profiles)) {
      if (!ALLOWED_RISK_TIERS.has(profile.riskTier)) problems.push(`${id}: invalid riskTier`)
      if (!Array.isArray(profile.requiredSuites) || profile.requiredSuites.length < 2) problems.push(`${id}: requiredSuites incomplete`)
      if (!Array.isArray(profile.blockingGates) || profile.blockingGates.length < 3) problems.push(`${id}: blockingGates incomplete`)
      if (profile.requiredSuites?.some((value: unknown) => typeof value !== 'string' || !value.trim())) problems.push(`${id}: invalid suite name`)
      if (profile.blockingGates?.some((value: unknown) => typeof value !== 'string' || !value.trim())) problems.push(`${id}: invalid blocking gate`)
      if (new Set(profile.blockingGates).size !== profile.blockingGates.length) problems.push(`${id}: duplicate blocking gate`)
    }

    expect(problems).toEqual([])
  })

  it('holds active clinical and research systems to high or critical risk tiers', () => {
    const offenders = registry
      .filter((app) => app.status === 'active')
      .filter((app) => ['clinical-workflow', 'clinical-reference', 'research-only'].includes(app.clinicalUse))
      .filter((app) => !['high', 'critical'].includes(profiles[app.acceptanceProfile]?.riskTier))
      .map((app) => `${app.slug}: ${profiles[app.acceptanceProfile]?.riskTier}`)

    expect(offenders).toEqual([])
  })

  it('requires privacy, provenance, and zero-runtime-error gates where applicable', () => {
    const mustHaveRuntimeGate = registry.filter((app) => app.status === 'active' && app.visibility !== 'private-authenticated')
    const missingRuntime = mustHaveRuntimeGate
      .filter((app) => !profiles[app.acceptanceProfile].blockingGates.includes('zero-runtime-errors') && !profiles[app.acceptanceProfile].requiredSuites.includes('production-smoke'))
      .map((app) => app.slug)

    expect(missingRuntime).toEqual([])
    expect(profiles['ramie-research-prototype'].blockingGates).toEqual(expect.arrayContaining([
      'research-prototype-label',
      'public-demo-no-phi',
      'configured-destination-visible',
      'clinician-review-required'
    ]))
    expect(profiles['biologic-monitoring-reference'].blockingGates).toEqual(expect.arrayContaining([
      'agent-level-provenance',
      'review-status-visible',
      'stale-content-warning'
    ]))
  })
})
