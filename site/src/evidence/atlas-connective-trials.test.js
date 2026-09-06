import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
const root = new URL('../../public/apps/rheum-derm-immune-atlas/', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
function fixture() {
  const context = vm.createContext({}); vm.runInContext(read('explorer/connective-tissue-evidence.js'), context);
  const data = JSON.parse(read('index.html').split('const DATA = ')[1].split(';\n// Execute before')[0]);
  data.scopedClaims = [];
  return { data, api: context.AtlasConnectiveTissueEvidence };
}
describe('Primary connective-tissue trial scope', () => {
  it('adds seven scoped claims and two explicit correction holds without changing effects', () => {
    const {data,api} = fixture(); const before = JSON.stringify(data.effects); const refCount = data.references.length;
    api.install(data);
    expect(data.scopedClaims).toHaveLength(7); expect(data.publicationReviewHolds).toHaveLength(2);
    expect(JSON.stringify(data.effects)).toBe(before);
    expect(data.references).toHaveLength(refCount+1); // six existing reference identities are reused
    expect(new Set(data.references.map(r => r.id)).size).toBe(data.references.length);
    expect(data.scopedClaims.every(c => c.evidenceAccess === 'abstract' && c.humanApproved === false && c.clinicallyValidated === false && c.automaticGraphPromotion === false)).toBe(true);
  });
  it('preserves failed primary comparisons rather than converting pooled response into efficacy', () => {
    const {api} = fixture();
    for (const id of ['ctd-rim', 'ctd-sls2']) {
      const c = api.packet.claims.find(c=>c.id===id);
      expect(c.primaryOutcome).toBe('NOT_MET');
      expect(c.limitations).toContain('equivalence');
    }
    expect(api.packet.claims.find(c=>c.id==='ctd-senscis').limitations).toContain('P=0.06 to 0.10');
    expect(api.packet.claims.find(c=>c.id==='ctd-proderm').limitations).toContain('events are not necessarily six distinct patients');
  });
  it('preserves comparator and outcome context for every trial', () => {
    const {api} = fixture();
    for (const c of api.packet.claims) {
      for (const key of ['population','comparison','endpoint','result','limitations']) expect(c[key].length).toBeGreaterThan(3);
      expect(['MET','NOT_MET','MET_WITH_SENSITIVITY_LIMITATION']).toContain(c.primaryOutcome);
      expect(c.quote.split(/\s+/).length).toBeLessThanOrEqual(25);
    }
    expect(api.packet.claims.find(c=>c.id==='ctd-blissln').limitations).toContain('not isolated cutaneous');
  });
  it('keeps corrections pending without calling them retractions or clinical acceptance', () => {
    const {api} = fixture();
    expect(api.packet.publicationHolds.map(h=>h.correctionPmids)).toEqual([['34062140'],['33007286','33667402']]);
    for(const h of api.packet.publicationHolds) {
      expect(h.reviewStatus).toBe('PUBLICATION_CORRECTION_REVIEW_PENDING');
      expect(h.clinicallyValidated).toBe(false); expect(h.caveat).toContain('not a retraction');
    }
  });
  it('fails atomically on conflicting or repeated reference installation', () => {
    const {data,api} = fixture(); data.references.find(r=>r.id==='R06').pmid = '999'; const before=JSON.stringify(data);
    expect(()=>api.install(data)).toThrow('Conflicting'); expect(JSON.stringify(data)).toBe(before);
    const fresh=fixture(); fresh.api.install(fresh.data); const installed=JSON.stringify(fresh.data);
    expect(()=>fresh.api.install(fresh.data)).toThrow('Duplicate'); expect(JSON.stringify(fresh.data)).toBe(installed);
  });
  it('resolves every study and hold to an existing condition and medication', () => {
    const {data,api} = fixture(); api.install(data);
    for (const record of [...data.scopedClaims, ...data.publicationReviewHolds]) {
      expect(data.conditions.some(c => c.id === record.condition)).toBe(true);
      expect(data.medications.some(m => m.id === record.med)).toBe(true);
    }
    expect(api.packet.claims.find(c => c.id === 'ctd-senscis').med).toBe('ninted');
    expect(api.packet.publicationHolds.find(h => h.trial === 'focuSSced').med).toBe('tociliz');
  });
  it.each(['conditions', 'medications'])('rejects an unresolved %s join before any mutation', key => {
    const {data,api} = fixture(); data[key] = []; const before = JSON.stringify(data);
    expect(() => api.install(data)).toThrow('Unresolved primary-study');
    expect(JSON.stringify(data)).toBe(before);
  });
  it('freezes the evidence packet and nested records', () => {
    const {api} = fixture();
    expect(Object.isFrozen(api.packet)).toBe(true);
    expect(Object.isFrozen(api.packet.claims[0])).toBe(true);
    expect(Object.isFrozen(api.packet.publicationHolds[0].correctionPmids)).toBe(true);
  });
});
