import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateAssociationSnapshot, validateDrugCandidates } from '../../public/apps/dermatotarget-atlas/evidence-contract.js';
const read = name => JSON.parse(readFileSync(new URL(`../../public/apps/dermatotarget-atlas/data/${name}.json`, import.meta.url), 'utf8'));
const targets = read('targets');
const snapshot = read('association-review');

describe('source summaries and identities cannot silently drift', () => {
  it.each([
    ['missing counts', s => { delete s.counts; }],
    ['forged counts', s => { s.counts.DIRECT_ASSOCIATION_RETURNED += 1; }],
    ['extra count status', s => { s.counts.CLINICALLY_VALIDATED = 0; }],
    ['invalid retrieval date', s => { s.retrieved_at = 'not-a-date'; }],
    ['invalid source version', s => { s.source_version = {}; }],
    ['missing historical file hash', s => { delete s.historical_targets_sha256; }],
    ['null row', s => { s.pairs[0] = null; }],
    ['wrong disease display name', s => { s.pairs[0].disease_name = 'Different disease'; }],
    ['unresolved identity promotion', s => { s.pairs.find(r => r.status === 'IDENTITY_UNRESOLVED').target_id = 'ENSG00000000001'; }],
    ['not-returned identity loss', s => { s.pairs.find(r => r.status === 'NOT_RETURNED_BY_EXACT_QUERY').target_id = null; }],
  ])('rejects %s', (_label, change) => {
    const invalid = structuredClone(snapshot);
    change(invalid);
    expect(() => validateAssociationSnapshot(invalid, targets)).toThrow();
  });
  it('cannot mutate a payload after its validation was cached', () => {
    const copy = read('drug_candidates');
    validateDrugCandidates(copy);
    expect(() => { copy.cols.genes[0] = -1; }).toThrow(TypeError);
    expect(() => { copy.dims.genes = []; }).toThrow(TypeError);
    expect(() => { copy.report_count[0] = -1; }).toThrow(TypeError);
    expect(validateDrugCandidates(copy)).toBe(copy);
  });
});
