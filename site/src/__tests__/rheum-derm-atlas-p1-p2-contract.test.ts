import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), 'public/apps/rheum-derm-immune-atlas')
const index = readFileSync(resolve(root, 'index.html'), 'utf8')
const governance = readFileSync(resolve(root, 'explorer/p1-p2-governance.js'), 'utf8')
const styles = readFileSync(resolve(root, 'explorer/p2-interface.css'), 'utf8')

describe('Rheum–Derm Atlas P1/P2 governed interface contract', () => {
  it('loads the governance layer after P0 and before atlas initialization', () => {
    const p0 = index.indexOf('p0-scientific-remediation.js')
    const p12 = index.indexOf('p1-p2-governance.js')
    expect(p0).toBeGreaterThan(-1)
    expect(p12).toBeGreaterThan(p0)
  })

  it('separates all seven relationship dimensions', () => {
    for (const dimension of ['availability', 'visibility', 'provenance', 'evidence', 'causality', 'scope', 'curation']) {
      expect(governance).toContain(dimension)
    }
    expect(governance).toContain('RELATIONSHIP_MODEL')
    expect(governance).toContain('compactState')
  })

  it('uses polyhierarchical phenotype tags and a distinct layout projection', () => {
    expect(governance).toContain('PHENOTYPE_TAGS')
    expect(governance).toContain('parents:')
    expect(governance).toContain('phenotypeTags')
    expect(governance).toContain('layoutTagKey')
    expect(governance).toContain('coordinate only')
  })

  it('requires condition, endotype, tissue, and applicability scope', () => {
    expect(governance).toContain('conditionIds')
    expect(governance).toContain('endotypeIds')
    expect(governance).toContain('tissueIds')
    expect(governance).toContain('applicability')
  })

  it('keeps canonical background optional and supports conflicts and curation', () => {
    expect(governance).toContain('canonicalBackgroundRegistry')
    expect(governance).toContain("visibility: 'hidden-optional'")
    expect(governance).toContain('registerConflict')
    expect(governance).toContain("consensus: 'mixed'")
    expect(governance).toContain("status: 'contested'")
  })

  it('implements every P2 interface-quality requirement', () => {
    for (const marker of [
      'atlasTaskNavigation',
      'networkEpistemicDenominator',
      'networkSearchResults',
      'networkLabelDisclosure',
      'networkProvenanceInspector',
      'networkCopyViewLink',
      'networkExportVisibleJson',
      'networkNonDragControls',
      '__ATLAS_P2__',
    ]) expect(governance).toContain(marker)
  })

  it('does not retain role=application and defines touch-sized mobile controls', () => {
    expect(governance).toContain("canvas.setAttribute('role', 'region')")
    expect(styles).toContain('min-height: 44px')
    expect(styles).toContain('touch-action: none')
    expect(styles).toContain('position: static')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
