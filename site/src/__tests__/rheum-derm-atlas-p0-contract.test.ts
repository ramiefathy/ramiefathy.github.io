import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('Rheum–Derm Atlas P0 scientific-integrity source contract', () => {
  const index = read('public/apps/rheum-derm-immune-atlas/index.html')
  const remediation = read('public/apps/rheum-derm-immune-atlas/explorer/p0-scientific-remediation.js')

  it('loads the remediation before atlas initialization', () => {
    const remediationIndex = index.indexOf('p0-scientific-remediation.js?v=atlas-p0-20260803-3')
    const initializationIndex = index.indexOf('// Quiz generator')
    expect(remediationIndex).toBeGreaterThan(0)
    expect(initializationIndex).toBeGreaterThan(remediationIndex)
    expect(index).toContain('window.__ATLAS_P0__?.refreshUi()')
  })

  it('requires source-explicit or curator-confirmed default links', () => {
    expect(remediation).toContain("const DEFAULT_ORIGINS = new Set(['source-explicit', 'curator-confirmed'])")
    expect(remediation).toContain("link.relationOrigin = 'source-explicit'")
    expect(remediation).toContain("link.relationOrigin = 'curator-confirmed'")
    expect(remediation).toContain('Source-explicit link lacks source span')
    expect(remediation).toContain('Treatment triangulation leaked into default links')
  })

  it('quarantines canonical-background and treatment-informed hypotheses by default', () => {
    expect(remediation).toContain('causalRules.splice(0)')
    expect(remediation).toContain('networkExploratoryMappings')
    expect(remediation).toContain('networkCanonicalBackground')
    expect(remediation).toContain("? 'therapy-informed'")
    expect(remediation).toContain('defaultVisible = false')
  })

  it('replaces obsolete manifestation-map labels with reviewed and exploratory provenance language', () => {
    expect(remediation).toContain("const mode = $('#manifestTableMode')")
    expect(remediation).toContain("['Source-explicit', 'Source-explicit']")
    expect(remediation).toContain("['Curator-confirmed', 'Curator-confirmed']")
    expect(remediation).toContain("['Therapy-informed hypothesis', 'Therapy-informed hypothesis']")
    expect(index).toContain("['Directly named','Source-explicit','Curator-confirmed'].includes(link.relationship)")
    expect(index).toContain('Source-explicit / curator-confirmed')
    expect(index).toContain('Domain / lexical hypothesis')
    expect(index).toContain('Therapy-informed hypothesis')
  })

  it('keeps broad source synonyms from promoting unrelated exact phenotypes', () => {
    expect(remediation).toContain('GENERIC_SOURCE_CANDIDATES')
    expect(remediation).toContain('candidate === primaryCandidate')
    expect(remediation).toContain('containsWholePhrase(normalizedSegment, candidate)')
    expect(remediation).not.toContain('normalizedSegment.includes(candidate)')
    expect(remediation).not.toContain('containsWholePhrase(candidate, normalizedSegment)')
  })

  it('audits unmapped vasculitis effects and serializes evidence-layer updates', () => {
    expect(remediation).toContain('const rejectedEffects = []')
    expect(remediation).toContain('DATA.rejectedEffects = [...(DATA.rejectedEffects || []), ...rejectedEffects]')
    expect(remediation).toContain('treatmentEffectAccountingComplete')
    expect(remediation).toContain('Rejected relationship became active')
    expect(remediation).toContain('let layerStateQueue = Promise.resolve()')
    expect(remediation).toContain('() => runLayerState(requestedState)')
    expect(remediation).toContain('defaultCanonicalRuleCount')
  })

  it('runs every permanent P0 browser suite with pinned, non-persistent actions', () => {
    const workflow = read('../.github/workflows/rheum-derm-atlas-p0.yml')
    for (const spec of [
      'rheum-derm-atlas-p0-integrity.spec.ts',
      'rheum-derm-immune-atlas.spec.ts',
      'rheum-derm-atlas-contrast-graph.spec.ts',
      'rheum-derm-atlas-alternative-views.spec.ts',
      'rheum-derm-atlas-mobile-displays.spec.ts',
    ]) {
      expect(workflow).toContain(spec)
    }
    expect(workflow).toContain('persist-credentials: false')
    expect(workflow).toMatch(/actions\/checkout@[0-9a-f]{40}/)
    expect(workflow).toMatch(/actions\/setup-node@[0-9a-f]{40}/)
    expect(workflow).toMatch(/actions\/upload-artifact@[0-9a-f]{40}/)
    expect(workflow).toContain('verified-source allowlist must contain exactly 15 unique paths')
  })

  it('splits the vasculitis umbrella and codifies the P0 rejection registry', () => {
    for (const id of ['aav', 'egpa', 'gca', 'immune_complex_vasculitis']) expect(remediation).toContain(`id: '${id}'`)
    expect(remediation).toContain('Rheumatoid nodules are primarily necrobiotic/palisading granulomatous')
    expect(remediation).toContain('Rituximab effector pharmacology cannot be used as proof')
    expect(remediation).toContain('IL-1 blockade controls inflammation but does not eradicate')
    expect(remediation).toContain('Randomized rituximab trials do not support a simple positive global fatigue/pain')
    expect(remediation).toContain('Anticoagulation treats thrombosis and does not validate coagulation')
    expect(remediation).toContain('ACE-inhibitor efficacy in established renal crisis does not specifically validate')
  })
})
