import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { validateAssociationSnapshot, validateDrugCandidates, uniqueDrugRowIds, reconstructDrug, sameIndication, csvText } from '../../public/apps/dermatotarget-atlas/evidence-contract.js';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const json = path => JSON.parse(read(path));
const targetRoot = '../../public/apps/dermatotarget-atlas/';
const targets = json(targetRoot + 'data/targets.json');
const snapshot = json(targetRoot + 'data/association-review.json');
const clone = x => structuredClone(x);
const immuneSource = read('../../public/apps/rheum-derm-immune-atlas/index.html');
const start = immuneSource.indexOf('const DATA = ') + 'const DATA = '.length;
const data = JSON.parse(immuneSource.slice(start, immuneSource.indexOf(';\n// Execute before', start)));
const context = {}; vm.runInNewContext(read('../../public/apps/rheum-derm-immune-atlas/explorer/source-review-contract.js'), context);
const contract = context.AtlasSourceReview;

describe('Independent association source boundary', () => {
  it('accounts for every original target pair without converting missing evidence to zero', () => {
    expect(targets).toHaveLength(600);
    expect(validateAssociationSnapshot(snapshot, targets)).toBe(snapshot);
    expect(snapshot.pairs.filter(r => r.status === 'DIRECT_ASSOCIATION_RETURNED')).toHaveLength(581);
    expect(snapshot.pairs.filter(r => r.status === 'NOT_RETURNED_BY_EXACT_QUERY')).toHaveLength(14);
    expect(snapshot.pairs.filter(r => r.status === 'IDENTITY_UNRESOLVED')).toHaveLength(5);
    expect(snapshot.historical_targets_sha256).toBe(createHash('sha256').update(read(targetRoot + 'data/targets.json')).digest('hex'));
  });
  it('reconstructs the exact snapshot offline and verifies all request/response checksums', () => {
    const root = new URL('../../../', import.meta.url);
    const result = execFileSync('python3', ['scripts/build-atlas-evidence.py', '--check'], { cwd: root, encoding: 'utf8' });
    expect(result).toContain('581');
  });
  it.each([
    ['duplicate', s => { s.pairs[1] = clone(s.pairs[0]); }],
    ['missing', s => s.pairs.pop()],
    ['wrong historical disease', s => { s.pairs[0].historical_disease_id = 'EFO_123'; }],
    ['wrong historical target', s => { s.pairs[0].historical_target_id = 'ENSG00000000000'; }],
    ['unsafe source', s => { s.pairs[0].sources = ['../../secret.json']; }],
    ['clinical promotion', s => { s.pairs[0].clinically_validated = true; }],
    ['direction promotion', s => { s.pairs[0].therapeutic_direction = 'INHIBIT'; }],
    ['unknown status', s => { s.pairs[0].status = 'VERIFIED'; }],
    ['nonfinite score', s => { s.pairs.find(r => r.score !== null).score = NaN; }],
    ['missing source scores', s => { s.pairs[0].datasource_scores = null; }],
    ['missing evidence scored zero', s => { s.pairs.find(r => r.status === 'NOT_RETURNED_BY_EXACT_QUERY').score = 0; }],
    ['ontology propagation', s => { s.enable_indirect = true; }],
  ])('rejects %s', (_label, change) => { const invalid = clone(snapshot); change(invalid); expect(() => validateAssociationSnapshot(invalid, targets)).toThrow(); });
  it('holds conflicting PDE4C identifiers and does not silently invent a gene symbol', () => {
    const held = snapshot.pairs.filter(r => r.status === 'IDENTITY_UNRESOLVED');
    expect(held.filter(r => r.gene === 'PDE4C')).toHaveLength(4);
    expect(held.filter(r => r.gene === 'ENSG00000283128')).toHaveLength(1);
    expect(held.every(r => r.target_id === null && r.score === null)).toBe(true);
  });
});

describe('Candidate identities and exports', () => {
  const col = json(targetRoot + 'data/drug_candidates.json');
  it('retains distinct full records, including indications, stages, targets and report counts', () => {
    validateDrugCandidates(col);
    expect(col.n).toBe(54468);
    const ids = uniqueDrugRowIds(col);
    expect(ids.length).toBeGreaterThan(0); expect(ids.length).toBeLessThan(col.n);
    const reconstructed = ids.map(i => reconstructDrug(col, i));
    expect(new Set(reconstructed.map(r => JSON.stringify(r))).size).toBe(ids.length);
  });
  it.each(['genes', 'targets', 'drugs', 'drug_types', 'stages', 'cand_stages', 'diseases'])('rejects out-of-range %s indexes', name => {
    const bad = clone(col); bad.cols[name][0] = bad.dims[name].length;
    expect(() => validateDrugCandidates(bad)).toThrow(/column/);
  });
  it('rejects malformed report counts', () => { const bad = clone(col); bad.report_count[0] = -1; expect(() => validateDrugCandidates(bad)).toThrow(/report count/); });
  it('does not infer a disease identity from substrings', () => {
    expect(sameIndication(' atopic dermatitis ', 'Atopic dermatitis')).toBe(true);
    expect(sameIndication('arthritis', 'psoriatic arthritis')).toBe(false);
    expect(sameIndication('', '')).toBe(false);
  });
  it('preserves all heterogeneous columns and neutralizes spreadsheet formula strings', () => {
    const csv = csvText([{ gene: '=malicious', score: -1 }, { gene: 'safe', note: '@cmd', sources: ['x', 'y'] }]);
    expect(csv).toContain('"\'=malicious"'); expect(csv).toContain('"\'@cmd"');
    expect(csv).toContain('"-1"'); expect(csv).toContain('"sources"'); expect(csv).toContain('"[""x"",""y""]"');
  });
});

describe('Immune Atlas quarantine boundary', () => {
  it('quarantines five archived effects before all downstream initialization', () => {
    const copy = clone(data), result = contract.apply(copy);
    expect(copy.effects).toHaveLength(138); expect(copy.quarantinedEffects).toHaveLength(5);
    expect(result.originalEffectCount).toBe(143);
    expect(copy.effects.some(r => r.quarantined)).toBe(false);
    expect(copy.quarantinedEffects.some(r => r.med === 'avacopan' && r.benefit === 4)).toBe(true);
    expect(copy.manifestationLinks.every(r => r.reviewStatus === 'DERIVED_NOT_INDEPENDENTLY_VALIDATED')).toBe(true);
    expect(immuneSource.indexOf('AtlasSourceReview.apply(DATA)')).toBeLessThan(immuneSource.indexOf('const COND='));
    expect(contract.apply(copy)).toBe(result);
  });
  it('automatically excludes evidence with a retracted source even without a flag', () => {
    const copy = clone(data); delete copy.effects[75].quarantined;
    contract.apply(copy); expect(copy.effects.some(r => r.med === 'avacopan')).toBe(false);
  });
  it('fails before mutating an invalid source reference', () => {
    const copy = clone(data); copy.effects[0].refs = ['MISSING'];
    expect(() => contract.apply(copy)).toThrow(/Malformed/); expect(copy.effects).toHaveLength(143);
  });
  it('does not treat a string flag as an adjudicated quarantine state', () => {
    const copy = clone(data); copy.effects[0].quarantined = 'false'; expect(() => contract.apply(copy)).toThrow(/Malformed/);
  });
  it('preserves nested source-review metadata and all columns in clinical exports', () => {
    const copy = clone(data); contract.apply(copy); const csv = contract.csv(copy.effects);
    expect(csv).toContain('reviewStatus'); expect(csv).toContain('sourceReview'); expect(csv).toContain('sourceRecordId');
  });
});
it('rejects silent drift in the corrected source-file review receipt', () => {
  const root = new URL('../../../', import.meta.url);
  expect(execFileSync('python3', ['scripts/build-clinical-review-status.py', '--check'], { cwd: root, encoding: 'utf8' })).toContain('659 correction records');
});
